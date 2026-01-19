# PeerCV Architecture Documentation

## Overview

PeerCV is built as a production-ready foundation with a focus on security, scalability, and extensibility. The architecture is designed to support future phases without requiring rewrites.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (ready for profile photos)
- **ORM**: Direct Supabase SQL with typed helpers

## Database Architecture

### Core Tables

1. **profiles** - User profile data (extends Supabase auth.users)
2. **user_roles** - Junction table for multiple roles per user
3. **jobs** - Job history entries
4. **connections** - Coworker connections (bidirectional)
5. **references** - Peer references (immutable)
6. **trust_scores** - Calculated trust scores (v1, replaceable)

### Key Design Decisions

- **Foreign Keys**: All relationships use foreign keys for data integrity
- **Indexes**: Optimized for matching logic (company names, dates, user lookups)
- **RLS Policies**: Row-level security on all tables
- **Audit Trail**: All tables have created_at/updated_at timestamps
- **Soft Deletes**: References use is_deleted flag for audit trail

### Trust Score (V1)

The trust score calculation is intentionally simple and marked as "v1" to indicate it's replaceable:

- **Formula**: Job count (30%) + Reference count (40%) + Average rating (30%)
- **Stored**: Calculated scores are stored in `trust_scores` table
- **Triggers**: Automatically recalculated on job/reference changes
- **Future**: Can be replaced with more sophisticated algorithms

## Security Architecture

### Row Level Security (RLS)

All tables have RLS enabled with policies for:

- **Users**: Can view own profile + public profiles
- **Employers**: Can view public profiles and public jobs
- **Admins**: Can view all data
- **Jobs**: Private jobs never visible to employers
- **References**: Only visible for public jobs (employer view)
- **Connections**: Users can only see their own connections

### Middleware Protection

- Route-level protection based on user roles
- Admin routes require admin role
- Employer routes require employer or admin role
- Dashboard requires authentication

### Server Actions

All database operations go through server actions with:
- Authentication checks
- Authorization checks
- Input validation
- Error handling

## Application Structure

### Pages (App Router)

- `/` - Landing page
- `/auth/signup` - User registration
- `/auth/signin` - User login
- `/dashboard` - Main user dashboard
- `/jobs/[jobId]/coworkers` - Find coworkers for a job
- `/references/request` - Create a reference
- `/employer/search` - Employer search (employer only)
- `/employer/profile/[userId]` - View public profile (employer only)
- `/admin` - Admin panel (admin only)

### Server Actions

Organized by domain:

- `lib/actions/profile.ts` - Profile management
- `lib/actions/jobs.ts` - Job CRUD operations
- `lib/actions/connections.ts` - Coworker matching and connections
- `lib/actions/references.ts` - Reference creation and viewing
- `lib/actions/employer.ts` - Employer-specific operations
- `lib/actions/admin.ts` - Admin operations

### Components

Reusable components organized by feature:

- Navigation: `navbar.tsx`, `sign-out-button.tsx`
- Auth: `sign-up-form.tsx`, `sign-in-form.tsx`
- Dashboard: `profile-section.tsx`, `jobs-section.tsx`, `connections-section.tsx`, `trust-score-card.tsx`
- Features: `coworker-list.tsx`, `request-reference-form.tsx`, `employer-search-form.tsx`, `public-profile-view.tsx`, `admin-panel.tsx`

## Coworker Matching Logic

### Current Implementation (Phase 1)

1. **Matching Criteria**:
   - Same company name (case-insensitive)
   - Overlapping employment dates
   - Public jobs only

2. **Flow**:
   - User selects a job
   - System finds jobs with matching company and overlapping dates
   - Shows "Potential Coworkers"
   - User manually confirms connections
   - No auto-connection

### Future Extensibility

The matching logic is designed to be extended:

- Can add more sophisticated algorithms
- Can add verification steps
- Can add confidence scores
- Can integrate with external data sources

## Reference System

### Rules

- References are **immutable** once created
- References require confirmed connections
- References are tied to specific jobs
- References are visible to employers only for public jobs
- Admins can soft-delete references (retains audit trail)

### Data Flow

1. User connects with coworker
2. User creates reference for a specific job
3. Reference is stored permanently
4. Trust score is recalculated
5. Employers can view references for public jobs

## Extension Points

### Designed for Future Phases

1. **Trust Score**: Marked as v1, easily replaceable
2. **Matching Logic**: Can be enhanced without schema changes
3. **Reference System**: Can add more fields/verification
4. **Profile Fields**: Schema supports additional fields
5. **Roles**: Easy to add new roles via user_roles table

### Not Implemented (By Design)

- Payments (Stripe integration ready)
- Messaging/chat
- AI scoring
- Background checks
- Third-party integrations (beyond Supabase)

## Performance Considerations

### Database Indexes

- Company name matching (case-insensitive)
- Date range queries
- User lookups
- Connection queries
- Reference queries

### Caching Strategy

- Server components for automatic caching
- Revalidation on mutations
- Trust scores cached in database

## Deployment

### Vercel-Ready

- Environment variables configured
- Next.js 14 App Router optimized
- Server actions for API-less backend
- Static assets optimized

### Database Migrations

- Single SQL file for initial setup
- Can be extended with migration files
- Schema versioning via comments

## Testing Strategy (Future)

The codebase is structured to support:

- Unit tests for server actions
- Integration tests for database operations
- E2E tests for user flows
- RLS policy testing

## Monitoring (Future)

Designed to support:

- Error tracking (Sentry, etc.)
- Performance monitoring
- Database query analysis
- User analytics

## Conclusion

This foundation provides:

✅ **Security**: RLS policies, role-based access, middleware protection  
✅ **Scalability**: Indexed queries, efficient data structures  
✅ **Extensibility**: Clear extension points, replaceable components  
✅ **Maintainability**: TypeScript, clear structure, documented code  
✅ **Production-Ready**: Error handling, validation, audit trails

The architecture supports Phase 1 requirements while being ready for Phase 2+ enhancements without rewrites.

