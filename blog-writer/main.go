package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"blog-writer/hugo"
	"blog-writer/posts"
	"blog-writer/server"
	"blog-writer/watcher"
)

//go:embed web
var webFS embed.FS

func main() {
	siteDir := flag.String("site-dir", "", "path to Hugo site root (required)")
	port := flag.Int("port", 2929, "port to listen on")
	noBrowser := flag.Bool("no-browser", false, "don't open browser automatically")
	flag.Parse()

	if *siteDir == "" {
		// default: parent directory of blog-writer/
		cwd, _ := os.Getwd()
		*siteDir = cwd
		log.Printf("No --site-dir specified, using current directory: %s", *siteDir)
	}

	// verify hugo site structure
	if _, err := os.Stat(*siteDir + "/hugo.toml"); err != nil {
		if _, err2 := os.Stat(*siteDir + "/config.toml"); err2 != nil {
			log.Fatalf("Not a Hugo site (no hugo.toml or config.toml found in %s)", *siteDir)
		}
	}

	// create post store
	store := posts.NewStore(*siteDir)

	// start Hugo dev server
	hugoMgr := hugo.NewManager(*siteDir, 1313)
	if err := hugoMgr.Start(); err != nil {
		log.Printf("Warning: failed to start Hugo dev server: %v", err)
		log.Println("Preview will not be available until Hugo server is running on port 1313")
	}

	// start file watcher
	fileWatcher, err := watcher.New(*siteDir + "/content")
	if err != nil {
		log.Printf("Warning: failed to create file watcher: %v", err)
	}

	// embed web files
	webSubFS, _ := fs.Sub(webFS, "web")

	// create HTTP server
	srv := server.New(store, hugoMgr, fileWatcher, webSubFS, *siteDir)

	// HTTP mux
	mux := http.NewServeMux()
	srv.RegisterRoutes(mux)

	// start listening
	addr := fmt.Sprintf("127.0.0.1:%d", *port)
	httpServer := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	// graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigCh
		log.Println("\nShutting down...")
		cancel()
		hugoMgr.Stop()
		fileWatcher.Close()
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()
		httpServer.Shutdown(shutdownCtx)
	}()

	go func() {
		// pump hugo rebuild events to file watcher channel
		for event := range hugoMgr.Events() {
			fileWatcher.BroadcastHugoEvent(event)
		}
	}()

	url := fmt.Sprintf("http://%s", addr)
	log.Printf("blog-writer starting at %s", url)
	log.Printf("Hugo site: %s", *siteDir)

	if !*noBrowser {
		openBrowser(url)
	}

	if err := httpServer.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
	_ = ctx
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	default:
		return
	}
	if err := cmd.Start(); err != nil {
		log.Printf("Failed to open browser: %v", err)
	}
}
