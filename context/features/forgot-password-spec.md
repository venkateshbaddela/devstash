# Forgot Password & Password Reset Spec

## Overview

Implement forgot password request and password reset flows for DevStash credential users. Reuse the existing `VerificationToken` Prisma model to store reset tokens, dispatch branded reset emails via Resend, and provide dedicated UI pages in `(auth)`.

## Requirements

### 1. Sign In Page Update (`src/app/(auth)/sign-in/page.tsx` & `src/components/auth/sign-in-form.tsx`)
- Add a clickable "Forgot password?" link next to the password input label pointing to `/forgot-password`.
- Add feedback notification for `?reset=true` URL query parameter ("Password reset successfully! You can now sign in with your new password.").

### 2. Forgot Password Page (`src/app/(auth)/forgot-password/page.tsx` & `src/components/auth/forgot-password-form.tsx`)
- Create route `/forgot-password` in `(auth)` group.
- Email input field with client and server validation.
- Branded card matching existing auth UI (`Sign In`, `Register`, `Verify Email`).
- Success confirmation view informing the user that a reset link has been dispatched if an account exists (preventing email enumeration attacks).
- Link back to `/sign-in`.

### 3. Reset Password Page (`src/app/(auth)/reset-password/page.tsx` & `src/components/auth/reset-password-form.tsx`)
- Create route `/reset-password` in `(auth)` group accepting `?token=<token>`.
- If token is missing, expired, or invalid, display an error message with a link to request a new reset link.
- If token is valid, display New Password and Confirm Password inputs with visibility toggles.
- Client and server validation: minimum 8 characters, confirmation match.
- Submitting updates password (bcrypt hashed, 12 rounds), marks email as verified if not already verified, deletes consumed token from `VerificationToken`, and redirects to `/sign-in?reset=true`.

### 4. Password Reset Token Utility (`src/lib/tokens.ts`)
- Reuse existing Prisma `VerificationToken` model (`identifier`, `token`, `expires`).
- Namespace identifier as `password-reset:${email}` to isolate from email verification tokens.
- Expiration: 1 hour (standard security practice for password reset tokens).
- Delete existing password reset tokens for the identifier before creating a new one.
- Helper to validate token and consume it upon successful password reset.

### 5. Email Dispatch (`src/lib/mail.ts`)
- Implement `sendPasswordResetEmail(email, token)` using Resend.
- Branded HTML and plain-text email matching DevStash styling with reset link (`/reset-password?token=${token}`).

### 6. Server Actions (`src/actions/auth.ts`)
- `requestPasswordResetAction(email: string)`:
  - Validate email format.
  - Check if user exists (generic success response to prevent enumeration).
  - Generate password reset token.
  - Send email via Resend.
- `resetPasswordAction(token: string, password: string, confirmPassword: string)`:
  - Validate inputs.
  - Validate token and expiration.
  - Hash password with bcrypt (12 rounds).
  - Update user password and delete verification token in transaction.

### 7. Automated Testing & Verification
- Script or integration tests verifying:
  - Token generation and namespace isolation.
  - Token expiration and consumption.
  - Password update in database with bcrypt verification.
  - Sign-in with new password succeeds.
  - Old password is invalidated.
