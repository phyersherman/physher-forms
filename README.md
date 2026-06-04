# PhysherForms

An email-gated survey platform. Respondents authenticate with a work-email OTP; once verified they see and complete assigned JotForm surveys. Admins manage forms, track completions (with anonymized emails), and export reports.

Forked from PhysherLMS. All course/LMS code has been moved to `/legacy`.

---

## Application Flow

```
Respondent visits /
  → Enters work email → backend validates domain vs tenant allowedDomains
  → Receives 6-digit OTP by email (expires 10 min, max 3 requests/10 min)
  → Enters code → backend issues 2h respondent JWT (HTTP-only cookie)
  → Sees /forms: active forms, completed forms grayed out
  → Selects form → /forms/[id]: JotForm iframe loads
  → Submits form → postMessage detected → completion recorded (email hashed)
  → Redirected to /forms with success message

Admin visits /login → /admin/forms → create/edit/toggle forms
                    → /admin/completions → view log, export CSV, reset completion
                    → /admin/tenants/[id] → set allowedDomains for the tenant
```

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/physherforms

# JWT (must be a long random secret)
JWT_SECRET=change-this-to-a-long-random-secret

# Frontend origin(s) for CORS
FRONTEND_ORIGINS=http://localhost:3000

# Node environment
NODE_ENV=development

# Port (optional, default 4000)
PORT=4000
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL

### 1. Clone & install

```bash
git clone https://github.com/YOUR_ORG/physher-forms.git
cd physher-forms

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment
Copy and fill in the `.env` files above.

### 3. Run database migrations

```bash
cd backend
npx prisma migrate deploy
```

### 4. First-time admin setup

```bash
cd backend
npm run setup
```

Follow the prompts to create your first admin account and tenant.

### 5. Configure the tenant

Log in to `/login` as admin, go to **Tenants**, edit your tenant and set **allowedDomains** (e.g., `yourdomain.com`).

### 6. Configure email (Mailgun)

Go to **Email Config** in the admin panel and enter your Mailgun API key, sending domain, from email, and from name.

### 7. Create forms

Go to **Forms** in the admin panel and create forms with JotForm embed URLs.

### 8. Start development servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Backend runs on `http://localhost:4000`, frontend on `http://localhost:3000`.

---

## Privacy Model

| What | Where stored | How |
|---|---|---|
| Respondent email (plaintext) | `VerificationCode` table | Temporary only; cleaned up by cron every 15 min |
| Respondent email (session) | JWT payload (HTTP-only cookie) | Stateless; not in DB |
| Respondent email (completion) | `FormCompletion.emailHash` | SHA-256 hash only |
| Admin display | `FormCompletion.displayHint` | `t***@example.com` computed at write time |
| JotForm | iframe src only | Email is **never** passed to JotForm |

---

## Docker

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## Key API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/respondent/send-code | None | Validate domain, send OTP |
| POST | /api/respondent/verify-code | None | Verify OTP, set session |
| GET | /api/respondent/forms | Respondent | List forms with status |
| GET | /api/respondent/forms/:id | Respondent | Get form embed URL |
| POST | /api/respondent/forms/:id/complete | Respondent | Record completion |
| GET | /api/admin/forms | Admin | List forms |
| POST | /api/admin/forms | Admin | Create form |
| PUT | /api/admin/forms/:id | Admin | Update form |
| DELETE | /api/admin/forms/:id | Admin | Delete form |
| GET | /api/admin/completions | Admin | View completion log |
| GET | /api/admin/completions/export | Admin | Download CSV |
| DELETE | /api/admin/completions/:id | Admin | Reset a completion |
