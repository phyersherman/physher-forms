# Pre-Deployment Checklist

Use this checklist to ensure everything is ready before deploying to production.

## ✅ Code & Repository

- [ ] All changes committed and pushed to GitHub
- [ ] Backend health endpoint works: `/api/health`
- [ ] Production Dockerfiles created
- [ ] GitHub Actions workflow configured
- [ ] `.env.production.example` reviewed

## ✅ GitHub Setup

- [ ] Repository Actions permissions set to "Read and write"
- [ ] Workflow run successfully and images pushed to GHCR
- [ ] Container packages visible in GitHub Packages
- [ ] Packages set to public (or PAT created for private access)

## ✅ Domain & DNS

- [ ] Domain purchased and accessible
- [ ] DNS A record: `@` → Server IP
- [ ] DNS A record: `*` → Server IP (wildcard for subdomains)
- [ ] DNS propagation verified (`dig yourdomain.com`)

## ✅ Email (Mailgun)

- [ ] Mailgun account created
- [ ] Domain verified in Mailgun
- [ ] SPF record added to DNS
- [ ] DKIM records added to DNS
- [ ] API key obtained
- [ ] Sender email configured

## ✅ Server

- [ ] Ubuntu 20.04/22.04 server provisioned
- [ ] Minimum 2GB RAM, 20GB storage
- [ ] SSH access configured
- [ ] Root or sudo access confirmed
- [ ] Ports 22, 80, 443 accessible

## ✅ Secrets Generated

Generate these before deployment:

```bash
# Database password (strong!)
openssl rand -base64 32

# JWT Secret
openssl rand -base64 32

# Refresh Token Secret
openssl rand -base64 32

# CSRF Secret
openssl rand -base64 32
```

Save these securely - you'll need them for `.env.production`

## ✅ Configuration File

Create `.env.production` with:

- [ ] `BASE_DOMAIN` - your actual domain
- [ ] `ACME_EMAIL` - valid email for Let's Encrypt
- [ ] `GITHUB_ORG` - your GitHub username/org
- [ ] `GITHUB_REPO` - repository name
- [ ] `POSTGRES_PASSWORD` - strong generated password
- [ ] `JWT_SECRET` - generated secret
- [ ] `REFRESH_TOKEN_SECRET` - generated secret
- [ ] `CSRF_SECRET` - generated secret
- [ ] `MAILGUN_API_KEY` - from Mailgun dashboard
- [ ] `MAILGUN_DOMAIN` - your Mailgun domain
- [ ] `MAILGUN_FROM_EMAIL` - sender email address

## ✅ Pre-Deployment Test

On your local machine:

```bash
# Verify env file is not committed
git status | grep -q ".env.production" && echo "ERROR: .env.production is tracked!" || echo "✓ Safe"

# Verify Docker Compose file is valid
docker compose -f docker-compose.prod.yml config

# Verify deploy script is executable
test -x deploy.sh && echo "✓ deploy.sh is executable" || chmod +x deploy.sh
```

## ✅ Server Preparation Completed

- [ ] Docker installed and user added to docker group
- [ ] Docker Compose installed
- [ ] Git installed
- [ ] UFW firewall configured (ports 22, 80, 443)
- [ ] Repository cloned to server
- [ ] `.env.production` created on server
- [ ] GitHub Container Registry authentication completed

## ✅ Deployment Ready Verification

Final checks before running `./deploy.sh`:

```bash
# On server
cd ~/lms

# Verify environment file exists
ls -la .env.production

# Verify can pull images
docker pull ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/backend:latest

# Verify ports are available
sudo netstat -tulpn | grep -E ':(80|443) '  # Should be empty

# Verify DNS resolution
nslookup yourdomain.com
```

---

## 🚀 Ready to Deploy?

If all items are checked, proceed with:

```bash
./deploy.sh
```

Then initialize the database:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

The setup wizard will walk you through creating your global admin account interactively.

Navigate to `https://yourdomain.com` and log in!

---

## 🆘 If Something Goes Wrong

**Deployment fails?**
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Stop everything and start fresh
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

**SSL not working?**
- Wait 5-10 minutes for certificate generation
- Check Traefik logs: `docker compose -f docker-compose.prod.yml logs traefik`
- Verify DNS is propagated: `dig yourdomain.com`

**Database connection errors?**
- Verify PostgreSQL is healthy: `docker compose -f docker-compose.prod.yml ps`
- Check database logs: `docker compose -f docker-compose.prod.yml logs postgres`

---

## 📞 Need Help?

Refer to:
- `DEPLOYMENT.md` - Full deployment guide
- `DEPLOYMENT_QUICKSTART.md` - Quick start guide
- GitHub Issues - Report problems

Good luck! 🎉
