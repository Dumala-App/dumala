# Git Release Workflow

Use this checklist when a completed Codex change is ready to commit, push, and merge into protected `main`.

1. Confirm the worktree and branch.

   ```bash
   git status --short --branch
   ```

2. Run the quality checks.

   ```bash
   npm run lint
   npm test -- --reporter=dot
   npm run build -- --logLevel=error
   ```

3. Create or switch to a `codex/` feature branch.

   ```bash
   git switch -c codex/short-change-name
   ```

4. Stage and commit the scoped changes.

   ```bash
   git add <changed-files>
   git commit -m "Describe the completed change"
   ```

5. Push the branch and open a pull request.

   ```bash
   git push -u origin codex/short-change-name
   gh pr create --base main --head codex/short-change-name --title "Describe the completed change" --body "Summary and verification"
   ```

6. Wait for required checks, merge, then update local `main`.

   ```bash
   gh pr checks --watch
   gh pr merge --squash --delete-branch
   git switch main
   git pull --ff-only origin main
   ```

Direct pushes to `main` are blocked by branch protection, so use a pull request even for small changes.
