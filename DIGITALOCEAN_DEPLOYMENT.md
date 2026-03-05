# DigitalOcean Deployment Guide

## Option 1: Droplet Deployment (Recommended)

This is the recommended approach for the LMS because it supports multi-tenancy with wildcard subdomains and gives you full control.

### Step 1: Create a Droplet

1. Go to https://cloud.digitalocean.com/droplets
2. Click **Create Droplet**
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($12/month or higher recommended)
   - **CPU:** Regular (2GB RAM minimum)
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH keys (or root password)
4. Click **Create Droplet**
5. Note your droplet's IP address

### Step 2: Configure DNS

In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):

```
Type    Name    Value
A       @       YOUR_DROPLET_IP
A       *       YOUR_DROPLET_IP
```

The wildcard `*` is required for tenant subdomains (e.g., `tenant1.yourdomain.com`).

### Step 3: SSH into Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 4: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group (if not root)
usermod -aG docker $USER
newgrp docker

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 5: Clone and Configure

```bash
# Clone your repository
git clone https://github.com/phyersherman/lms.git
cd lms

# Copy environment template
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Required values in `.env.production`:**

```bash
BASE_DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

GITHUB_ORG=phyersherman
GITHUB_REPO=lms

POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)

MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

### Step 6: Make Packages Public OR Login to GitHub

**Option A (Easier) - Make packages public:**
1. Go to https://github.com/phyersherman?tab=packages
2. Click on `lms/backend` → Package settings → Change visibility → Public
3. Repeat for `lms/frontend`

**Option B - Use Personal Access Token:**
1. Create token at https://github.com/settings/tokens with `read:packages`
2. Login on server:
```bash
echo YOUR_TOKEN | docker login ghcr.io -u phyersherman --password-stdin
```

### Step 7: Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

Wait 2-3 minutes for SSL certificates to generate and services to start.

### Step 8: Create Admin Account

```bash
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

Follow the prompts to create your first admin user.

### Step 9: Access Your LMS

Visit: `https://yourdomain.com`

Log in with the admin credentials you just created!

---

## Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check service status
docker compose -f docker-compose.prod.yml ps

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Deploy updates (pull latest images and restart)
./deploy.sh

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U lms lms_prod > backup-$(date +%Y%m%d).sql

# Restore database
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U lms lms_prod
```

---

## Troubleshooting

**SSL certificates not working?**
- Wait 2-3 minutes after first deployment
- Check DNS is pointing correctly: `dig yourdomain.com`
- View Traefik logs: `docker compose -f docker-compose.prod.yml logs traefik`

**Can't access at https://yourdomain.com?**
- Check firewall: `sudo ufw status`
- Ensure ports 80/443 are open
- Check if services are running: `docker compose -f docker-compose.prod.yml ps`

**Tenants not accessible?**
- Verify wildcard DNS: `dig random123.yourdomain.com` should show your IP
- Check backend logs: `docker compose -f docker-compose.prod.yml logs backend`

---

## Cost Estimate

- **Droplet:** $12-24/month (2-4GB RAM)
- **Mailgun:** Free tier (5,000 emails/month)
- **Domain:** ~$12/year
- **Total:** ~$15-25/month

---

## Option 2: App Platform (Not Recommended)

DigitalOcean App Platform doesn't support this LMS's architecture well because:
- ❌ No wildcard subdomain routing for multi-tenancy
- ❌ More expensive ($20+ per service = $60+/month)
- ❌ Requires significant restructuring
- ❌ Less control over reverse proxy and SSL

**Stick with Droplet deployment above.** ✅
