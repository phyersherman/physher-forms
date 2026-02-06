# Git Workflow Guide

This project now uses Git for version control. Here are some common commands for working with the codebase:

## View Git Status
```bash
git status
```

## View Commit History
```bash
git log --oneline
git log --oneline -10  # Last 10 commits
```

## Create a New Branch for Features
```bash
git checkout -b feature/your-feature-name
git checkout -b bugfix/fix-description
```

## Switch Branches
```bash
git checkout BRANCH_NAME
git checkout main  # Switch back to main
```

## Commit Changes
```bash
git add .
git commit -m "Your descriptive commit message"
```

## View Differences Before Committing
```bash
git diff                 # Unstaged changes
git diff --staged       # Staged changes
```

## Rollback to Previous Commit
```bash
git reset --hard COMMIT_HASH  # Discard all changes, go to specific commit
git revert COMMIT_HASH        # Create a new commit that undoes changes
```

## Merge Branches
```bash
git checkout main
git merge feature-branch-name
```

## Useful Aliases (Optional)
Add these to your shell configuration (~/.zshrc or ~/.bash_profile):
```bash
alias gst='git status'
alias glog='git log --oneline -10'
alias gbr='git branch'
alias gadd='git add -A'
alias gcm='git commit -m'
```

## Current Branches
- **main**: Stable, working version of the LMS

## Key Commits
- **286c94e**: Initial commit - Multi-tenant LMS with working editor layout

## Next Steps for Feature Development
1. Create a feature branch: `git checkout -b feature/rich-text-editor`
2. Make your changes
3. Commit regularly with descriptive messages
4. When ready, merge back to main: `git merge feature/rich-text-editor`

## Important Notes
- The `.gitignore` file excludes node_modules, .next build artifacts, and other temporary files
- Always pull/sync before starting new work
- Make small, focused commits with clear messages
- Use feature branches for experimental work to keep main stable
