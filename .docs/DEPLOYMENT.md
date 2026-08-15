# Bikie CI/CD Deployment Guide

This document outlines the GitHub Actions deployment workflow for deploying the Bikie web application to our production VPS. The CI/CD process focuses on reliability, safe PostgreSQL management, and automated health checks.

## A. CI/CD Architecture

The deployment architecture uses GitHub Actions to remotely orchestrate deployment on the VPS via SSH:
1. **GitHub Actions Runner** authenticates with the VPS using SSH.
2. **VPS Script Execution** pulls the latest code, builds a new `web` Docker image, and selectively updates the container.
3. **Database Safety**: `postgres` is intentionally preserved and not rebuilt, ensuring the production database remains untouched.
4. **Health Check**: An automated curl-based health ping runs locally on the VPS against port `3001` before marking the deployment as successful.

## B. Files Created/Modified

- `.github/workflows/deploy.yml`: The GitHub Actions workflow file that handles the automated deployment logic.
- `.docs/DEPLOYMENT.md`: This deployment documentation guide.

## C. Complete Workflow Behavior

When code is pushed to the `master` branch:
1. A GitHub runner provisions an SSH connection to the VPS.
2. The workflow verifies there are no uncommitted changes in `/opt/bikie` using `git status --porcelain`.
3. If clean, it runs `git pull origin master`.
4. It builds the new `web` container via `docker compose build web`.
5. It selectively updates and starts the web service via `docker compose up -d web`.
6. A health loop pings `http://127.0.0.1:3001/` every 2 seconds (up to 60s) to verify successful startup.
7. If the health check fails, the workflow aborts and dumps container logs.

## D. GitHub Secrets Required

You must configure the following **Repository Secrets** in GitHub (Settings > Secrets and variables > Actions):

- `VPS_HOST`: The IP address or domain name of your production VPS (e.g., `123.45.67.89`).
- `VPS_USER`: The SSH username (e.g., `root`).
- `VPS_SSH_KEY`: The private SSH key corresponding to the public key on the VPS `authorized_keys`.

## E. One-Time VPS Setup Commands Required

If your VPS is already running the application manually, there's very little setup needed. Just ensure the SSH key you provide in GitHub Secrets is authorized on the VPS:

1. Create an SSH key pair (e.g., on your local machine, not inside the repo):
   `ssh-keygen -t rsa -b 4096 -f ./deploy_key`
2. Add the contents of `deploy_key.pub` to `/root/.ssh/authorized_keys` on your VPS.
3. Paste the contents of `deploy_key` (the private key) into the `VPS_SSH_KEY` GitHub Secret.
4. Ensure the repository on the VPS is in a clean state:
   `cd /opt/bikie && git status` (Must be clean!)

## F. GitHub-Side Setup Required

- Add the secrets mentioned in section D.
- Push the `.github/workflows/deploy.yml` file to the `master` branch.

## G. Deployment Flow After Setup

You simply run:
`git push origin master`

GitHub Actions handles the rest automatically. You can monitor the progress on the "Actions" tab in your repository.

## H. Database Safety Explanation

The CI/CD pipeline executes `docker compose up -d web`. Because we specifically target the `web` service, Docker Compose knows *not* to stop, recreate, or reset the `postgres` service. The Postgres container, the volumes, and the data remain completely uninterrupted and intact. We strictly avoid commands like `docker compose down -v` or `docker system prune -a`.

## I. How Prisma Migrations are Handled

When the `web` container spins up, its Docker entrypoint (`docker/entrypoint.sh`) runs:
`npx prisma migrate deploy`

This command safely applies any new migrations against the live database without resetting existing data. The CI/CD pipeline relies entirely on the existing entrypoint to handle this safely.

## J. How Failed Deployments Behave

- **Git conflicts/dirty tree:** Aborts early before pulling, logging the local changes.
- **Docker build fails:** The existing `web` container remains running untouched.
- **Health check fails:** The workflow prints the last 100 lines of `web` container logs to GitHub Actions and fails the build. The container might end up in a crash loop, but data remains safe.
- **Rollback:** The workflow intentionally does *not* automatically run database rollback commands, as reverting schema changes is often destructive. A rollback involves reverting the git commit and pushing again.

## K. Manual Deployment Fallback

If GitHub Actions is down, deploy manually:
1. `ssh root@<VPS_IP>`
2. `cd /opt/bikie`
3. `git pull origin master`
4. `docker compose build web`
5. `docker compose up -d web`

## L. Remaining Risks & Recommendations

- **Untracked `docker-compose.yml` changes**: If you have modified `docker-compose.yml` directly on the VPS to add the `postgres` service, `git pull` will fail. **Recommendation**: Move your `postgres` service into a `docker-compose.override.yml` file on the VPS and add that file to `.gitignore`. This ensures your `git pull` operations remain clean.
- **Docker cleanup**: Since `docker compose build web` generates new images, disk space will eventually fill up. Consider adding a weekly cron job on the VPS running `docker image prune -f` to clean up dangling/old images safely.
