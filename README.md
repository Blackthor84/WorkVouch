# PeerCV

A trust-based professional profile platform where users enter job history, are matched with coworkers from overlapping employment, exchange peer references, and build a reputation that employers can view.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js Server Actions + API routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the database migrations:
Execute the SQL in `supabase/schema.sql` in your Supabase SQL editor.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utilities, Supabase client, server actions
- `/types` - TypeScript type definitions
- `/supabase` - Database schema and migrations

## Features

- User authentication with role-based access control
- Professional profile management
- Job history tracking
- Coworker matching and connections
- Peer reference system
- Trust score calculation (v1)
- Employer search and profile viewing
- Admin panel

