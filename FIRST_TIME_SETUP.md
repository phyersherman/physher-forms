# First-Time Setup Guide

After deploying your LMS to production, you need to create the initial global administrator account.

## Interactive Setup Wizard

Run the setup wizard inside the backend container:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

The wizard will prompt you for:

### 1. Admin Email Address
```
Admin email address: admin@yourdomain.com
```
- Must be a valid email format
- Will be used for login

### 2. Admin Full Name
```
Admin full name: John Doe
```
- Must be at least 2 characters
- Displayed in the admin panel

### 3. Password
```
Admin password (min 8 characters): ********
Confirm password: ********
```
- Minimum 8 characters
- Passwords must match
- Choose a strong password - this is your master admin account

## What Gets Created

The wizard creates a **global administrator** user with:
- Full access to all tenants
- Ability to create and manage tenants
- User management across all tenants
- Course template management
- System-wide settings access

## After Setup

1. **Navigate to your LMS**: `https://yourdomain.com`
2. **Log in** with the email and password you just created
3. **Create your first tenant** from the admin dashboard
4. **Set up tenant domains** and branding
5. **Create courses** or import course templates

## Creating Additional Admins

Run the setup wizard again:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run setup
```

It will detect existing admins and ask for confirmation before creating another.

## Security Best Practices

- ✅ Use a strong, unique password (12+ characters recommended)
- ✅ Enable two-factor authentication (if implemented)
- ✅ Don't share admin credentials
- ✅ Create tenant-specific admins for day-to-day operations
- ✅ Keep global admin accounts to a minimum (1-2 people)

## Troubleshooting

### Setup wizard doesn't start
```bash
# Check if backend is running
docker compose -f docker-compose.prod.yml ps

# View backend logs
docker compose -f docker-compose.prod.yml logs backend
```

### Database connection error
```bash
# Verify database is healthy
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U lms

# Check environment variables
docker compose -f docker-compose.prod.yml exec backend env | grep DATABASE_URL
```

### "User already exists" error
If you get an error that a user with that email already exists:
1. Use a different email address, OR
2. Delete the existing user (if it's a test account):
   ```bash
   docker compose -f docker-compose.prod.yml exec backend node -e "
     const { PrismaClient } = require('@prisma/client');
     const prisma = new PrismaClient();
     prisma.user.deleteMany({ where: { email: 'user@example.com' } })
       .then(() => console.log('User deleted'))
       .finally(() => prisma.\$disconnect());
   "
   ```

## Alternative: Manual Admin Creation

If you prefer to create the admin without the interactive wizard:

```bash
docker compose -f docker-compose.prod.yml exec backend node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  
  async function createAdmin() {
    const password = await bcrypt.hash('YOUR_PASSWORD_HERE', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@yourdomain.com',
        fullName: 'Admin User',
        password: password,
        role: 'admin',
        tenantId: null,
        status: 'active',
        authMethod: 'password'
      }
    });
    console.log('Admin created:', user.email);
  }
  
  createAdmin()
    .then(() => prisma.\$disconnect())
    .catch(console.error);
"
```

**Replace:**
- `YOUR_PASSWORD_HERE` with your desired password
- `admin@yourdomain.com` with your email
- `Admin User` with your name

---

## Next Steps

After creating your admin account:

1. **Log in** to verify access
2. **Create your first tenant** (Admin → Tenants → Create Tenant)
3. **Configure tenant domain** (e.g., tenant1.yourdomain.com)
4. **Set up Mailgun** for that tenant's email notifications
5. **Create courses** and invite learners

For detailed administration guides, see the main [README.md](./README.md)
