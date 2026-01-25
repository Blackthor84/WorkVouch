# NextAuth Setup Complete

## ✅ What Was Implemented

### 1. NextAuth Configuration (`app/api/auth/[...nextauth]/route.ts`)
- **CredentialsProvider**: Authenticates users with email/password using Supabase Auth
- **JWT Strategy**: Sessions stored as JWT tokens
- **30-Day Sessions**: `maxAge: 30 * 24 * 60 * 60`
- **Secure Cookies**: HTTP-only, secure in production, SameSite=lax
- **Role Support**: Admin and user roles from Supabase `user_roles` table
- **Session Callbacks**: Properly stores user ID, email, role, and all roles in JWT and session

### 2. Sign-In Page (`app/auth/signin/page.tsx`)
- Uses NextAuth `signIn()` function
- Redirects based on role:
  - **Admins** → `/admin`
  - **Employers** → `/employer/dashboard`
  - **Regular Users** → `/` (homepage)
- Proper error handling and loading states

### 3. Admin Page Protection
All admin pages now use NextAuth session checks:
- `app/admin/page.tsx`
- `app/admin/ads/page.tsx`
- `app/admin/disputes/page.tsx`
- `app/admin/verifications/page.tsx`
- `app/admin/users/page.tsx`

All redirect to `/auth/signin` if unauthorized.

### 4. TypeScript Types (`types/next-auth.d.ts`)
- Extended NextAuth types to include `role` and `roles` in Session and User
- Proper type safety for admin checks

### 5. Helper File (`lib/auth-config.ts`)
- Exports `authOptions` for easy import in server components

## 🔧 Environment Variables Required

Add these to your `.env.local` and Vercel:

```env
NEXTAUTH_URL=https://tryworkvouch.com
NEXTAUTH_SECRET=<generate-a-random-secret>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## 📝 How It Works

1. **User logs in** at `/auth/signin`
2. **NextAuth** calls `authorize()` function
3. **Supabase Auth** verifies email/password
4. **User roles** fetched from `user_roles` table
5. **JWT token** created with user info and roles
6. **Session** stored in secure HTTP-only cookie
7. **Redirect** based on role (admin → `/admin`, user → `/`)

## 🔒 Security Features

- ✅ HTTP-only cookies (prevents XSS)
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite=lax (CSRF protection)
- ✅ 30-day session expiration
- ✅ Role-based access control
- ✅ Admin pages protected

## 🧪 Testing

1. **Admin Login**:
   - Login with admin credentials
   - Should redirect to `/admin`
   - Session should persist across refreshes

2. **Regular User Login**:
   - Login with regular user credentials
   - Should redirect to `/` (homepage)
   - Session should persist

3. **Unauthorized Access**:
   - Try accessing `/admin` without login
   - Should redirect to `/auth/signin`

## 📚 Usage in Server Components

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    redirect("/auth/signin");
  }
  
  return <div>Protected content</div>;
}
```

## 📚 Usage in Client Components

```typescript
"use client";
import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session } = useSession();
  
  if (session?.user?.role === "admin") {
    return <div>Admin content</div>;
  }
  
  return <div>User content</div>;
}
```

## ⚠️ Important Notes

- NextAuth authenticates against **Supabase Auth** (existing credentials work)
- User roles are fetched from **Supabase `user_roles` table**
- Sessions are managed by **NextAuth** (not Supabase sessions)
- All existing Supabase users can log in with NextAuth
- Admin role is determined by `admin` or `superadmin` in `user_roles` table
