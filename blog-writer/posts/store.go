package posts

import (
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

// PostMeta holds metadata for listing
type PostMeta struct {
	Slug    string `json:"slug"`
	Title   string `json:"title"`
	Date    string `json:"date"`
	Summary string `json:"summary"`
	Draft   bool   `json:"draft"`
	Math    bool   `json:"math"`
}

// Post holds full post data for editing
type Post struct {
	Slug     string            `json:"slug"`
	FrontMatter map[string]any `json:"frontmatter"`
	Body     string            `json:"body"`
	Raw      string            `json:"raw"`
	Media    []string          `json:"media"`
}

// Store manages post files on disk
type Store struct {
	siteDir  string
	postsDir string
}

// NewStore creates a new post store
func NewStore(siteDir string) *Store {
	return &Store{
		siteDir:  siteDir,
		postsDir: filepath.Join(siteDir, "content", "posts"),
	}
}

// List returns all posts sorted by date descending
func (s *Store) List() ([]PostMeta, error) {
	entries, err := os.ReadDir(s.postsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading posts dir: %w", err)
	}

	var posts []PostMeta
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		slug := entry.Name()
		indexPath := filepath.Join(s.postsDir, slug, "index.md")
		data, err := os.ReadFile(indexPath)
		if err != nil {
			continue
		}
		meta := parseFrontMatter(string(data))
		meta.Slug = slug
		posts = append(posts, meta)
	}

	sort.Slice(posts, func(i, j int) bool {
		ti, ei := parseDate(posts[i].Date)
		tj, ej := parseDate(posts[j].Date)
		if ei != nil || ej != nil {
			return posts[i].Slug > posts[j].Slug
		}
		return ti.After(tj)
	})

	return posts, nil
}

// Get reads a post's full content
func (s *Store) Get(slug string) (*Post, error) {
	dir := filepath.Join(s.postsDir, slug)
	indexPath := filepath.Join(dir, "index.md")

	data, err := os.ReadFile(indexPath)
	if err != nil {
		return nil, fmt.Errorf("reading post %s: %w", slug, err)
	}

	raw := string(data)
	frontMatter, body := splitFrontMatter(raw)

	// list media files
	var media []string
	mediaEntries, _ := os.ReadDir(dir)
	for _, e := range mediaEntries {
		name := e.Name()
		if name == "index.md" || strings.HasPrefix(name, ".") {
			continue
		}
		if !e.IsDir() {
			media = append(media, name)
		}
	}

	return &Post{
		Slug:        slug,
		FrontMatter: frontMatter,
		Body:        body,
		Raw:         raw,
		Media:       media,
	}, nil
}

// Save writes a post to disk
func (s *Store) Save(slug string, raw string) error {
	dir := filepath.Join(s.postsDir, slug)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("creating post dir: %w", err)
	}

	indexPath := filepath.Join(dir, "index.md")
	return os.WriteFile(indexPath, []byte(raw), 0644)
}

// Create makes a new post directory and index.md
func (s *Store) Create(slug string) error {
	dir := filepath.Join(s.postsDir, slug)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("creating post dir: %w", err)
	}

	indexPath := filepath.Join(dir, "index.md")
	if _, err := os.Stat(indexPath); err == nil {
		return fmt.Errorf("post %s already exists", slug)
	}

	now := time.Now().Format("2006-01-02T15:04:05-07:00")
	content := fmt.Sprintf(`+++
date = '%s'
draft = false
math = true
title = ''
summary = ''
+++

`, now)

	return os.WriteFile(indexPath, []byte(content), 0644)
}

// Delete removes a post directory
func (s *Store) Delete(slug string) error {
	dir := filepath.Join(s.postsDir, slug)
	// verify it's a valid post directory
	indexPath := filepath.Join(dir, "index.md")
	if _, err := os.Stat(indexPath); err != nil {
		return fmt.Errorf("post %s not found", slug)
	}
	return os.RemoveAll(dir)
}

// SaveMedia saves an uploaded file to the post's page bundle
func (s *Store) SaveMedia(slug string, filename string, data []byte) (string, error) {
	dir := filepath.Join(s.postsDir, slug)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("creating post dir: %w", err)
	}

	// sanitize filename
	safeName := filepath.Base(filename)
	safeName = regexp.MustCompile(`[^a-zA-Z0-9._-]`).ReplaceAllString(safeName, "_")

	// add random suffix to avoid collisions (e.g. multiple pasted "image.png")
	ext := filepath.Ext(safeName)
	base := strings.TrimSuffix(safeName, ext)
	suffix := fmt.Sprintf("-%04x", rand.Intn(0xffff))
	safeName = base + suffix + ext

	dst := filepath.Join(dir, safeName)
	if err := os.WriteFile(dst, data, 0644); err != nil {
		return "", fmt.Errorf("saving media: %w", err)
	}

	return safeName, nil
}

// HugoURL returns the preview URL for a post
func (s *Store) HugoURL(slug string) string {
	return fmt.Sprintf("/posts/%s/", slug)
}

// --- helpers ---

var tomlKVRe = regexp.MustCompile(`^(\w+)\s*=\s*(.*)$`)

func parseFrontMatter(raw string) PostMeta {
	meta := PostMeta{}
	fm, _ := splitFrontMatter(raw)

	if v, ok := fm["title"]; ok {
		meta.Title = fmt.Sprintf("%v", v)
	}
	if v, ok := fm["date"]; ok {
		meta.Date = fmt.Sprintf("%v", v)
	}
	if v, ok := fm["summary"]; ok {
		meta.Summary = fmt.Sprintf("%v", v)
	}
	if v, ok := fm["draft"]; ok {
		switch val := v.(type) {
		case bool:
			meta.Draft = val
		case string:
			meta.Draft = val == "true"
		}
	}
	if v, ok := fm["math"]; ok {
		switch val := v.(type) {
		case bool:
			meta.Math = val
		case string:
			meta.Math = val == "true"
		}
	}

	return meta
}

func splitFrontMatter(raw string) (map[string]any, string) {
	result := make(map[string]any)
	lines := strings.Split(raw, "\n")

	// find TOML frontmatter between +++ delimiters
	if len(lines) < 3 || strings.TrimSpace(lines[0]) != "+++" {
		return result, raw
	}

	endIdx := -1
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == "+++" {
			endIdx = i
			break
		}
	}

	if endIdx == -1 {
		return result, raw
	}

	// parse TOML key-value pairs
	for i := 1; i < endIdx; i++ {
		line := strings.TrimSpace(lines[i])
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		matches := tomlKVRe.FindStringSubmatch(line)
		if matches == nil {
			continue
		}
		key := matches[1]
		val := strings.TrimSpace(matches[2])
		// strip surrounding quotes
		if len(val) >= 2 && val[0] == '\'' && val[len(val)-1] == '\'' {
			val = val[1 : len(val)-1]
		} else if len(val) >= 2 && val[0] == '"' && val[len(val)-1] == '"' {
			val = val[1 : len(val)-1]
		}
		// handle booleans
		if val == "true" {
			result[key] = true
		} else if val == "false" {
			result[key] = false
		} else {
			result[key] = val
		}
	}

	body := strings.Join(lines[endIdx+1:], "\n")
	return result, body
}

func parseDate(s string) (time.Time, error) {
	layouts := []string{
		time.RFC3339,
		"2006-01-02T15:04:05-07:00",
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse date: %s", s)
}
