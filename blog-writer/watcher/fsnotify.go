package watcher

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Watcher monitors file changes and broadcasts to WebSocket clients
type Watcher struct {
	fsWatcher *fsnotify.Watcher
	clients   map[*websocket.Conn]bool
	mu        sync.Mutex
	done      chan struct{}
}

// New creates a file watcher for the given directory
func New(dir string) (*Watcher, error) {
	fsWatcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	if err := fsWatcher.Add(dir); err != nil {
		fsWatcher.Close()
		return nil, err
	}

	// also watch subdirectories
	entries, _ := readDirs(dir)
	for _, d := range entries {
		fsWatcher.Add(d)
	}

	w := &Watcher{
		fsWatcher: fsWatcher,
		clients:   make(map[*websocket.Conn]bool),
		done:      make(chan struct{}),
	}

	go w.loop()

	return w, nil
}

// Close stops the watcher
func (w *Watcher) Close() {
	close(w.done)
	w.fsWatcher.Close()
	w.mu.Lock()
	for c := range w.clients {
		c.Close()
	}
	w.mu.Unlock()
}

// HandleWS handles WebSocket upgrade requests
func (w *Watcher) HandleWS(rw http.ResponseWriter, req *http.Request) {
	conn, err := upgrader.Upgrade(rw, req, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	w.mu.Lock()
	w.clients[conn] = true
	w.mu.Unlock()

	// keep connection alive, read to detect disconnect
	go func() {
		defer func() {
			w.mu.Lock()
			delete(w.clients, conn)
			w.mu.Unlock()
			conn.Close()
		}()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()
}

// BroadcastHugoEvent sends a Hugo rebuild event to all clients
func (w *Watcher) BroadcastHugoEvent(event string) {
	w.broadcast(map[string]string{
		"type":  "hugo",
		"event": event,
		"time":  time.Now().Format(time.RFC3339),
	})
}

func (w *Watcher) loop() {
	// debounce file events
	var debounceTimer *time.Timer
	var pendingEvent string

	for {
		select {
		case <-w.done:
			return
		case event, ok := <-w.fsWatcher.Events:
			if !ok {
				return
			}
			// ignore hidden files and DS_Store
			if isIgnored(event.Name) {
				continue
			}
			// watch new directories
			if event.Has(fsnotify.Create) {
				if isDir(event.Name) {
					w.fsWatcher.Add(event.Name)
				}
			}
			pendingEvent = event.Name
			if debounceTimer == nil {
				debounceTimer = time.AfterFunc(200*time.Millisecond, func() {
					w.broadcast(map[string]string{
						"type": "file",
						"path": pendingEvent,
						"time": time.Now().Format(time.RFC3339),
					})
				})
			} else {
				debounceTimer.Reset(200 * time.Millisecond)
			}
		case err, ok := <-w.fsWatcher.Errors:
			if !ok {
				return
			}
			log.Printf("File watcher error: %v", err)
		}
	}
}

func (w *Watcher) broadcast(msg map[string]string) {
	data, _ := json.Marshal(msg)
	w.mu.Lock()
	defer w.mu.Unlock()
	for conn := range w.clients {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			conn.Close()
			delete(w.clients, conn)
		}
	}
}

func isIgnored(path string) bool {
	name := filepath.Base(path)
	return name == ".DS_Store" || name[0] == '.'
}

func isDir(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func readDirs(dir string) ([]string, error) {
	var dirs []string
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	for _, e := range entries {
		if e.IsDir() && e.Name()[0] != '.' {
			sub := filepath.Join(dir, e.Name())
			dirs = append(dirs, sub)
			subs, _ := readDirs(sub)
			dirs = append(dirs, subs...)
		}
	}
	return dirs, nil
}
