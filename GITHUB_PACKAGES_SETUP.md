# GitHub Container Registry Setup

## Enable Package Publishing

To use GitHub Container Registry for your Docker images:

### 1. Enable Package Visibility

1. Go to your GitHub repository
2. Click **Settings** → **Actions** → **General**
3. Scroll to **Workflow permissions**
4. Select **Read and write permissions**
5. Check **Allow GitHub Actions to create and approve pull requests**
6. Click **Save**

### 2. Make Packages Public (Optional)

After first Docker images are pushed:

1. Go to your GitHub profile → **Packages**
2. Find `lms/backend` and `lms/frontend` packages
3. Click on each package → **Package settings**
4. Scroll to **Danger zone** → **Change visibility**
5. Select **Public** (so you don't need authentication to pull)

### 3. Generate Personal Access Token (For Private Packages)

If keeping packages private:

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name it "LMS Deploy Token"
4. Check scope: `read:packages`
5. Click **Generate token**
6. Copy the token and save it securely

Use this token to authenticate Docker on your server:
```bash
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 4. Verify Images Are Being Built

After pushing to `main` branch:

1. Go to **Actions** tab in GitHub
2. Check that "Build and Push Docker Images" workflow runs successfully
3. Go to **Packages** and verify images show up

---

## Updating .env.production

Make sure these values match your GitHub repo:

```bash
GITHUB_ORG=your-github-username-or-org
GITHUB_REPO=lms
```

The full image path will be: `ghcr.io/your-github-org/lms/backend:latest`
