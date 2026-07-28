# `gray-merchant/backend` — Auth / SSO Module

This backend re-uses the **SSO / auth** logic from the `authflow` project
(Express + Sequelize + JWT + bcrypt + zod) and re-implements it on top of
**NestJS 11 + Prisma 7** so the same code can authenticate both
shop customers (`USER`) and gray-merchant staff / admin operators
(`STAFF` / `ADMIN`) through one shared set of routes.

The original `authflow` features ported here:

- Email + password **registration** (USER only).
- **Login** for users, and a separate `/auth/staff/login` for staff/admin.
- **JWT access tokens** (short-lived, 15 min) + **rotating refresh tokens**
  persisted in a server-side `Session` table.
- **Session cookie** that carries the refresh token.
- **OAuth2 / PKCE** flow: `/auth/authorize` → `/auth/token`, with
  `S256` (default) and `PLAIN` code-challenge methods.
- **Audit log** (`AuditLog` model) for sensitive events
  (register/login/logout/refresh/lockout/client-token).
- **Rate limiting** (`@nestjs/throttler`) on `/auth/login` and `/auth/register`.
- **Account lockout** after 5 failed logins (15-minute lock).
- **Helmet** + **CORS allow-list** + **trust proxy** + **cookie-parser**.
- **Zod** validation throughout, with a global filter that turns zod
  issues into the same `{ errorCode, message, details }` payload authflow used.

---

## File tree

```
backend/
├── prisma/
│   ├── schema.prisma                # Role, User (USER/STAFF/ADMIN), Session,
│   │                                # Application, AuthorizationCode, AuditLog,
│   │                                # Product (existing domain model)
│   ├── migrations/
│   │   └── 20260601000000_add_auth_models/
│   │       ├── migration.sql        # Hand-authored via `prisma migrate diff`
│   │       └── migration_lock.toml
│   └── seed.ts                      # Seeds Roles, an admin user, the staff app
├── prisma.config.ts                 # Prisma 7 driver-adapter config (URL only)
├── src/
│   ├── main.ts                      # Helmet, CORS, cookies, ValidationPipe,
│   │                                # ZodErrorFilter, trust proxy, listens on $PORT
│   ├── app.module.ts                # Wires Prisma + Audit + Auth + Config +
│   │                                # global ThrottlerModule
│   ├── prisma/
│   │   ├── prisma.module.ts         # @Global module exposing PrismaService
│   │   └── prisma.service.ts        # Wraps PrismaClient with @prisma/adapter-pg
│   ├── common/
│   │   ├── errors.ts                # ErrorPayload type
│   │   ├── http.ts                  # throwApiError / assertPresent / zodIssuesToDetails
│   │   └── cookies.ts               # AUTH_SESSION_COOKIE_NAME, parseCookies,
│   │                                # getRefreshTokenFromRequest, buildSessionCookieOptions
│   ├── audit/
│   │   ├── audit.module.ts          # @Global module exposing AuditService
│   │   └── audit.service.ts         # audit.log(action, payload) helper
│   └── auth/
│       ├── auth.module.ts           # Composes AuthService + JwtStrategy + throttler
│       ├── auth-jwt.module.ts       # JwtModule.register with secret + TTL
│       ├── auth-throttler.module.ts # Per-name throttler buckets + APP_GUARD
│       ├── auth.controller.ts       # All /auth/* endpoints
│       ├── auth.service.ts          # Shared login / refresh / OAuth2 / lockout
│       ├── guards.ts                # JwtStrategy, JwtAuthGuard, UserTypeGuard,
│       │                            # AllowedTypes() decorator
│       ├── jwt-payload.ts           # AccessTokenPayload type
│       ├── zod-error.filter.ts      # Global exception filter (zod + http)
│       └── dto/
│           ├── password.schema.ts   # Min 12 chars + upper/lower/digit/special
│           ├── register.dto.ts      # { email, password, type?: 'USER' }
│           ├── login.dto.ts         # { email, password, client_id?, ...PKCE }
│           ├── staff-login.dto.ts   # { email, password, client_id, client_secret? }
│           ├── refresh.dto.ts       # { refreshToken? }  (cookie fallback)
│           └── authorize.dto.ts     # authorizeQuerySchema + tokenSchema (PKCE)
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

---

## Schema (`prisma/schema.prisma`)

- **`enum UserType { USER STAFF ADMIN }`** — discriminator on `User`.
- **`Role`** — name/description; users may belong to a role (optional).
- **`User`**
  - `id uuid PK`, `email unique`, `password` (bcrypt hash).
  - `type: UserType @default(USER)`, `roleId?` (FK).
  - `failedLoginAttempts int @default(0)`, `lockedUntil DateTime?` (lockout).
- **`Session`** — server-side session row.
  - `token` (current access JWT, `@unique`), `refreshToken` (`@unique`),
    `expiresAt`, `userAgent?`, `ipAddress?`, FK → `User` (cascade).
- **`Application`** — OAuth2 client registrations.
  - `clientId unique`, optional `clientSecret`, fixed `redirectUri`.
- **`AuthorizationCode`** — short-lived OAuth2 codes with PKCE.
  - `code unique`, `clientId`, `redirectUri`, `userId`,
    `codeChallenge?`, `codeChallengeMethod?`, `expiresAt`, `used flag`.
- **`AuditLog`** — `action`, `userId?`, `ipAddress?`, `meta? Json`, timestamp.
- **`Product`** — original gray-merchant domain model (unchanged).

`datasource db { provider = "postgresql" }` — connection URL is provided
by `prisma.config.ts` (Prisma 7 forbids `url` in the datasource block).

---

## Environment variables (`.env` / `.env.example`)

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by Prisma 7 driver-adapter (`@prisma/adapter-pg`). |
| `PORT` | HTTP port (default `3001`). |
| `JWT_SECRET` | HMAC secret for access tokens + client tokens. **Override in prod.** |
| `JWT_ACCESS_TTL` | Access-token TTL (e.g. `15m`). |
| `JWT_REFRESH_TTL_DAYS` | Refresh-token lifetime in days (default `30`). |
| `FRONTEND_ORIGINS` | Comma-separated CORS allow-list. |
| `FRONTEND_LOGIN_URL` | Where `/auth/authorize` redirects users to log in. |
| `AUTH_COOKIE_NAME` | Session cookie name (default `auth_session`). |
| `AUTH_COOKIE_DOMAIN` | Optional — sets `Domain` and `SameSite=None` for SSO. |
| `ALLOW_CROSS_SITE_SSO` | `'true'` enables `SameSite=None` + `Secure` for SSO. |
| `BCRYPT_SALT_ROUNDS` | Cost factor for password hashing (default `12`). |
| `NODE_ENV` | When `production` the session cookie is `Secure`. |

---

## Endpoints (`src/auth/auth.controller.ts`)

All responses are JSON. Validation failures return
`{ errorCode: "VALIDATION_ERROR", message: ..., details: [{field, message}, ...] }`.

### Registration (shop users only)

`POST /auth/register`

```jsonc
// body
{ "email": "alice@example.com", "password": "StrongP4ss!word" }
```

Returns `201 Created` with the new user (without password). Rate-limited
to **5 per hour per IP** via the `register` throttler bucket.

### Login (shop users)

`POST /auth/login`

```jsonc
// body
{
  "email": "alice@example.com",
  "password": "StrongP4ss!word",
  "client_id": "optional-app-client-id",   // optional, for OAuth2 grant
  "redirect_uri": "https://app/callback",  // required when client_id set
  "state": "...",                          // optional
  "code_challenge": "...",                 // PKCE
  "code_challenge_method": "S256"
}
```

- Rate-limited to **10 per 15 min** via the `login` throttler bucket.
- Rejects non-`USER` accounts (staff must use `/auth/staff/login`).
- Sets the `auth_session` cookie to the new refresh token.
- If `client_id` + `redirect_uri` are present, mints an OAuth2
  authorization code and `302` redirects back to `redirect_uri?code=…`.

### Staff / admin login (separate endpoint, requires OAuth2 client)

`POST /auth/staff/login`

```jsonc
{
  "email": "admin@gray-merchant.test",
  "password": "StrongP4ss!word",
  "client_id": "gray-merchant-staff",
  "client_secret": "..."            // optional; if set, the staff app must match
}
```

- Same rate-limit bucket as `/auth/login`.
- Only accepts users whose `type` is `STAFF` or `ADMIN`.
- Audited as `ADMIN_LOGIN_SUCCESS` or `STAFF_LOGIN_SUCCESS`.
- Sets the same `auth_session` cookie as the user login.

### Session lookup

`GET /auth/session`

Returns the authenticated user derived from either the access token
(`Authorization: Bearer ...`) or the refresh-token cookie:

```jsonc
{ "authenticated": true, "user": { "id": "...", "email": "...", "type": "USER", "roleId": null } }
```

### Refresh (rotates the refresh token)

`POST /auth/refresh`

```jsonc
{ "refreshToken": "..." }   // optional — falls back to the cookie
```

Issues a new access + refresh pair, updates the `Session` row, sets a
fresh cookie, and writes an `TOKEN_REFRESH` audit row. Old refresh token
is invalidated.

### Logout

`POST /auth/logout`

Accepts `{ refreshToken? }`, falls back to the cookie and (optionally)
the bearer access token. Deletes the matching `Session` row and clears
the cookie.

### OAuth2 / PKCE — `/auth/authorize`

`GET /auth/authorize?client_id=…&redirect_uri=…&state=…&code_challenge=…&code_challenge_method=S256`

Validates the `client_id` and `redirect_uri` (must match the registered
Application) and returns:

```jsonc
{ "redirect": "<FRONTEND_LOGIN_URL>?client_id=…&redirect_uri=…&state=…&code_challenge=…" }
```

The frontend then renders a login flow that ultimately posts to
`/auth/login` (or `/auth/staff/login`) and gets the authorization-code
redirect.

### OAuth2 / PKCE — `/auth/token`

`POST /auth/token`

```jsonc
{
  "grant_type": "authorization_code",
  "code": "...",
  "client_id": "...",
  "redirect_uri": "...",
  "client_secret": "...",        // optional
  "code_verifier": "..."         // optional, required when challenge was set
}
```

Validates the client, the redirect URI, the client secret (if the
Application has one), and the PKCE verifier against the stored
challenge (S256 by default; PLAIN supported). On success, returns the
standard OAuth2 token response and creates a new session:

```jsonc
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

### OAuth2 client credentials — `/auth/client-token`

`POST /auth/client-token`  body: `{ "clientId": "..." }`

Returns `{ accessToken }` — a short-lived JWT for the client app
itself (1 hour), signed with `JWT_SECRET`.

### Protected example endpoints

- `GET /auth/me` — `@UseGuards(JwtAuthGuard)` → echoes the JWT payload.
- `GET /auth/admin` — `@UseGuards(JwtAuthGuard, UserTypeGuard)` →
  requires the `AllowedTypes(UserType.ADMIN)` decorator metadata; returns
  `403` for any other user type.

To gate a route on a specific user type, attach:

```ts
@AllowedTypes(UserType.ADMIN, UserType.STAFF)
@Get('admin/whatever')
@UseGuards(JwtAuthGuard, UserTypeGuard)
handler() { ... }
```

---

## Authentication flow

```
              ┌──────────────────────────────────────────────────┐
              │   Frontend (Next.js) / Mobile / 3rd-party app    │
              └──────────────────────────────────────────────────┘
                                  │
                                  │  POST /auth/login
                                  │   { email, password, client_id? … }
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │ AuthController.login                                   │
       │  1. validate (zod)                                     │
       │  2. AuthService.loginUser({allowedTypes:[USER]})      │
       │     - bcrypt.compare → success/fail                    │
       │     - on 5 fails → lock account for 15 min            │
       │     - create Session row + refreshToken + accessToken │
       │  3. if client_id present: mint AuthorizationCode +    │
       │     redirect back to redirect_uri?code=…              │
       │  4. set auth_session cookie (HttpOnly, SameSite=Lax)  │
       │  5. audit LOGIN_SUCCESS                                │
       └────────────────────────────────────────────────────────┘
                                  │
                                  │  POST /auth/token
                                  │   { code, code_verifier, … }
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │ AuthController.token                                   │
       │  - verify client_id/redirect_uri/client_secret         │
       │  - AuthService.consumeAuthorizationCode                │
       │      + verify PKCE S256 (or PLAIN)                     │
       │      + mark used=true                                  │
       │  - create new Session for the user                     │
       │  - return { access_token, refresh_token, … }           │
       └────────────────────────────────────────────────────────┘
                                  │
                                  │  POST /auth/refresh  (rotating)
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │ AuthService.refreshAccessToken                         │
       │  - look up Session by refreshToken                     │
       │  - check expiresAt                                     │
       │  - issue new accessToken + new refreshToken            │
       │  - update the Session row in place                     │
       │  - audit TOKEN_REFRESH                                 │
       └────────────────────────────────────────────────────────┘
```

---

## How the codebase is split

- `src/common/http.ts` — error helper (`throwApiError`), zod issue
  formatter, and an `assertPresent<T>(value, name)` guard for narrowing
  `findUnique` results (instead of using `!` everywhere).
- `src/common/cookies.ts` — cookie name, parsing, session-cookie options
  (`httpOnly`, `secure` in prod, `SameSite=None` when cross-site SSO is on).
- `src/audit/audit.service.ts` — `audit.log(action, payload)` is the only
  place that writes to `AuditLog`. Failures are caught + logged so they
  never block a request.
- `src/auth/auth.service.ts` — the *single* source of truth for
  authentication (mirrors authflow's `services/auth.service.js`):
  - `registerUser({ email, password, type })`
  - `loginUser(creds, { allowedTypes, ipAddress, userAgent })`
  - `createSession({ user, ipAddress, userAgent })`
  - `refreshAccessToken(refreshToken, ctx)`
  - `revokeSession({ refreshToken?, accessToken?, ipAddress })`
  - `createAuthorizationCode / consumeAuthorizationCode` (PKCE)
  - `generateClientToken(clientId)` — JWT for the client app itself.
- `src/auth/auth.controller.ts` — wires HTTP routes to `AuthService`.
  Uses `assertPresent` to keep `findUnique` results non-null without
  sprinkling `!`.
- `src/auth/guards.ts` — `JwtStrategy` (passport-jwt),
  `JwtAuthGuard` (passport), `UserTypeGuard` (reflector over the
  `allowedTypes` metadata written by `AllowedTypes(...)` decorator).
- `src/auth/auth-jwt.module.ts` — `JwtModule.register({ secret, signOptions: { expiresIn } })`.
- `src/auth/auth-throttler.module.ts` — per-name throttler buckets
  (`login` 10/15min, `register` 5/hr) registered as `APP_GUARD`.

---

## Scripts

| `npm run …` | Effect |
| --- | --- |
| `build` | `nest build` → `dist/`. |
| `start` | `nest start` (no watch). |
| `start:dev` | `nest start --watch`. |
| `start:prod` | `node dist/src/main`. |
| `lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix`. |
| `test` | `jest`. |
| `test:e2e` | `jest --config ./test/jest-e2e.json`. |
| `format` | `prettier --write "src/**/*.ts" "test/**/*.ts"`. |

---

## Database setup

The Postgres credentials in `.env` are placeholders. To bring the
database up:

1. Provide a working `DATABASE_URL` (e.g.
   `postgresql://user:pass@localhost:5432/gray_merchant?schema=public`).
2. Apply the migration:

   ```sh
   npx prisma migrate deploy
   ```

3. Generate the Prisma client (CJS, matching `moduleFormat = "cjs"` in
   `prisma/schema.prisma` so it loads from the CommonJS build):

   ```sh
   npx prisma generate
   ```

4. Seed the baseline roles, admin user, and the staff OAuth2 client app:

   ```sh
   npx ts-node prisma/seed.ts
   ```

   Defaults:

   - `adminEmail = admin@gray-merchant.test` (override with `SEED_ADMIN_EMAIL`).
   - `adminPassword = ChangeMe123!` (override with `SEED_ADMIN_PASSWORD`).
   - OAuth2 client: `clientId = "gray-merchant-staff"`,
     `redirectUri = "http://localhost:3000/admin/callback"`.

---

## Notes / follow-ups

- The `class-validator` / `class-transformer` packages are installed but
  unused — the project validates with zod. They can be removed safely.
- E2E/unit tests for the auth flows (register / login / staff login /
  refresh / logout / OAuth2 PKCE / `UserTypeGuard`) are not yet written.
- `cookie-parser` types are now imported via `import type` to keep
  `isolatedModules` happy alongside `emitDecoratorMetadata`.
- Prisma 7 emits an ESM client by default; `moduleFormat = "cjs"` in
  the generator + `"type": "commonjs"` in `package.json` keeps the
  runtime build working.
