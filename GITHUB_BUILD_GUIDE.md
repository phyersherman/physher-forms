# Building and Pushing Docker Images to GitHub

This guide walks you through getting your LMS Docker images built and published to GitHub Container Registry.

## Step 1: Verify Your Repository Setup

First, ensure you have a GitHub repository for this project.

**If you don't have a repository yet:**

```bash
# Navigate to project root
cd /Users/hubby/Library/CloudStorage/OneDrive-SharedLibraries-RheapData/Company\ Files\ -\ Documents/LMS

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: LMS with production deployment"

# Create repository on GitHub (via web interface):
# 1. Go to github.com
# 2. Click "+" → "New repository"
# 3. Name it "lms" (or your preferred name)
# 4. Don't initialize with README (you already have code)
# 5. Copy the repository URL

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/lms.git
git branch -M main
git push -u origin main
```

## Step 2: Enable GitHub Actions

1. **Go to your repository on GitHub**
   - Navigate to `https://github.com/YOUR_USERNAME/YOUR_REPO`

2. **Go to Settings → Actions → General**
   - Scroll to **"Workflow permissions"**
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**
   - Click **"Save"**

   ![Workflow Permissions](https://docs.github.com/assets/cb-8186/images/help/settings/actions-workflow-permissions.png)

## Step 3: Verify Workflow Files

Check that the workflow file exists:

```bash
# Should show the workflow file
ls -la .github/workflows/docker-build.yml
```

If the file is missing, you need to create it. It should already exist from the previous setup.

## Step 4: Push Code to Trigger Build

The GitHub Actions workflow is configured to run on pushes to `main` branch:

```bash
# Make sure you're on main branch
git branch

# If you have uncommitted changes, commit them
git status
git add .
git commit -m "Add production deployment infrastructure"

# Push to GitHub (triggers the workflow)
git push origin main
```

## Step 5: Monitor the Build

1. **Go to the Actions tab** in your GitHub repository
   - URL: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

2. **You should see a workflow run** called "Build and Push Docker Images"
   - It will show as running (yellow dot) or completed (green check)

3. **Click on the workflow run** to see details
   - It builds two images in parallel: `backend` and `frontend`
   - Each build takes ~5-10 minutes

4. **Wait for completion**
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed (click to see error logs)

## Step 6: Verify Images Were Published

After the workflow completes successfully:

1. **Go to your GitHub profile or organization page**
   - URL: `https://github.com/YOUR_USERNAME?tab=packages`

2. **You should see two packages:**
   - `lms/backend`
   - `lms/frontend`

3. **Click on each package** to verify:
   - It shows recent versions
   - Tags include `latest` and your commit SHA

## Step 7: Make Packages Public (Recommended)

By default, packages are private. Making them public means you won't need authentication to pull images on your server.

For each package (`backend` and `frontend`):

1. **Click on the package name**
2. **Click "Package settings"** (right sidebar)
3. **Scroll to "Danger zone"**
4. **Click "Change visibility"**
5. **Select "Public"**
6. **Type the repository name to confirm**
7. **Click "I understand, change package visibility"**

## Step 8: Update .env.production

In your `.env.production` file on the server, set:

```bash
GITHUB_ORG=your-github-username    # Replace with your actual username
GITHUB_REPO=lms                     # Replace with your actual repo name
IMAGE_TAG=latest
```

## Step 9: Test Pulling Images

On your local machine or server, verify you can pull the images:

```bash
# If packages are public, no authentication needed
docker pull ghcr.io/YOUR_USERNAME/lms/backend:latest
docker pull ghcr.io/YOUR_USERNAME/lms/frontend:latest

# If packages are private, authenticate first:
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
# Then pull
docker pull ghcr.io/YOUR_USERNAME/lms/backend:latest
docker pull ghcr.io/YOUR_USERNAME/lms/frontend:latest
```

---

## Troubleshooting

### Workflow Doesn't Run

**Check:**
```bash
# Verify workflow file exists
ls .github/workflows/docker-build.yml

# Verify you pushed to main branch
git branch --show-current

# Check git remote
git remote -v
```

**Fix:**
```bash
# If not on main, switch and push
git checkout main
git push origin main
```

### Workflow Fails with "Permission Denied"

**Error:** "Permission denied while trying to connect to the Docker daemon"

**Fix:** Ensure workflow permissions are set correctly (Step 2)

### Workflow Fails with "docker: not found"

**This shouldn't happen** - GitHub Actions runners have Docker pre-installed. If you see this, check the workflow file syntax.

### Can't See Packages

**Wait a few minutes** - packages appear after the first successful push.

**Check workflow completed successfully:**
- Go to Actions tab
- Green checkmark next to latest run

### Can't Pull Images (Authentication Error)

**If packages are private:**

1. **Create Personal Access Token (PAT):**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: "LMS Deploy"
   - Scopes: Check `read:packages`
   - Click "Generate token"
   - Copy the token

2. **Authenticate Docker:**
   ```bash
   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

**Or make packages public** (Step 7)

### Build Fails on Specific Service

**Check build logs:**
1. Go to Actions → Click the failed run
2. Click on the failed job (backend or frontend)
3. Expand the failed step
4. Read error message

**Common issues:**
- **Dockerfile not found:** Check file path in workflow
- **Build context error:** Verify Dockerfile.prod exists in backend/frontend folder
- **npm install fails:** Check package.json syntax
- **TypeScript errors:** Fix errors locally first

---

## Next Builds (After Initial Setup)

Once set up, future builds are automatic:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# GitHub automatically builds and pushes new images!
```

---

## Build Status Badge (Optional)

Add a build status badge to your README:

```markdown
![Build Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/docker-build.yml/badge.svg)
```

---

## Advanced: Build Specific Version

To build and tag a specific version:

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions automatically builds and tags as v1.0.0
# You can then deploy with: IMAGE_TAG=v1.0.0
```

---

## Ready for Deployment!

Once your images are built and published:

1. **Copy image paths:**
   - `ghcr.io/YOUR_USERNAME/lms/backend:latest`
   - `ghcr.io/YOUR_USERNAME/lms/frontend:latest`

2. **Update `.env.production`** on your server with correct `GITHUB_ORG` and `GITHUB_REPO`

3. **Run deployment:**
   ```bash
   ./deploy.sh
   ```

Your LMS is now containerized and ready for production! 🎉
