import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import routes from './routes'
import { tenantResolver } from './middleware/tenantResolver'
import csurf from 'csurf'
import { cleanupExpiredCodes } from './services/respondentAuthService'

const app = express()

app.use(helmet())
app.use(express.json())
app.use(morgan('dev'))

// CORS: allow one or more frontend origins (configurable)
// Set FRONTEND_ORIGINS to a comma-separated list like: http://localhost:3000,http://127.0.0.1:3000
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., curl, mobile clients)
    if (!origin) return callback(null, true)
    if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
console.log('Allowed frontend origins:', FRONTEND_ORIGINS)
app.use(cookieParser())

// CSRF protection using double-submit cookie via `csurf`.
// We'll expose a `/api/csrf-token` endpoint that returns a token the client should send
// in the `X-CSRF-Token` header for state-changing requests.
const csrfMiddleware = csurf({ cookie: { httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' } })

// Route to fetch CSRF token (unprotected so client can obtain a token before auth)
app.get('/api/csrf-token', csrfMiddleware, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// Apply CSRF protection to non-auth POST/PUT/DELETE endpoints. We skip login/register so users
// can obtain a token and login without being blocked on first request.
// Also skip public endpoints which should be accessible without CSRF.
app.use((req, res, next) => {
  const isAuthPath = req.path.startsWith('/api/auth')
  const isPublicPath = req.path.startsWith('/api/public/')
  const isRespondentAuth = req.path.startsWith('/api/respondent/')
  const isSafeMethod = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'
  if (isSafeMethod || isAuthPath || isPublicPath || isRespondentAuth) return next()
  return csrfMiddleware(req as any, res as any, next as any)
})

// If running behind a proxy/load-balancer, enable trust proxy for proper host resolution
app.set('trust proxy', 1)

// multi-tenant resolver middleware: sets req.tenantId
app.use(tenantResolver)

app.use('/api', routes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`PhysherForms backend listening on port ${PORT}`)
})

// Cleanup cron: delete expired/used VerificationCode records every 15 minutes
setInterval(async () => {
  try {
    const deleted = await cleanupExpiredCodes()
    if (deleted > 0) console.log(`[Cron] Cleaned up ${deleted} expired verification codes`)
  } catch (e) {
    console.error('[Cron] Verification code cleanup failed:', e)
  }
}, 15 * 60 * 1000)
