# Database Management Guide

## Data Persistence Strategy

This guide explains how to safely manage your database during development and production deployments without losing critical data like email configurations.

## Key Principles

1. **Email configurations are never deleted during seeding** - They're preserved across development database resets
2. **Seeding only runs in development** - Production is protected by environment checks
3. **Environment variables as fallback** - Email config can also be stored in `.env` as a last resort
4. **Migrations are safe** - Only apply schema changes, never destructive data operations

## Common Tasks

### Development: Reset Database with Fresh Test Data

When you want to completely reset your development database with fresh seed data:

```bash
npm run db:reset:dev
```

**What happens:**
- ✅ Database schema is reset
- ✅ All tenants, courses, users, enrollments are deleted
- ✅ Test data is regenerated
- **✅ Email configurations are PRESERVED**

### Development: Apply Pending Migrations

When you've created new migrations but want to apply them without resetting data:

```bash
npm run prisma:migrate
```

### Development: Inspect Database Schema

```bash
npx prisma studio
```

Opens an interactive web UI to browse and edit database records.

### Production: Apply Migrations Safely

In production, only apply pending migrations without touching existing data:

```bash
npm run prisma:migrate:prod
```

This runs `prisma migrate deploy` which:
- ✅ Applies only pending migrations
- ✅ Never deletes data
- ✅ Never runs seed script
- ✅ Safe for deployment

### Development: Manually Seed Test Data

If you want to add more seed data without resetting:

```bash
npm run prisma:seed
```

(Only runs if `NODE_ENV !== 'production'`)

## Email Configuration Persistence

Email configurations persist in three ways:

### 1. Database (Primary - Recommended for Production)
- Stored encrypted in `EmailConfig` table
- Configured via admin panel
- Persists across app updates
- Per-tenant or global (fallback)

**Setup:**
1. Log in to admin panel
2. Configure email provider (Mailgun, SendGrid, etc.)
3. Set as active for tenant or globally

### 2. Environment Variables (Fallback)
- Used if no database config exists
- Set in `.env` file
- Useful as emergency fallback
- Supports global config only

**Setup in `.env`:**
```
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=sandbox123.mailgun.org
EMAIL_FROM_ADDRESS=noreply@company.local
EMAIL_FROM_NAME=Your Company Name
EMAIL_REPLY_TO=support@company.local  # Optional
```

### 3. Lookup Priority
When sending email, the system checks in this order:
1. Tenant-specific email config (if tenantId provided)
2. Global email config (tenantId: null)
3. Environment variables from `.env`
4. Throws error if nothing found

## Safety Best Practices

### ✅ DO:
- Use `npm run db:reset:dev` in development for clean resets
- Store critical config in database (admin panel)
- Keep production backups before deployments
- Use environment variables only as fallback/emergency
- Review migrations before deploying

### ❌ DON'T:
- Run `npm run db:reset:dev` in production
- Run seeding script with `NODE_ENV=production`
- Delete EmailConfig manually unless you intend to
- Modify `.env` in production (use config management tools)
- Push code changes without testing migrations locally

## Database Backup

Before any major operation, back up your database:

```bash
# PostgreSQL backup
pg_dump postgresql://user:pass@localhost:5432/lms_db > lms_backup.sql

# Restore if needed
psql postgresql://user:pass@localhost:5432/lms_db < lms_backup.sql
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://lms:pass@localhost:5432/lms_dev` |
| `JWT_SECRET` | ✅ | Secret for signing JWTs | `your-secret-key-here` |
| `ENCRYPTION_SECRET` | ✅ | Secret for encrypting email API keys | `32-char-minimum-encryption-key` |
| `MAILGUN_API_KEY` | ❌ | Mailgun API key (email fallback) | `key-xxx` |
| `MAILGUN_DOMAIN` | ❌ | Mailgun domain (email fallback) | `sandbox123.mailgun.org` |
| `EMAIL_FROM_ADDRESS` | ❌ | From email address (fallback) | `noreply@acme.local` |
| `EMAIL_FROM_NAME` | ❌ | From name (fallback) | `Acme Corp LMS` |
| `EMAIL_REPLY_TO` | ❌ | Reply-to email (fallback) | `support@acme.local` |
| `NODE_ENV` | ❌ | Environment mode | `development` or `production` |

## Troubleshooting

### I ran reset and lost my email configuration!

**Old behavior:** Email configs were deleted during resets.
**New behavior:** Email configs are now preserved.

If you're still losing them:
- Update to the latest seed.js script
- Use `npm run db:reset:dev` instead of `prisma migrate reset`
- Add email config to `.env` as emergency fallback

### Emails not sending after app update

Check fallback sources:
1. Is a database email config set and active?
2. Are environment variables configured in `.env`?
3. Run this to test:
   ```bash
   npm run db:reset:dev  # Preserves email config
   npm run start         # Start server
   # Try logging in and requesting a password reset email
   ```

### Migration fails in production

**Before deploying:**
1. Test migration locally: `npm run prisma:migrate`
2. Verify no data loss: Check migration file
3. Create database backup
4. Deploy: `npm run prisma:migrate:prod`

If it fails:
1. Roll back most recent migration
2. Fix schema issues
3. Create new migration
4. Redeploy

## Migration File Structure

Migrations are stored in `prisma/migrations/` with timestamps:
- `20260220162507_add_cascade_deletes_tenant_relations/migration.sql`
- `20260220195424_add_refresh_token/migration.sql`

**Never modify old migration files** - always create new ones.

## Questions?

Refer to [Prisma Deployment Docs](https://www.prisma.io/docs/guides/deployment/deploy-to-production) for detailed information.
