package gitops

import (
	"fmt"
	"os/exec"
	"strings"
)

// Ops wraps git operations for the Hugo site
type Ops struct {
	siteDir string
}

// NewOps creates a new git operations handler
func NewOps(siteDir string) *Ops {
	return &Ops{siteDir: siteDir}
}

// Status returns the git status output
func (o *Ops) Status() (string, error) {
	return o.run("status", "--short")
}

// Diff returns the diff of staged + unstaged changes
func (o *Ops) Diff() (string, error) {
	staged, _ := o.run("diff", "--cached", "--stat")
	unstaged, _ := o.run("diff", "--stat")
	fullDiff, _ := o.run("diff")

	// also check untracked files
	status, _ := o.run("status", "--porcelain")
	var untracked []string
	for _, line := range strings.Split(status, "\n") {
		if strings.HasPrefix(line, "??") {
			untracked = append(untracked, strings.TrimPrefix(line[2:], " "))
		}
	}

	var result strings.Builder
	if staged != "" {
		result.WriteString("=== Staged changes ===\n")
		result.WriteString(staged)
		result.WriteString("\n")
	}
	if unstaged != "" {
		result.WriteString("=== Unstaged changes ===\n")
		result.WriteString(unstaged)
		result.WriteString("\n")
	}
	if len(untracked) > 0 {
		result.WriteString("=== New files ===\n")
		for _, f := range untracked {
			result.WriteString(fmt.Sprintf("  + %s\n", f))
		}
	}

	if fullDiff != "" {
		result.WriteString("\n=== Full diff ===\n")
		result.WriteString(fullDiff)
	}

	if result.Len() == 0 {
		result.WriteString("No changes.")
	}

	return result.String(), nil
}

// Publish stages all changes, commits, and pushes
func (o *Ops) Publish(message string) (string, error) {
	var output strings.Builder

	// git add -A
	out, err := o.run("add", "-A")
	output.WriteString("git add -A:\n")
	output.WriteString(out)
	output.WriteString("\n")
	if err != nil {
		return output.String(), fmt.Errorf("git add: %w", err)
	}

	// check if there's anything to commit
	diffOut, _ := o.run("diff", "--cached", "--quiet")
	if diffOut == "" {
		// also check for untracked files
		status, _ := o.run("status", "--porcelain")
		if status == "" {
			output.WriteString("Nothing to commit.\n")
			return output.String(), nil
		}
	}

	// git commit
	out, err = o.run("commit", "-m", message)
	output.WriteString("\ngit commit:\n")
	output.WriteString(out)
	output.WriteString("\n")
	if err != nil {
		return output.String(), fmt.Errorf("git commit: %w", err)
	}

	// git push
	out, err = o.run("push", "origin", "HEAD")
	output.WriteString("\ngit push:\n")
	output.WriteString(out)
	output.WriteString("\n")
	if err != nil {
		return output.String(), fmt.Errorf("git push: %w", err)
	}

	return output.String(), nil
}

func (o *Ops) run(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = o.siteDir
	out, err := cmd.CombinedOutput()
	return strings.TrimSpace(string(out)), err
}
