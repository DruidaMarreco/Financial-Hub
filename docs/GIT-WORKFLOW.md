# Git Workflow - Financial Hub

## Branch Strategy

This project uses a **feature branch workflow** with the following structure:

```
main (production/stable)
  ↑
  ├─ Pull Requests (from dev after testing)
  │
dev (development/integration)
  ↑
  ├─ feature/* (feature branches)
  ├─ fix/* (bug fix branches)
  └─ refactor/* (refactoring branches)
```

## Branch Naming Conventions

- **Feature branches**: `feature/description` (e.g., `feature/plaid-integration`)
- **Bug fixes**: `fix/description` (e.g., `fix/transaction-sync-bug`)
- **Refactoring**: `refactor/description` (e.g., `refactor/optimize-db-queries`)
- **Documentation**: `docs/description` (e.g., `docs/api-guide`)

## Workflow Steps

### 1. Starting a New Feature

```bash
# Make sure dev is up to date
git checkout dev
git pull origin dev

# Create feature branch from dev
git checkout -b feature/your-feature-name
```

### 2. Making Commits

```bash
# Make your changes
# ... edit files ...

# Stage changes
git add .
git add specific-file.ts    # or add specific files

# Commit with clear message
git commit -m "feat(scope): description of change"

# You can make multiple commits on your feature branch
# Just make sure each commit is atomic (one logical change)
git commit -m "feat(scope): first change"
git commit -m "feat(scope): second change"
```

**Commit message format:**
```
type(scope): subject

Optional body - explain what and why, not how

Optional footer
- Closes #123
- BREAKING CHANGE: description
```

**Types:**
- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation only
- `style` - Changes that don't affect code meaning (formatting, etc)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Code change that improves performance
- `test` - Adding or updating tests
- `chore` - Changes to build process, dependencies, etc

### 3. Pushing to Remote

```bash
# First push - set upstream tracking
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

### 4. Creating a Pull Request

When your feature is ready:

1. Push your branch to remote
2. Go to GitHub: https://github.com/DruidaMarreco/Financial-Hub
3. Click "New Pull Request"
4. Select:
   - **Base**: `dev`
   - **Compare**: `feature/your-feature-name`

**PR Title Format:**
```
[TYPE] Brief description - max 70 characters

Examples:
[FEATURE] Add Plaid bank account integration
[FIX] Fix transaction sync timing issue
[REFACTOR] Optimize database queries
```

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce.

## Changes Made
- Change 1
- Change 2
- Change 3

## Checklist
- [ ] Code follows the project style guidelines
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated
- [ ] No breaking changes introduced
- [ ] Commits are atomic and well-documented
```

### 5. Merging Back to Dev

After your PR is approved and tests pass:

```bash
# Option 1: Merge through GitHub UI (Recommended)
# Click "Merge Pull Request" on GitHub

# Option 2: Merge locally
git checkout dev
git pull origin dev
git merge feature/your-feature-name
git push origin dev

# Delete feature branch locally
git branch -d feature/your-feature-name

# Delete feature branch on remote
git push origin --delete feature/your-feature-name
```

### 6. When Dev Is Ready for Production

Create a PR from `dev` → `main`:

```bash
# On GitHub:
# 1. Go to Pull Requests
# 2. Create new PR
# 3. Base: main, Compare: dev
# 4. Add release notes in description
# 5. Merge with "Create a merge commit"
```

## Handling Issues

### Updating Your Feature Branch

If `dev` has been updated while you're working:

```bash
# Method 1: Rebase (keeps history clean)
git fetch origin
git rebase origin/dev
git push --force-with-lease

# Method 2: Merge (simpler, creates merge commit)
git merge origin/dev
git push
```

### Resolving Conflicts

```bash
# If conflicts occur during rebase/merge:
git status  # See conflicted files

# Fix conflicts manually in your editor
# Then:
git add conflicted-file.ts
git rebase --continue  # or git merge --continue
git push
```

### Undoing Changes

```bash
# Undo last unpushed commit (keep changes)
git reset --soft HEAD~1

# Undo last unpushed commit (discard changes)
git reset --hard HEAD~1

# Undo pushed commit (creates new commit that reverts it)
git revert COMMIT_HASH
git push
```

## Viewing Changes

```bash
# See what changed in your branch
git diff dev  # vs dev branch
git log --oneline dev..  # commits not in dev

# See branches
git branch -a  # all branches
git branch -vv  # with tracking info

# See commits
git log --oneline -10
git log --graph --all --oneline --decorate
```

## Tips & Best Practices

✅ **DO:**
- Keep commits atomic and focused
- Write clear commit messages
- Push frequently (backup your work)
- Create PRs before merging
- Use descriptive branch names
- Review your own PR first
- Document breaking changes

❌ **DON'T:**
- Commit directly to `main` or `dev`
- Make huge commits with unrelated changes
- Use vague messages like "update" or "fix"
- Force push to shared branches
- Merge without review/testing
- Leave old branches lying around

## Common Commands Cheat Sheet

```bash
# Setup
git remote add origin <url>
git checkout -b feature/name

# Working
git status
git add .
git commit -m "message"
git push -u origin feature/name

# Updating
git fetch origin
git rebase origin/dev  # or git merge origin/dev
git push --force-with-lease

# Cleanup
git branch -d feature/name
git push origin --delete feature/name

# Info
git log --oneline
git diff
git branch -a
```

## Need Help?

- Check your current branch: `git branch`
- See recent commits: `git log --oneline -10`
- Check remote status: `git remote -v`
- See what's different: `git diff origin/dev`
