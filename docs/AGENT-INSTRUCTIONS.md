# Brancher - Agent Instructions & Knowledge Base

**Version**: 1.0  
**Date**: 2026-09-30  
**Purpose**: Comprehensive guidance untuk agents/developers yang melanjutkan project

---

## 🎯 Quick Start untuk New Agents

### 1. Project Overview (5 min read)
**File**: `docs/INDEX.md`

Mulai dari sini untuk understand:
- Project status & version (currently v0.1.0)
- Complete documentation structure
- 4-phase roadmap (6 months to v1.0.0)
- Risk assessment & success metrics

### 2. Technology Stack (10 min read)
**File**: `docs/TECHNOLOGY-RESEARCH.md`

Pahami:
- Backend: Express.js + Socket.io + SQLite
- Frontend: React + Vite
- Real-time: WebSocket communication
- Current capacity: 500-1,000 concurrent users
- Scalability path: PostgreSQL + Redis migration

### 3. Security Posture (15 min read)
**File**: `docs/SECURITY-AUDIT.md`

Ketahui:
- Current security status: MEDIUM (5/10)
- 2 critical issues yang harus diprioritaskan
- 4 high-priority fixes untuk v0.2.0
- Compliance requirements (GDPR, CCPA, HIPAA)

### 4. Architecture & Code (20 min read)
**File**: `README.md` + `server/`, `client/`

Explore:
- Database schema & tables
- API endpoints (20+)
- WebSocket events (15+)
- Component structure
- File organization

---

## 📋 Development Phases & Tasks

### Phase 1: Security & Stability (Weeks 1-4) 🔴 HIGH PRIORITY

**Goal**: Harden security, add logging, improve reliability

#### Task 1.1: Input Validation Framework
**Priority**: P0 (CRITICAL)  
**Effort**: 5-8 hours  
**Owner**: [Assign]

```bash
# Installation
npm install zod

# What to do:
1. Create validation schemas for all endpoints
2. Create validation middleware
3. Test with positive/negative cases
4. Update API.md documentation

# Files to modify:
- server/index.js (add validation middleware)
- server/helpers.js (add new validation functions)
- Create: server/schemas.js (Zod schemas)

# Code example:
const CreateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  channelId: z.string().uuid(),
  fileUrl: z.string().url().optional(),
});

app.post('/api/messages', (req, res) => {
  const validated = CreateMessageSchema.parse(req.body);
  // Process...
});

# Success Criteria:
✅ All 20+ endpoints have validation
✅ Invalid inputs rejected with 400 error
✅ Examples in API.md updated
✅ No breaking changes
```

**Related Issues**: [SECURITY-AUDIT.md](./SECURITY-AUDIT.md#injection)

---

#### Task 1.2: Structured Logging Setup
**Priority**: P0 (CRITICAL)  
**Effort**: 6-10 hours  
**Owner**: [Assign]

```bash
# Installation
npm install winston @sentry/node

# What to do:
1. Setup Winston logger
2. Configure transports (console + file)
3. Setup Sentry for error tracking
4. Add logging to key functions
5. Document logging strategy

# Files to modify:
- server/index.js (initialize loggers)
- server/helpers.js (add log calls)
- Create: server/logger.js (logger config)
- Update: docs/OPERATIONS.md (logging guide)

# Code example:
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});

// Usage
logger.info('User login', { userId, ip: req.ip });
logger.error('Database error', { error: err.message });

# Events to log:
- Authentication (login success/failure, registration)
- Authorization (permission denied)
- Errors (stack trace)
- Performance (slow queries)
- Security (rate limit, suspicious activity)

# Success Criteria:
✅ All key functions have logging
✅ Logs structured (JSON format)
✅ Error tracking via Sentry
✅ Log rotation configured
✅ No sensitive data in logs
```

**Related Issues**: [SECURITY-AUDIT.md](./SECURITY-AUDIT.md#logging--monitoring-failures)

---

#### Task 1.3: CSRF Protection
**Priority**: P0 (CRITICAL)  
**Effort**: 4-6 hours  
**Owner**: [Assign]

```bash
# Installation
npm install csurf

# What to do:
1. Setup CSRF middleware
2. Add token to all forms
3. Validate on POST/PUT/DELETE
4. Document in API.md
5. Test with curl/Postman

# Files to modify:
- server/index.js (add csrf middleware)
- client/src/utils.js (add token to requests)
- Update: docs/API.md (CSRF section)

# Code example (Server):
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });

app.post('/api/messages', csrfProtection, (req, res) => {
  // Token validated automatically
});

# Code example (Client):
const getCsrfToken = async () => {
  const response = await fetch('/api/csrf-token');
  return response.json().token;
};

const sendMessage = async (content) => {
  const token = await getCsrfToken();
  await fetch('/api/messages', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': token,
    },
    body: JSON.stringify({ content }),
  });
};

# Success Criteria:
✅ All state-changing requests require token
✅ Token validated on server
✅ Token rotated after each request
✅ API.md documents CSRF requirement
✅ E2E test covers CSRF protection
```

**Related Issues**: [SECURITY-AUDIT.md](./SECURITY-AUDIT.md#cross-site-request-forgery-csrfProtection)

---

#### Task 1.4: Security Headers
**Priority**: P0 (CRITICAL)  
**Effort**: 3-5 hours  
**Owner**: [Assign]

```bash
# Installation
npm install helmet

# What to do:
1. Install & configure Helmet.js
2. Add CSP, HSTS, X-Frame-Options headers
3. Test with browser dev tools
4. Document in docs/SECURITY.md
5. Verify in production

# Files to modify:
- server/index.js (add helmet middleware)
- .env (add CSP policy)
- Create: docs/SECURITY.md (security headers guide)

# Code example:
const helmet = require('helmet');
app.use(helmet());

// Custom CSP
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));

# Headers added:
- X-Frame-Options: DENY (clickjacking)
- X-Content-Type-Options: nosniff (MIME sniffing)
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- Referrer-Policy
- Permissions-Policy

# Success Criteria:
✅ All security headers present
✅ No console errors
✅ Headers verified with curl
✅ Documentation complete
✅ No functionality broken
```

**Related Issues**: [SECURITY-AUDIT.md](./SECURITY-AUDIT.md#http-headers)

---

#### Task 1.5: Global Rate Limiting
**Priority**: P1 (HIGH)  
**Effort**: 3-4 hours  
**Owner**: [Assign]

```bash
# Note: Already partially implemented, needs expansion

# What to do:
1. Review current rate limiting (see server/index.js)
2. Extend to all endpoints
3. Configure per-endpoint limits
4. Add rate limit headers to responses
5. Test with load testing

# Files to modify:
- server/index.js (expand rate limiting)
- docs/API.md (document rate limits)

# Current limits (should keep):
- Auth endpoints: 30 per 15 min
- Messages: 200 per hour
- Search: 30 per minute

# Code example:
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests',
});

app.use(limiter);

// Endpoint-specific:
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
});

app.post('/api/messages', messageLimiter, (req, res) => {
  // ...
});

# Headers to add:
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset

# Success Criteria:
✅ All endpoints have rate limiting
✅ Headers returned in responses
✅ Appropriate limits per endpoint
✅ No legitimate users blocked
✅ Documentation updated
```

**Related Issues**: [API.md](./API.md#rate-limiting)

---

### Phase 2: Quality & Code Standards (Weeks 5-8)

#### Task 2.1: Setup ESLint + Prettier
**Priority**: P1 (HIGH)  
**Effort**: 4-6 hours  
**Owner**: [Assign]

```bash
npm install -D eslint prettier eslint-config-prettier

# Create .eslintrc.json
{
  "extends": "eslint:recommended",
  "env": {
    "node": true,
    "browser": true,
    "es2021": true
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}

# Create .prettierrc.json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "useTabs": false
}

# Commands to add to package.json:
"lint": "eslint server/ client/src/",
"lint:fix": "eslint server/ client/src/ --fix",
"format": "prettier --write \"server/**/*.js\" \"client/src/**/*.{js,jsx}\""

# Success Criteria:
✅ ESLint configured
✅ Prettier configured
✅ No errors when running lint
✅ Format command works
✅ Pre-commit hooks setup (future)
```

---

#### Task 2.2: Setup Jest Testing
**Priority**: P1 (HIGH)  
**Effort**: 8-12 hours  
**Owner**: [Assign]

```bash
npm install -D jest supertest

# Create jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/index.js', // exclude main file
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

# Create test/helpers.test.js
describe('Helpers', () => {
  describe('Permission checks', () => {
    test('owner should have all permissions', () => {
      const result = hasPermission('owner', 'manage_channels');
      expect(result).toBe(true);
    });

    test('member should not manage channels', () => {
      const result = hasPermission('member', 'manage_channels');
      expect(result).toBe(false);
    });
  });
});

# Create test/api.test.js
describe('API Endpoints', () => {
  describe('POST /api/messages', () => {
    test('should reject invalid content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ content: '' });
      
      expect(response.status).toBe(400);
    });

    test('should create valid message', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ content: 'Hello', channelId: 'ch_123' });
      
      expect(response.status).toBe(201);
    });
  });
});

# Commands to add to package.json:
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"

# Target: 70% coverage minimum

# Success Criteria:
✅ Jest configured
✅ 70%+ coverage achieved
✅ All critical functions tested
✅ Tests pass locally
✅ CI runs tests automatically
```

**Related Tasks**: After completing Task 1.x (security fixes)

---

#### Task 2.3: Setup GitHub Actions CI/CD
**Priority**: P1 (HIGH)  
**Effort**: 5-8 hours  
**Owner**: [Assign]

```bash
# Create .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [22]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm audit --production
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

# Success Criteria:
✅ CI pipeline runs on every push
✅ Linting passes
✅ Tests pass
✅ Security audit passes
✅ PR cannot merge if CI fails
✅ Coverage reports visible
```

---

### Phase 3: Scalability Foundation (Weeks 9-16)

#### Task 3.1: PostgreSQL Migration Planning
**Priority**: P1 (HIGH)  
**Effort**: 15-20 hours  
**Owner**: [Assign]

```bash
# What to do:
1. Analyze current SQLite schema
2. Design PostgreSQL schema
3. Create migration scripts
4. Setup dev PostgreSQL instance
5. Write migration guide
6. Plan rollback strategy

# Files to create:
- docs/DATABASE-MIGRATION.md
- server/migrations/001_initial_schema.sql
- server/db-postgres.js (new database module)

# Key differences SQLite → PostgreSQL:
- autoincrement → SERIAL / BIGSERIAL
- datetime('now') → NOW()
- Connection pooling (pg-pool)
- Transactions & ACID compliance
- Better concurrency

# Migration process:
1. Setup PostgreSQL locally
2. Export SQLite data
3. Import to PostgreSQL
4. Run full test suite
5. Compare results
6. Plan production migration

# Success Criteria:
✅ Migration guide documented
✅ Test migration works
✅ No data loss
✅ Performance benchmarks
✅ Rollback plan documented
```

---

#### Task 3.2: Redis Integration
**Priority**: P1 (HIGH)  
**Effort**: 10-15 hours  
**Owner**: [Assign]

```bash
npm install redis @socket.io/redis-adapter

# What to do:
1. Setup Redis locally (Docker)
2. Implement session store migration
3. Add message caching
4. Setup Socket.io Redis adapter
5. Performance testing

# Files to modify:
- server/index.js (Redis connection)
- Create: server/redis.js (Redis client config)
- Create: server/cache.js (caching functions)

# Code example:
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const pubClient = redis.createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Session store
const RedisStore = require('connect-redis').default;
const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ...
}));

// Caching
async function getCachedUser(userId) {
  const cached = await redisClient.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.getUser(userId);
  await redisClient.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}

# Cache items:
- User sessions (1 hour)
- Recent messages (15 min)
- User presence (5 min)
- Rate limit counters (per interval)

# Success Criteria:
✅ Redis running locally
✅ Session store uses Redis
✅ Multi-instance Socket.io works
✅ Message caching improves performance
✅ No data loss on Redis restart
```

---

### Phase 4: Production Readiness (Weeks 17-24)

#### Task 4.1: OAuth Integration
**Priority**: P2 (MEDIUM)  
**Effort**: 12-16 hours  
**Owner**: [Assign]

```bash
npm install passport passport-google-oauth20 passport-github2

# What to do:
1. Setup OAuth apps (Google, GitHub)
2. Implement Passport strategies
3. Add OAuth login flow to frontend
4. Handle user creation/linking
5. Documentation & testing

# Code example (Server):
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Find or create user
  let user = db.findUserByEmail(profile.emails[0].value);
  if (!user) {
    user = db.createUser({
      email: profile.emails[0].value,
      username: profile.displayName,
      googleId: profile.id,
    });
  }
  done(null, user);
}));

app.get('/api/auth/google', 
  passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

# Success Criteria:
✅ Google OAuth working
✅ GitHub OAuth working
✅ User linking tested
✅ Frontend integration complete
✅ Security review passed
```

---

#### Task 4.2: 2FA/TOTP Implementation
**Priority**: P2 (MEDIUM)  
**Effort**: 10-14 hours  
**Owner**: [Assign]

```bash
npm install speakeasy qrcode

# What to do:
1. Generate TOTP secrets
2. Display QR code
3. Validate TOTP tokens
4. Store encrypted secrets
5. Recovery codes

# Code example:
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA
app.post('/api/user/2fa/setup', requireAuth, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `Brancher (${req.session.user.email})`,
    issuer: 'Brancher',
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  res.json({
    qrCode,
    secret: secret.base32,
    backupCodes: generateBackupCodes(), // Generate recovery codes
  });
});

// Verify 2FA
app.post('/api/user/2fa/verify', requireAuth, (req, res) => {
  const { token } = req.body;
  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
    window: 2,
  });
  
  if (verified) {
    db.update2FA(user.id, true);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid token' });
  }
});

# Success Criteria:
✅ TOTP generation working
✅ QR code displays correctly
✅ Verification works
✅ Recovery codes generated
✅ Frontend UI implemented
```

---

## 🔧 Development Environment Setup

### Prerequisites
```bash
# Required versions:
- Node.js 22+
- npm 11+
- Git 2.35+

# For database:
- SQLite 3.x (built-in to Node 22)
- PostgreSQL 14+ (for production migration)
- Redis 6+ (for caching/session)

# For monitoring:
- Docker (optional, for services)
- Prometheus (optional, for metrics)
```

### Quick Setup
```bash
# Clone repository
git clone https://github.com/username/brancher.git
cd brancher

# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Run development server
npm run dev

# In another terminal, run client
cd client && npm run dev

# Open browser
http://localhost:5173
```

### Configuration
**File**: `.env` or `.env.production`

```env
# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-to-random-string-in-production

# Database
DATA_DIR=./data

# Security (add these)
ENCRYPTION_KEY=your-256-bit-key-here
CSRF_SECRET=your-csrf-secret

# Logging
LOG_LEVEL=info

# Sentry (error tracking)
SENTRY_DSN=https://...

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/brancher
```

---

## 📚 Documentation to Read First

**Before starting any task**, read these in order:

1. **[INDEX.md](./INDEX.md)** (15 min)
   - Project overview
   - Status & roadmap
   - Success metrics

2. **[TECHNOLOGY-RESEARCH.md](./TECHNOLOGY-RESEARCH.md)** (20 min)
   - Architecture details
   - Performance characteristics
   - Scalability strategy

3. **[SECURITY-AUDIT.md](./SECURITY-AUDIT.md)** (25 min)
   - Security assessment
   - Remediation roadmap
   - Specific vulnerabilities

4. **[API.md](./API.md)** (20 min)
   - Endpoint documentation
   - WebSocket events
   - Error handling

5. **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** (15 min)
   - Component specifications
   - Accessibility standards
   - UI patterns

6. **[DOCUMENTATION-STANDARDS.md](./DOCUMENTATION-STANDARDS.md)** (15 min)
   - Coding standards
   - Commit conventions
   - PR process

---

## 🚀 How to Approach Tasks

### For Every Task:

**1. Understand Context**
```
- Read the task description
- Review related documentation
- Check for dependencies
- Understand success criteria
```

**2. Plan Implementation**
```
- Break into smaller subtasks
- List files to modify
- Identify edge cases
- Plan testing approach
```

**3. Implement**
```
- Follow coding standards
- Write clean, documented code
- Add error handling
- Test thoroughly
```

**4. Document Changes**
```
- Update relevant .md files
- Add code comments
- Update API.md if needed
- Write commit message (semantic format)
```

**5. Test & Verify**
```
- Run unit tests
- Test manually
- Check no regressions
- Verify success criteria
```

**6. Create PR**
```
- Push to feature branch
- Create PR with description
- Link to related issues
- Wait for review
```

---

## 🐛 Common Issues & Solutions

### Issue: Database Lock
**Symptom**: `database is locked`  
**Solution**: 
- Ensure only one process accessing SQLite
- Check for hanging connections
- Restart dev server

### Issue: Port Already in Use
**Symptom**: `EADDRINUSE: address already in use :::3000`  
**Solution**:
```bash
# Find process using port
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Issue: Session Not Persisting
**Symptom**: Logout on page refresh  
**Solution**:
- Check cookies enabled
- Verify session store working
- Check SESSION_SECRET set
- Review browser dev tools → Application

### Issue: Socket.io Events Not Firing
**Symptom**: Real-time updates not working  
**Solution**:
- Check WebSocket connection in browser console
- Verify server listening on correct port
- Check firewall/proxy blocking WebSocket
- Review socket event names match exactly

### Issue: Tests Failing Intermittently
**Symptom**: Random test failures  
**Solution**:
- Check for race conditions
- Use async/await properly
- Mock external dependencies
- Increase timeout for slow operations

---

## 🎯 Code Quality Checklist

Before committing any code:

- [ ] Code follows ESLint standards
- [ ] No console.log() left in production code
- [ ] All functions have JSDoc comments
- [ ] Error handling implemented
- [ ] No hardcoded values (use env vars)
- [ ] No security vulnerabilities (review SECURITY-AUDIT.md)
- [ ] Unit tests added
- [ ] Tests pass locally
- [ ] No console errors
- [ ] README updated if needed
- [ ] API.md updated if endpoints changed
- [ ] Commit message is semantic format

---

## 📞 Getting Help

### If Stuck:

1. **Check Documentation**
   - Search all .md files in docs/
   - Check comments in related code
   - Review similar implementations

2. **Review Related Issues**
   - GitHub Issues for similar problems
   - TROUBLESHOOTING.md for common issues
   - Code comments for context

3. **Ask Team**
   - Post in Discord/Slack
   - Create GitHub Discussion
   - Schedule pairing session

### Questions to Have Answers For:

- What is the exact error message?
- What steps reproduce it?
- What was the expected behavior?
- What does your environment look like?
- What have you tried to fix it?

---

## 🎓 Learning Resources

### For this Project:
- `docs/` - All documentation
- `server/` - Backend code
- `client/src/` - Frontend code
- `test/` - Test examples

### External Resources:
- **Express.js**: https://expressjs.com/
- **Socket.io**: https://socket.io/docs/
- **React**: https://react.dev/
- **Jest**: https://jestjs.io/
- **Zod Validation**: https://zod.dev/
- **Winston Logging**: https://github.com/winstonjs/winston
- **Sentry**: https://sentry.io/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Redis**: https://redis.io/docs/

---

## ✅ Completion Checklist for Agents

When you finish a task, verify:

- [ ] Code changes made
- [ ] Unit tests added/updated
- [ ] Tests pass (npm test)
- [ ] Linting passes (npm run lint)
- [ ] Documentation updated
- [ ] No security issues introduced
- [ ] No performance regressions
- [ ] Commit created (semantic format)
- [ ] PR description complete
- [ ] PR reviewed & approved
- [ ] Merged to main branch
- [ ] Task marked as DONE

---

## 🎯 Success Criteria (Agent Perspective)

For each task/phase:

**Quality**:
- ✅ Code is clean & readable
- ✅ Tests cover edge cases
- ✅ No security vulnerabilities
- ✅ Performance acceptable

**Completeness**:
- ✅ All requirements met
- ✅ Documentation updated
- ✅ No TODOs left
- ✅ Ready for production

**Maintainability**:
- ✅ Code is well-commented
- ✅ Standards followed
- ✅ Easy to extend
- ✅ No technical debt

---

## 🚀 Next Agent Handoff

When passing work to next agent:

1. **Create Summary**
   - What was completed
   - What needs to be done next
   - Any blockers or dependencies

2. **Update Documentation**
   - Mark completed tasks
   - Update status in INDEX.md
   - Add notes for next phase

3. **Prepare Codebase**
   - Ensure all tests pass
   - Code is committed & pushed
   - No uncommitted changes

4. **Communication**
   - Share this document
   - Point to completed work
   - Explain architecture decisions

Example handoff message:
```
Agent 2,

Phase 1 security implementation complete:
✅ Input validation (Zod) - Task 1.1
✅ Logging (Winston) - Task 1.2
✅ CSRF protection - Task 1.3
✅ Security headers (Helmet) - Task 1.4
✅ Rate limiting - Task 1.5

Next: Phase 2 quality improvements
- Setup ESLint + Prettier (Task 2.1)
- Setup Jest testing (Task 2.2)
- Setup GitHub Actions (Task 2.3)

All code in main branch. Tests passing.
See docs/INDEX.md for full roadmap.
```

---

## 📋 Quick Reference: File Locations

```
brancher/
├── server/
│   ├── index.js           # Main Express app
│   ├── db.js              # Database initialization
│   ├── helpers.js         # Utility functions
│   ├── logger.js          # Logging config (to create)
│   ├── schemas.js         # Validation schemas (to create)
│   └── cache.js           # Caching functions (to create)
├── client/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── utils.js       # API helpers
│   │   ├── styles.css     # Global styles
│   │   └── components/    # React components
│   ├── vite.config.js     # Vite configuration
│   └── package.json
├── docs/
│   ├── INDEX.md           # 👈 Documentation index
│   ├── TECHNOLOGY-RESEARCH.md
│   ├── SECURITY-AUDIT.md
│   ├── DESIGN-SYSTEM.md
│   ├── DOCUMENTATION-STANDARDS.md
│   ├── API.md
│   └── archive/           # Laporan sesi lama (tidak diverifikasi)
├── data/
│   ├── brancher.db        # SQLite database
│   ├── sessions.db        # Session store
│   └── uploads/           # User files
├── .env                   # Environment variables
├── .env.example           # Example env file
├── package.json           # Root dependencies
└── README.md              # Project overview
```

---

**Version**: 1.0  
**Last Updated**: 2026-09-30  
**For**: Next Agents & Developers  
**Status**: ✅ READY TO USE

Selamat mengembangkan! 🚀
