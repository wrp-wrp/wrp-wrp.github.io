package hugo

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os/exec"
	"strings"
	"sync"
	"time"
)

// Manager manages the Hugo dev server subprocess
type Manager struct {
	siteDir string
	port    int
	cmd     *exec.Cmd
	mu      sync.Mutex
	events  chan string
	done    chan struct{}
}

// NewManager creates a new Hugo manager
func NewManager(siteDir string, port int) *Manager {
	return &Manager{
		siteDir: siteDir,
		port:    port,
		events:  make(chan string, 32),
		done:    make(chan struct{}),
	}
}

// Start launches the Hugo dev server
func (m *Manager) Start() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// kill any existing hugo process on the port
	m.killExisting()

	m.cmd = exec.Command("hugo", "server", "-D", "--disableLiveReload",
		fmt.Sprintf("--port=%d", m.port), "--bind=127.0.0.1")
	m.cmd.Dir = m.siteDir

	stdout, err := m.cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("hugo stdout pipe: %w", err)
	}
	stderr, err := m.cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("hugo stderr pipe: %w", err)
	}

	if err := m.cmd.Start(); err != nil {
		return fmt.Errorf("starting hugo: %w", err)
	}

	log.Printf("Hugo dev server started on port %d (PID: %d)", m.port, m.cmd.Process.Pid)

	// read stdout for rebuild notifications
	go m.readOutput(stdout, "stdout")
	go m.readOutput(stderr, "stderr")

	// monitor process
	go func() {
		err := m.cmd.Wait()
		select {
		case <-m.done:
			return
		default:
		}
		if err != nil {
			log.Printf("Hugo process exited: %v", err)
			// try to restart after a delay
			time.Sleep(2 * time.Second)
			m.mu.Lock()
			m.cmd = nil
			m.mu.Unlock()
			if restartErr := m.Start(); restartErr != nil {
				log.Printf("Failed to restart Hugo: %v", restartErr)
			}
		}
	}()

	return nil
}

// Stop gracefully shuts down the Hugo server
func (m *Manager) Stop() {
	close(m.done)
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.cmd != nil && m.cmd.Process != nil {
		m.cmd.Process.Kill()
		m.cmd = nil
	}
}

// Events returns a channel that receives Hugo rebuild events
func (m *Manager) Events() <-chan string {
	return m.events
}

// URL returns the Hugo dev server URL
func (m *Manager) URL() string {
	return fmt.Sprintf("http://127.0.0.1:%d", m.port)
}

func (m *Manager) readOutput(r io.Reader, source string) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
		log.Printf("[hugo-%s] %s", source, line)

		if strings.Contains(line, "Rebuilt in") {
			select {
			case m.events <- "rebuilt":
			default:
			}
		}
		if strings.Contains(line, "ERROR") {
			select {
			case m.events <- "error:" + line:
			default:
			}
		}
	}
}

func (m *Manager) killExisting() {
	// try to kill any process using our port
	exec.Command("sh", "-c", fmt.Sprintf("lsof -ti:%d | xargs kill -9 2>/dev/null", m.port)).Run()
	time.Sleep(500 * time.Millisecond)
}
