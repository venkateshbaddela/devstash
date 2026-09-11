# Authentication Security Review

**Last Audit Date:** 2026-09-11 08:15:00 UTC  
**Auditor:** Auth Security Auditor Subagent  
**Scope:** NextAuth v5, Email Verification, Password Reset, Profile Management, Credentials & OAuth Flows  
**Status:** Action Required

---

## Executive Summary

A comprehensive security audit of DevStash's authentication architecture and user-management implementations was conducted on September 11, 2026. The scope covered NextAuth v5 (Auth.js beta) configuration, credentials authorization, email verification, password reset flows, profile and security settings server actions, token lifecycle management, database schema design, and client-side forms.

The audit identified several strengths in the existing codebase: consistent bcrypt work factors (12 salt rounds), timing-safe credential comparisons, cryptographically secure random token generation (UUIDv4 with 122 bits of entropy), atomic single-use token consumption via `prisma.$transaction`, strict server-side session checks preventing IDOR vulnerabilities in all profile actions, robust safeguards protecting prototype demo accounts, and defense against Host Header Poisoning by deriving link origins from trusted server environment variables.

However, three **High** severity vulnerabilities and three **Medium/Low** severity issues require prompt remediation:
1. **Stale JWT Session Persistence**: NextAuth uses a stateless JWT session strategy without verifying session validity against a user session version, `tokenVersion`, or `updatedAt` timestamp. Consequently, when a user resets or changes their password, existing active JWT sessions remain valid until their expiration.
2. **Plaintext Sensitive Token Storage**: Password reset tokens are stored unhashed in the `verification_tokens` database table. A read-only database leak or backup exposure immediately yields full account takeover capabilities.
3. **Missing Rate Limiting**: There is no throttling or rate limiting on public authentication endpoints (`POST /api/auth/register`, credential sign-in attempts in `authorize()`, `POST /api/auth/resend-verification`, and `requestPasswordResetAction`), exposing the platform to credential stuffing, resource exhaustion, and email bombing.
4. **Account Enumeration in Resend Verification**: An information disclosure flaw in `resend-verification` allows attackers to distinguish registered verified accounts from non-existent accounts.
5. **Missing Password Maximum Length**: Missing upper bound validation allows inputs exceeding bcrypt's 72-byte truncation boundary, leading to silent truncation and potential CPU starvation DoS.
6. **Non-Atomic Registration Error State**: Multi-step registration commits a user record before token creation and email dispatch; failures during dispatch leave unverified accounts in an irrecoverable state.

---

## Findings Summary

| Severity | Count | Status |
| :--- | :--- | :--- |
| **Critical** | 0 | Resolved |
| **High** | 3 | Requires Attention |
| **Medium** | 2 | Requires Attention |
| **Low** | 1 | Requires Attention |
| **Passed Checks** | 18 | Verified Secure |

---

## Detailed Findings

### [HIGH-1] Active Session Invalidation Missing on Password Reset & Password Change

- **Severity:** High
- **Files:** [`src/actions/auth.ts`](file:///workspaces/devstash/src/actions/auth.ts#L110-L153), [`src/actions/profile.ts`](file:///workspaces/devstash/src/actions/profile.ts#L318-L380), [`src/auth.config.ts`](file:///workspaces/devstash/src/auth.config.ts#L23-L36), [`prisma/schema.prisma`](file:///workspaces/devstash/prisma/schema.prisma#L19-L45)
- **Lines:** `src/actions/auth.ts:L110-153`, `src/actions/profile.ts:L318-380`, `src/auth.config.ts:L23-36`, `prisma/schema.prisma:L19-45`
- **Vulnerability Type:** Stale Session Persistence / Incomplete Session Revocation (CWE-613)
- **Description:**  
  NextAuth is configured with a stateless JWT session strategy (`session: { strategy: "jwt" }` in `src/auth.ts`). When a user changes their password via `changePasswordAction` or completes a password reset via `resetPasswordAction`, the password hash in the database is updated. However, the existing active JWT sessions issued to that user on any browser or device are **not** invalidated.  
  In [`src/auth.config.ts`](file:///workspaces/devstash/src/auth.config.ts#L24-L35), the `jwt` callback only writes `user.id` to `token.id` during the initial sign-in handshake:
  ```typescript
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
      }
      return session;
    },
  },
  ```
  Because the JWT is stateless and the callback never checks a `tokenVersion` or `passwordChangedAt` timestamp against the database or cache, any active JWT session issued prior to the password reset remains 100% valid for its full lifetime (default 30 days).
- **Impact:**  
  If a user resets or changes their password due to a suspected account compromise, stolen device, or session hijacking, the attacker retains full authenticated access to the user's private knowledge base, snippets, notes, and collections.
- **Evidence / Current Code:**
  [`src/actions/auth.ts`](file:///workspaces/devstash/src/actions/auth.ts#L132-L148):
  ```typescript
  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await consumePasswordResetToken(token.trim(), hashedPassword);
  // Returns success without invalidating existing JWT sessions
  return { success: true, email: result.email };
  ```
- **Recommended Fix:**
  1. Add a `tokenVersion Int @default(0)` field to the `User` model in `prisma/schema.prisma`:
     ```prisma
     model User {
       id           String   @id @default(cuid())
       // ... existing fields ...
       tokenVersion Int      @default(0)
     }
     ```
  2. Increment `tokenVersion` in `consumePasswordResetToken` ([`src/lib/tokens.ts`](file:///workspaces/devstash/src/lib/tokens.ts)) and `changePasswordAction` ([`src/actions/profile.ts`](file:///workspaces/devstash/src/actions/profile.ts)):
     ```typescript
     await prisma.user.update({
       where: { id: user.id },
       data: {
         password: hashedPassword,
         tokenVersion: { increment: 1 },
       },
     });
     ```
  3. Store `tokenVersion` in the JWT and validate it in the `jwt` callback in [`src/auth.ts`](file:///workspaces/devstash/src/auth.ts):
     ```typescript
     async jwt({ token, user }) {
       if (user) {
         token.id = user.id;
         token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
         return token;
       }

       // Periodically or on each request, verify tokenVersion against database
       if (token.id) {
         const dbUser = await prisma.user.findUnique({
           where: { id: token.id as string },
           select: { tokenVersion: true },
         });

         if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
           // Invalidate session
           return null;
         }
       }
       return token;
     }
     ```

---

### [HIGH-2] Plaintext Storage of Sensitive Password Reset Tokens in Database

- **Severity:** High
- **Files:** [`src/lib/tokens.ts`](file:///workspaces/devstash/src/lib/tokens.ts#L133-L174), [`prisma/schema.prisma`](file:///workspaces/devstash/prisma/schema.prisma#L79-L86)
- **Lines:** `src/lib/tokens.ts:L133-154`, `L160-174`, `L227-276`
- **Vulnerability Type:** Insecure Credential / Sensitive Token Storage (CWE-312 / CWE-256)
- **Description:**  
  In [`src/lib/tokens.ts`](file:///workspaces/devstash/src/lib/tokens.ts#L133-L154), `generatePasswordResetToken()` generates a raw UUIDv4 token using `crypto.randomUUID()` and persists it in plaintext to the `VerificationToken` table:
  ```typescript
  const token = crypto.randomUUID();
  // ...
  const resetToken = await prisma.verificationToken.create({
    data: {
      identifier,
      token, // Stored in plaintext
      expires,
    },
  });
  ```
  Password reset tokens act as temporary bearer credentials that allow resetting account passwords without possessing the current password. Storing raw tokens in plaintext violates the principle of defense-in-depth.
- **Impact:**  
  Any vulnerability granting read-only access to the database (such as a SQL injection in another module, an unencrypted database snapshot leak, a compromised read replica, or unauthorized access to production database logs) immediately exposes all active password reset tokens, allowing an attacker to take over arbitrary accounts within the 1-hour validity window.
- **Evidence / Current Code:**
  [`src/lib/tokens.ts`](file:///workspaces/devstash/src/lib/tokens.ts#L133-L154):
  ```typescript
  export async function generatePasswordResetToken(email: string) {
    const identifier = getPasswordResetIdentifier(email);
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    const resetToken = await prisma.verificationToken.create({
      data: {
        identifier,
        token, // Plaintext UUID
        expires,
      },
    });

    return resetToken;
  }
  ```
- **Recommended Fix:**  
  Store a SHA-256 cryptographic hash of the token in the database, while sending the raw unhashed token to the user's email:
  ```typescript
  import crypto from "crypto";

  function hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  export async function generatePasswordResetToken(email: string) {
    const identifier = getPasswordResetIdentifier(email);
    const rawToken = crypto.randomUUID();
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: hashedToken,
        expires,
      },
    });

    // Return the unhashed token to be dispatched in the email
    return { token: rawToken, expires, identifier };
  }

  export async function getPasswordResetTokenByToken(rawToken: string) {
    const hashedToken = hashToken(rawToken);
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!tokenRecord || !tokenRecord.identifier.startsWith(PASSWORD_RESET_PREFIX)) {
      return null;
    }

    return tokenRecord;
  }
  ```

---

### [HIGH-3] Missing Rate Limiting and Abuse Prevention on Public Auth Endpoints

- **Severity:** High
- **Files:** [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L7-L124), [`src/auth.ts`](file:///workspaces/devstash/src/auth.ts#L25-L56), [`src/app/api/auth/resend-verification/route.ts`](file:///workspaces/devstash/src/app/api/auth/resend-verification/route.ts#L6-L76), [`src/actions/auth.ts`](file:///workspaces/devstash/src/actions/auth.ts#L18-L108)
- **Lines:** `src/app/api/auth/register/route.ts:L7-124`, `src/auth.ts:L25-56`, `src/app/api/auth/resend-verification/route.ts:L6-76`, `src/actions/auth.ts:L18-51, L72-108`
- **Vulnerability Type:** Missing Rate Limiting / Abuse / Resource Exhaustion (CWE-799 / CWE-307)
- **Description:**  
  NextAuth v5 does not provide built-in rate limiting or throttling for credentials login, registration, or password reset requests. None of DevStash's public authentication endpoints implement rate limiting or request throttling:
  1. **Registration Abuse (`POST /api/auth/register`)**: An unauthenticated attacker can spam registration requests to exhaust database storage, flood mail servers, and saturate CPU by repeatedly executing `bcrypt.hash` with 12 salt rounds.
  2. **Credential Stuffing / Brute-Force (`authorize` in `src/auth.ts`)**: No exponential backoff, CAPTCHA, or account lockout exists on failed password attempts. Attackers can execute automated dictionary attacks against known user email addresses.
  3. **Email Bombing & Resend API Quota Exhaustion (`resend-verification` and `requestPasswordResetAction`)**: Any user or script can repeatedly trigger verification or reset emails to any target address, exhausting Resend quota allowances and causing recipient inbox spamming.
- **Impact:**  
  Denial of service through CPU starvation, database storage flooding, Resend account suspension for quota exhaustion or spam complaints, and increased risk of credential guessing.
- **Evidence / Current Code:**
  [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L7):
  ```typescript
  export async function POST(request: Request) {
    // Zero rate limiting / IP check prior to parsing, hashing, and creating records
    const body = await request.json().catch(() => null);
    // ...
    const hashedPassword = await bcrypt.hash(password, 12);
    // ...
  ```
- **Recommended Fix:**  
  Introduce an in-memory or Redis-backed rate limiter (such as `@upstash/ratelimit` or a sliding window token bucket) at the network edge or in route handlers/middleware:
  ```typescript
  import { headers } from "next/headers";
  import { rateLimit } from "@/lib/rate-limit"; // Utility implementing sliding-window rate limiting

  // In POST /api/auth/register:
  const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await rateLimit(`register:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  // In requestPasswordResetAction & resendVerificationAction:
  // Enforce a maximum of 3 requests per email per hour, with a 60-second minimum cooldown.
  ```

---

### [MED-1] Account Enumeration Vulnerability in Verification Resend Flow

- **Severity:** Medium
- **Files:** [`src/app/api/auth/resend-verification/route.ts`](file:///workspaces/devstash/src/app/api/auth/resend-verification/route.ts#L39-L52), [`src/actions/auth.ts`](file:///workspaces/devstash/src/actions/auth.ts#L25-L37)
- **Lines:** `src/app/api/auth/resend-verification/route.ts:L39-52`, `src/actions/auth.ts:L25-37`
- **Vulnerability Type:** Information Exposure / Account Enumeration (CWE-200)
- **Description:**  
  The endpoint attempts to prevent account enumeration when a user does not exist by returning a generic 200 message:
  ```typescript
  if (!user) {
    return NextResponse.json(
      { message: "If an account exists with this email, a verification link has been sent." },
      { status: 200 }
    );
  }
  ```
  However, immediately following that check, if the user exists and has already verified their email, the handler returns an explicit error:
  ```typescript
  if (user.emailVerified) {
    return NextResponse.json(
      { error: "This email is already verified. Please sign in directly." },
      { status: 400 }
    );
  }
  ```
  Similarly, `resendVerificationAction` in `src/actions/auth.ts` returns `{ success: false, error: "This email address is already verified..." }`.
- **Impact:**  
  An attacker can probe any list of email addresses (e.g. employee directories or leaked credential dumps). An HTTP 400 error confirms with certainty that the email corresponds to a registered, active account on DevStash.
- **Evidence / Current Code:**
  [`src/app/api/auth/resend-verification/route.ts`](file:///workspaces/devstash/src/app/api/auth/resend-verification/route.ts#L39-L52):
  ```typescript
  if (!user) {
    return NextResponse.json(
      { message: "If an account exists with this email, a verification link has been sent." },
      { status: 200 }
    );
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { error: "This email is already verified. Please sign in directly." },
      { status: 400 }
    );
  }
  ```
- **Recommended Fix:**  
  Return the exact same generic message regardless of whether the user does not exist or has already been verified:
  ```typescript
  if (!user || user.emailVerified) {
    return NextResponse.json(
      { message: "If an account exists with this email and requires verification, a link has been sent." },
      { status: 200 }
    );
  }
  ```

---

### [MED-2] Missing Password Maximum Length Constraint (Bcrypt 72-Byte Truncation & CPU DoS)

- **Severity:** Medium
- **Files:** [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L53-L58), [`src/actions/auth.ts`](file:///workspaces/devstash/src/actions/auth.ts#L124-L126), [`src/actions/profile.ts`](file:///workspaces/devstash/src/actions/profile.ts#L344-L346)
- **Lines:** `src/app/api/auth/register/route.ts:L53-58`, `src/actions/auth.ts:L124-126`, `src/actions/profile.ts:L344-346`
- **Vulnerability Type:** Input Validation / Truncation / CPU Resource Consumption (CWE-20 / CWE-400)
- **Description:**  
  Password validation across registration, password reset, and change password only verifies a minimum length of 8 characters:
  ```typescript
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }
  ```
  There is no maximum character or byte length limit enforced.  
  Bcrypt has a known fundamental limitation: it only hashes the first 72 bytes of an input string and silently truncates any subsequent characters. If a user sets a password longer than 72 bytes, the trailing characters are ignored, creating a false perception of security. Furthermore, submitting excessively large payloads (e.g. 100KB–10MB strings) into `bcrypt.hash()` or `bcrypt.compare()` forces the server to process massive buffers, creating a Denial of Service attack vector.
- **Impact:**  
  Silent password truncation and potential CPU exhaustion attacks against the server's Node.js event loop during hashing.
- **Evidence / Current Code:**
  [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L53-L58):
  ```typescript
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }
  // Missing check: if (password.length > 72)
  ```
- **Recommended Fix:**  
  Enforce a strict maximum length constraint (e.g. $\le 72$ characters or bytes) across all password handling routines:
  ```typescript
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: "Password must be between 8 and 72 characters long." },
      { status: 400 }
    );
  }
  ```

---

### [LOW-1] Non-Atomic Registration State on Token Generation or Email Dispatch Failure

- **Severity:** Low
- **Files:** [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L84-L116)
- **Lines:** `src/app/api/auth/register/route.ts:L84-116`
- **Vulnerability Type:** Non-Atomic Multi-Step Registration / Error State Handling
- **Description:**  
  In [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L84-L103), user creation, verification token generation, and email dispatch are executed sequentially:
  ```typescript
  const user = await prisma.user.create({ ... });
  const verificationToken = await generateVerificationToken(normalizedEmail);
  const mailResult = await sendVerificationEmail(normalizedEmail, verificationToken.token);
  ```
  If an uncaught exception occurs during `generateVerificationToken()` or inside `sendVerificationEmail()`, the catch block catches the error and responds with HTTP 500. However, the `User` record was already committed to PostgreSQL.  
  Because `emailVerified` is null, the user cannot log in. When the user attempts to re-register, line 69 detects the record and responds with HTTP 409 ("User already exists with this email").
- **Impact:**  
  Legitimate users become trapped in an unverified state without an email dispatched, unable to complete registration or sign in without manually finding the resend verification form.
- **Evidence / Current Code:**
  [`src/app/api/auth/register/route.ts`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L84-L116):
  ```typescript
  const user = await prisma.user.create({ ... }); // Committed
  const verificationToken = await generateVerificationToken(normalizedEmail); // If this throws...
  const mailResult = await sendVerificationEmail(normalizedEmail, verificationToken.token);
  ```
- **Recommended Fix:**  
  Execute the user creation and token creation atomically in a transaction, and handle email dispatch errors gracefully so the user is informed to use the resend verification link:
  ```typescript
  const { user, token } = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true },
    });

    const rawToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await tx.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: rawToken,
        expires,
      },
    });

    return { user: newUser, token: rawToken };
  });

  const mailResult = await sendVerificationEmail(normalizedEmail, token);
  ```

---

## Passed Checks

The following authentication security controls were thoroughly verified and meet high security standards:

### 1. Password Hashing & Storage
- [x] **Bcrypt Work Factor:** Consistently verified 12 salt rounds across registration ([`src/app/api/auth/register/route.ts:L81`](file:///workspaces/devstash/src/app/api/auth/register/route.ts#L81)), password reset ([`src/actions/auth.ts:L132`](file:///workspaces/devstash/src/actions/auth.ts#L132)), and profile password changes ([`src/actions/profile.ts:L369`](file:///workspaces/devstash/src/actions/profile.ts#L369)).
- [x] **Timing-Safe Password Comparison:** `bcrypt.compare()` is strictly used for credential verification in `authorize()` ([`src/auth.ts:L41`](file:///workspaces/devstash/src/auth.ts#L41)) and current password validation in `changePasswordAction` ([`src/actions/profile.ts:L364`](file:///workspaces/devstash/src/actions/profile.ts#L364)).
- [x] **Credential Confidentiality in Queries:** Passwords and password hashes are never logged to console or telemetry, and are safely excluded from client DTOs in `getUserProfile` ([`src/lib/db/profile.ts:L62-76`](file:///workspaces/devstash/src/lib/db/profile.ts#L62-L76)).

### 2. Email Verification Flow
- [x] **Cryptographic Token Entropy:** Tokens are generated using `crypto.randomUUID()` ([`src/lib/tokens.ts:L12`](file:///workspaces/devstash/src/lib/tokens.ts#L12)), providing 122 bits of CSPRNG entropy.
- [x] **Atomic Token Consumption:** Verification atomically updates `emailVerified` and deletes the consumed token in a single `prisma.$transaction()` ([`src/lib/tokens.ts:L95-105`](file:///workspaces/devstash/src/lib/tokens.ts#L95-L105)), preventing race conditions and replay attacks.
- [x] **Unverified Login Gate:** Credentials `authorize()` strictly throws `EmailNotVerifiedError` if `user.emailVerified` is null ([`src/auth.ts:L46-48`](file:///workspaces/devstash/src/auth.ts#L46-L48)), preventing unauthorized session issuance.
- [x] **Invalidation of Previous Tokens:** Requesting a new verification token automatically invalidates any existing unconsumed tokens for that email address ([`src/lib/tokens.ts:L16-20`](file:///workspaces/devstash/src/lib/tokens.ts#L16-L20)).
- [x] **Token Lifespan Enforcement:** Expired verification tokens (> 24 hours) are rejected and purged ([`src/lib/tokens.ts:L77-84`](file:///workspaces/devstash/src/lib/tokens.ts#L77-L84)).

### 3. Password Reset Flow
- [x] **Account Enumeration Defense:** `requestPasswordResetAction` returns an identical success message regardless of whether the email exists in the database ([`src/actions/auth.ts:L88-103`](file:///workspaces/devstash/src/actions/auth.ts#L88-L103)).
- [x] **Namespace Isolation:** Password reset tokens use a `password-reset:${email}` identifier prefix ([`src/lib/tokens.ts:L114-126`](file:///workspaces/devstash/src/lib/tokens.ts#L114-L126)), ensuring verification tokens cannot be substituted for reset tokens.
- [x] **Restricted Expiration Window:** Password reset tokens expire strictly within 1 hour ([`src/lib/tokens.ts:L115`](file:///workspaces/devstash/src/lib/tokens.ts#L115)).
- [x] **Single-Use Atomicity:** `consumePasswordResetToken` updates the user's password and deletes the token inside a `prisma.$transaction()` ([`src/lib/tokens.ts:L261-273`](file:///workspaces/devstash/src/lib/tokens.ts#L261-L273)).
- [x] **Automatic Email Verification Grant:** Successfully proving ownership of the email inbox via password reset marks an unverified email as verified ([`src/lib/tokens.ts:L267`](file:///workspaces/devstash/src/lib/tokens.ts#L267)).

### 4. Profile & Account Management
- [x] **Server-Side Session Authentication:** All profile actions (`updateAvatarAction`, `updateProfileDetailsAction`, `updateNameAction`, `updateEmailAction`, `changePasswordAction`, `deleteAccountAction`) authenticate via `await auth()` on the server.
- [x] **IDOR Prevention:** All database operations strictly query by `session.user.id` or `session.user.email` derived directly from the authenticated session.
- [x] **Current Password Requirement:** Changing passwords requires validation of the user's current password with `bcrypt.compare` ([`src/actions/profile.ts:L364-367`](file:///workspaces/devstash/src/actions/profile.ts#L364-L367)).
- [x] **OAuth Guardrails:** Users authenticated via GitHub OAuth without a local password are explicitly prevented from invoking password changes or desynchronizing their email address ([`src/actions/profile.ts:L122-127, L267-273, L357-362`](file:///workspaces/devstash/src/actions/profile.ts#L122-L127)).
- [x] **Email Re-Verification:** Modifying an account email address immediately resets `emailVerified: null` and dispatches a verification link to the new address ([`src/actions/profile.ts:L143-150, L288-297`](file:///workspaces/devstash/src/actions/profile.ts#L143-L150)).
- [x] **Avatar Upload Validation:** Avatars validate base64 MIME type prefixes (`png`, `jpeg`, `jpg`, `webp`, `gif`) and enforce a strict 3MB size limit ([`src/actions/profile.ts:L31-42`](file:///workspaces/devstash/src/actions/profile.ts#L31-L42)).
- [x] **Safe Account Deletion:** Requires typed confirmation of the user's email, cleans up verification tokens and user records in a transaction, cascades related data, and signs out the session ([`src/actions/profile.ts:L386-435`](file:///workspaces/devstash/src/actions/profile.ts#L386-L435)).
- [x] **Demo Account Protection:** The demo account `demo@devstash.io` is strictly protected against profile edits, password modifications, and deletion across all actions.

### 5. URL & Redirection Defenses
- [x] **Host Header Injection Protection:** Reset and verification email links are constructed using trusted server environment variables (`AUTH_URL`, `NEXTAUTH_URL`, `VERCEL_URL`) rather than untrusted request headers ([`src/lib/mail.ts:L8-13`](file:///workspaces/devstash/src/lib/mail.ts#L8-L13)).
- [x] **Open Redirect Protection:** NextAuth and client components enforce relative URL path sanitization for `callbackUrl` redirects ([`src/components/auth/sign-in-form.tsx:L24-27`](file:///workspaces/devstash/src/components/auth/sign-in-form.tsx#L24-L27)).

### 6. NextAuth v5 Built-In Defenses (Verified Active)
- [x] **CSRF Protection:** Managed automatically by NextAuth v5 endpoints and Next.js Server Action origin verification.
- [x] **Session Cookie Security:** Session cookies are configured with `HttpOnly`, `SameSite=lax`, and `Secure` (in production) flags.
- [x] **OAuth State & PKCE:** Cryptographic `state` and PKCE (`code_verifier` / `code_challenge`) parameters are handled automatically for the GitHub OAuth provider.
- [x] **JWT Integrity:** Session JWTs are signed and encrypted with `AUTH_SECRET`.

---

## Prioritized Remediation Plan

| Priority | Finding ID | Remediation Task | Est. Effort | Impact |
| :---: | :---: | :--- | :---: | :--- |
| **1** | **HIGH-1** | Add `tokenVersion` to `User` model, increment on password change/reset, and validate inside NextAuth `jwt` callback to invalidate existing sessions. | Medium (1-2 hrs) | Eliminates persistent unauthorized access after password changes. |
| **2** | **HIGH-2** | Store SHA-256 hashes of password reset tokens in `verification_tokens` table instead of raw tokens. | Low (30 mins) | Prevents account takeover from database or backup read exposure. |
| **3** | **HIGH-3** | Add rate limiting to `register`, `resend-verification`, `requestPasswordResetAction`, and credentials login attempts. | Medium (1-2 hrs) | Prevents brute-forcing, CPU starvation, and Resend email quota exhaustion. |
| **4** | **MED-1** | Unify `resend-verification` response message so verified accounts return the same message as non-existent accounts. | Low (15 mins) | Eliminates user account enumeration. |
| **5** | **MED-2** | Add a maximum password length constraint ($\le 72$ characters) to `register`, `resetPasswordAction`, and `changePasswordAction`. | Low (15 mins) | Prevents silent bcrypt truncation and CPU exhaustion on large strings. |
| **6** | **LOW-1** | Wrap user registration and token creation into a single `prisma.$transaction`. | Low (30 mins) | Prevents orphan unverified user accounts during email dispatch failures. |