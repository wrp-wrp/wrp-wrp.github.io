package server

import (
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"blog-writer/gitops"
	"blog-writer/hugo"
	"blog-writer/posts"
	"blog-writer/watcher"
)

// Server handles HTTP requests
type Server struct {
	store    *posts.Store
	hugo     *hugo.Manager
	watcher  *watcher.Watcher
	git      *gitops.Ops
	webFS    fs.FS
}

// New creates a new server
func New(store *posts.Store, hugoMgr *hugo.Manager, w *watcher.Watcher, webFS fs.FS, siteDir string) *Server {
	return &Server{
		store:   store,
		hugo:    hugoMgr,
		watcher: w,
		git:     gitops.NewOps(siteDir),
		webFS:   webFS,
	}
}

// RegisterRoutes registers all HTTP routes
func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	// web UI
	mux.Handle("/", http.FileServer(http.FS(s.webFS)))

	// API routes
	mux.HandleFunc("/api/posts", s.handlePosts)
	mux.HandleFunc("/api/posts/", s.handlePost)
	mux.HandleFunc("/api/publish", s.handlePublish)
	mux.HandleFunc("/api/publish/diff", s.handleDiff)

	// WebSocket
	mux.HandleFunc("/api/live", s.watcher.HandleWS)
}

func (s *Server) handlePosts(rw http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		posts, err := s.store.List()
		if err != nil {
			writeError(rw, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(rw, posts)

	case http.MethodPost:
		var body struct {
			Slug string `json:"slug"`
		}
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			writeError(rw, http.StatusBadRequest, "invalid request body")
			return
		}
		if body.Slug == "" {
			writeError(rw, http.StatusBadRequest, "slug is required")
			return
		}
		if err := s.store.Create(body.Slug); err != nil {
			writeError(rw, http.StatusConflict, err.Error())
			return
		}
		writeJSON(rw, map[string]string{"slug": body.Slug, "status": "created"})

	default:
		writeError(rw, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handlePost(rw http.ResponseWriter, req *http.Request) {
	// extract slug from path: /api/posts/{slug} or /api/posts/{slug}/media
	path := strings.TrimPrefix(req.URL.Path, "/api/posts/")
	parts := strings.SplitN(path, "/", 2)
	slug := parts[0]

	if slug == "" {
		writeError(rw, http.StatusBadRequest, "slug is required")
		return
	}

	// handle media upload
	if len(parts) == 2 && parts[1] == "media" && req.Method == http.MethodPost {
		s.handleMediaUpload(rw, req, slug)
		return
	}

	switch req.Method {
	case http.MethodGet:
		post, err := s.store.Get(slug)
		if err != nil {
			writeError(rw, http.StatusNotFound, err.Error())
			return
		}
		writeJSON(rw, post)

	case http.MethodPut:
		var body struct {
			Raw string `json:"raw"`
		}
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			writeError(rw, http.StatusBadRequest, "invalid request body")
			return
		}
		if err := s.store.Save(slug, body.Raw); err != nil {
			writeError(rw, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(rw, map[string]string{"slug": slug, "status": "saved"})

	case http.MethodDelete:
		if err := s.store.Delete(slug); err != nil {
			writeError(rw, http.StatusNotFound, err.Error())
			return
		}
		writeJSON(rw, map[string]string{"slug": slug, "status": "deleted"})

	default:
		writeError(rw, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleMediaUpload(rw http.ResponseWriter, req *http.Request, slug string) {
	if req.Method != http.MethodPost {
		writeError(rw, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	file, header, err := req.FormFile("file")
	if err != nil {
		writeError(rw, http.StatusBadRequest, "missing file")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		writeError(rw, http.StatusInternalServerError, "reading file")
		return
	}

	name, err := s.store.SaveMedia(slug, header.Filename, data)
	if err != nil {
		writeError(rw, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(rw, map[string]string{
		"filename": name,
		"url":      name,
		"status":   "uploaded",
	})
}

func (s *Server) handlePublish(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		writeError(rw, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		writeError(rw, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Message == "" {
		body.Message = "blog: update posts"
	}

	output, err := s.git.Publish(body.Message)
	if err != nil {
		writeJSON(rw, map[string]any{
			"status": "error",
			"output": output,
			"error":  err.Error(),
		})
		return
	}

	writeJSON(rw, map[string]any{
		"status": "published",
		"output": output,
	})
}

func (s *Server) handleDiff(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		writeError(rw, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	diff, err := s.git.Diff()
	if err != nil {
		writeError(rw, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(rw, map[string]string{"diff": diff})
}

func writeJSON(rw http.ResponseWriter, data any) {
	rw.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(rw).Encode(data); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

func writeError(rw http.ResponseWriter, code int, msg string) {
	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(code)
	json.NewEncoder(rw).Encode(map[string]string{"error": msg})
}
