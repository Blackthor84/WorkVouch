# PeerCV Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migrations

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Run the SQL script
5. This will create all tables, indexes, RLS policies, and triggers

### 4. Set Up Storage (Optional - for profile photos)

1. In Supabase dashboard, go to Storage
2. Create a new bucket named `profile-photos`
3. Set it to public if you want profile photos to be publicly accessible
4. Configure RLS policies as needed

### 5. Create First Admin User

After running the schema, you'll need to manually create an admin user:

1. Sign up a user through the app
2. Note their user ID from the Supabase Auth dashboard
3. Run this SQL in the Supabase SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('<user-id-from-auth>', 'admin');
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── jobs/              # Job-related pages
│   ├── references/        # Reference pages
│   ├── employer/          # Employer pages
│   └── admin/             # Admin panel
├── components/            # React components
├── lib/                   # Utilities and server actions
│   ├── actions/          # Server actions
│   └── supabase/         # Supabase clients
├── types/                 # TypeScript type definitions
└── supabase/             # Database schema
```

## Key Features

- **Authentication**: Email/password signup and signin via Supabase Auth
- **User Profiles**: Editable profiles with visibility controls
- **Job History**: Add, edit, and delete job entries
- **Coworker Matching**: Find potential coworkers based on overlapping employment
- **Peer References**: Create and view peer references
- **Trust Score**: Automatic calculation based on jobs and references (v1)
- **Employer Search**: Employers can search and view public profiles
- **Admin Panel**: Admin tools for managing users, jobs, and references

## Security

- All database operations are protected by Row Level Security (RLS) policies
- Role-based access control enforced at both database and application levels
- Middleware protects routes based on user roles
- Private jobs and profiles are never visible to unauthorized users

## Next Steps

1. Customize the UI styling to match your brand
2. Implement file upload for profile photos
3. Add email notifications for connection requests
4. Enhance the trust score algorithm (currently v1)
5. Add more sophisticated matching algorithms
6. Implement Stripe payments when ready

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The database schema is designed to be production-ready with proper indexes, foreign keys, and RLS policies.

