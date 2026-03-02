# Production Deployment Guide

This guide covers deploying the LMS to a production Ubuntu server with automatic HTTPS via Let's Encrypt.

## Overview

The production stack includes:
- **Traefik**: Reverse proxy with automatic SSL/TLS via Let's Encrypt
- **PostgreSQL**: Database with persistent storage
- **Backend**: Node.js/Express API
- **Frontend**: Next.js application
- **Docker Compose**: Orchestrates all services

All services run in Docker containers with health checks and automatic restarts.

---

## Prerequisites

### 1. Server Requirements
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 20GB+ available
- **Ports**: 80 (HTTP) and 443 (HTTPS) open

### 2. Domain Setup
Set up a **wildcard DNS record** pointing to your server:
```
A     @                   -> YOUR_SERVER_IP
A     *                   -> YOUR_SERVER_IP
```

This allows:
- `yourdomain.com` → admin portal
- `tenant1.yourdomain.com` → tenant 1 courses
- `tenant2.yourdomain.com` → tenant 2 courses

### 3. Email (Mailgun)
- Create a Mailgun account and verify your domain
- Get your API key and domain from Mailgun dashboard
- Add SPF/DKIM records for email deliverability

---

## Initial Server Setup

### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Install Git

```bash
sudo apt install git -y
```

### 3. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Application Deployment

### 1. Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_ORG/YOUR_REPO.git lms
cd lms
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

**Required configuration:**

```bash
# Domain Configuration
BASE_DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# GitHub Container Registry (update with your GitHub org/repo)
GITHUB_ORG=your-github-org
GITHUB_REPO=lms
IMAGE_TAG=latest

# Database - Generate strong password
POSTGRES_PASSWORD=your_strong_password_here

# JWT Secrets - Generate with: openssl rand -base64 32
JWT_SECRET=<generated_secret>
REFRESH_TOKEN_SECRET=<generated_secret>
CSRF_SECRET=<generated_secret>

# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# Traefik Dashboard Auth (optional) - Generate with: htpasswd -nb admin yourpassword
TRAEFIK_AUTH=admin:$$apr1$$...
```

**To generate secrets:**
```bash
openssl rand -base64 32  # Run this 3 times for the 3 secrets
```

**To generate Traefik auth:**
```bash
sudo apt install apache2-utils -y
htpasswd -nb admin yourpassword  # Replace yourpassword
```

### 3. Authenticate with GitHub Container Registry

```bash
# Create GitHub Personal Access Token with 'read:packages' scope
# Then login to GitHub Container Registry
echo $YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 4. Deploy Application

```bash
# Make deployment script executable (if not already)
chmod +x deploy.sh

# Run initial deployment
./deploy.sh
```

The script will:
1. Pull latest Docker images
2. Run database migrations
3. Start all services with health checks
4. Verify everything is running

### 5. Initialize Database (First Time Only)

```bash
# Run the interactive setup wizard
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

The setup wizard will prompt you for:
- Admin email address
- Admin full name  
- Password (minimum 8 characters)
- Password confirmation

This creates a **global administrator** account with full access to:
- All tenants
- User management
- Course templates
- System settings

**Security Note:** Choose a strong password. This account has unrestricted access to your LMS.

**If you need to create additional global admins later:**
```bash
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

---

## Post-Deployment

### 1. Verify Services

Check all services are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

Example healthy output:
```
NAME              STATUS              PORTS
lms-backend       Up (healthy)        4000/tcp
lms-frontend      Up (healthy)        3000/tcp
lms-postgres      Up (healthy)        5432/tcp
lms-traefik       Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 2. Access Your Application

- **Main site**: https://yourdomain.com
- **Traefik dashboard**: https://traefik.yourdomain.com (if configured)

### 3. Check Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 4. SSL Certificates

Traefik automatically obtains Let's Encrypt certificates. Check certificate status:
```bash
docker compose -f docker-compose.prod.yml logs traefik | grep -i cert
```

Certificates are stored in the `traefik-certificates` volume and renewed automatically.

---

## Updates & Maintenance

### Deploying Updates

When you push changes to GitHub, the CI/CD pipeline builds new images. To deploy:

```bash
cd ~/lms
git pull
./deploy.sh
```

The script performs zero-downtime deployment with automatic rollback on failure.

### Manual Container Management

```bash
# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# View resource usage
docker stats
```

### Database Backups

**Manual backup:**
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U lms lms_prod > backup-$(date +%Y%m%d).sql
```

**Automated backups (recommended):**
```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/lms-backups
mkdir -p $BACKUP_DIR
docker compose -f ~/lms/docker-compose.prod.yml exec -T postgres pg_dump -U lms lms_prod | gzip > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +30 -delete
EOF

chmod +x ~/backup-db.sh

# Add to cron (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-db.sh") | crontab -
```

**Restore from backup:**
```bash
gunzip < backup-20260302.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U lms lms_prod
```

---

## Monitoring & Troubleshooting

### Health Checks

Check if services are healthy:
```bash
# Backend
curl -s http://localhost:4000/api/health

# Frontend  
curl -s http://localhost:3000/

# Via HTTPS
curl -s https://yourdomain.com/api/health
```

### Common Issues

**Services won't start:**
```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs

# Verify environment file
cat .env.production

# Check disk space
df -h
```

**Database connection errors:**
```bash
# Verify database is healthy
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U lms

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres
```

**SSL certificate issues:**
```bash
# View Traefik logs
docker compose -f docker-compose.prod.yml logs traefik

# Verify domain DNS points to server
dig yourdomain.com
dig tenant1.yourdomain.com
```

**Port conflicts:**
```bash
# Check what's using ports 80/443
sudo netstat -tulpn | grep -E ':(80|443)'

# Stop conflicting services (e.g., Apache)
sudo systemctl stop apache2
sudo systemctl disable apache2
```

---

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords** for database and admin accounts

3. **Restrict SSH access:**
   ```bash
   # Disable password auth, use SSH keys only
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

4. **Enable automatic security updates:**
   ```bash
   sudo apt install unattended-upgrades -y
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

5. **Monitor logs** regularly:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f | grep -i error
   ```

6. **Set up monitoring** (optional):
   - Use tools like Prometheus + Grafana
   - Set up uptime monitoring (UptimeRobot, Pingdom)

---

## Scaling Considerations

### Single Server Improvements

1. **Add swap space** if RAM is limited:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **Optimize PostgreSQL** for your workload:
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres psql -U lms -d lms_prod
   # Run VACUUM and ANALYZE regularly
   ```

### Multi-Server (Future)

For high-traffic deployments:
- Load balancer (HAProxy, AWS ALB)
- Separate database server
- Redis for session management
- CDN for static assets

---

## Support & Maintenance

### Logs Location
- **Docker logs**: `docker compose -f docker-compose.prod.yml logs`
- **System logs**: `/var/log/syslog`

### Useful Commands

```bash
# View all volumes
docker volume ls

# Inspect a volume
docker volume inspect lms_postgres-data

# Clean up unused resources
docker system prune -a

# Export/Import database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U lms lms_prod > backup.sql
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Deploy/update application |
| `docker compose -f docker-compose.prod.yml ps` | Check service status |
| `docker compose -f docker-compose.prod.yml logs -f` | View live logs |
| `docker compose -f docker-compose.prod.yml restart <service>` | Restart a service |
| `docker compose -f docker-compose.prod.yml down` | Stop all services |
| `docker compose -f docker-compose.prod.yml up -d` | Start all services |

---

## Next Steps

1. Set up regular database backups
2. Configure monitoring/alerting
3. Document your tenant onboarding process
4. Set up staging environment (optional)
5. Create runbooks for common operations

For issues or questions, refer to the main README.md or open an issue on GitHub.
