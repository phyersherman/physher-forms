# Production Deployment Quick Start

## TL;DR - Get it running fast

### 1. Server Setup (5 minutes)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

# Configure firewall
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
```

### 2. DNS Configuration
Point your domain to the server:
```
A     @       YOUR_SERVER_IP
A     *       YOUR_SERVER_IP
```

### 3. Deploy Application (5 minutes)
```bash
# Clone repo
git clone https://github.com/phyersherman/lms lms && cd lms

# Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Generate secrets
openssl rand -base64 32  # Use this for JWT_SECRET
openssl rand -base64 32  # Use this for REFRESH_TOKEN_SECRET
openssl rand -base64 32  # Use this for CSRF_SECRET

# Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Deploy!
./deploy.sh
```

### 4. Initialize Database
```bash
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

Follow the interactive prompts to create your global admin account.

### 5. Access Your LMS
Navigate to: `https://yourdomain.com`

Log in with the admin credentials you just created.

---

## Required Configuration in .env.production

```bash
BASE_DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

GITHUB_ORG=your-github-org
GITHUB_REPO=lms

POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<generated-secret>
REFRESH_TOKEN_SECRET=<generated-secret>
CSRF_SECRET=<generated-secret>

MAILGUN_API_KEY=<your-mailgun-key>
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

---

## Common Commands

```bash
# Deploy updates
./deploy.sh

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check service status
docker compose -f docker-compose.prod.yml ps

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U lms lms_prod > backup.sql
```

---

## Troubleshooting

**Services won't start?**
```bash
docker compose -f docker-compose.prod.yml logs
```

**Database issues?**
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U lms
```

**SSL not working?**
- Verify DNS points to server: `dig yourdomain.com`
- Check Traefik logs: `docker compose -f docker-compose.prod.yml logs traefik`
- Ensure ports 80/443 are open

---

For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
