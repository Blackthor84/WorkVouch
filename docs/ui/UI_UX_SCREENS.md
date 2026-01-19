# PeerCV UI/UX Screens Documentation

**Complete Screen Inventory and Specifications**

## User Side Screens

### 1. Account Creation

**Route**: `/auth/signup`

**Elements**:
- PeerCV logo
- "Create Your Account" headline
- Form fields: Name, Email, Password, Confirm Password
- Industry selector dropdown
- Terms of Service checkbox
- "Create Account" button (primary)
- "Already have an account? Sign In" link
- Social login options (Google, LinkedIn) - optional

**Validation**:
- Real-time email format validation
- Password strength indicator
- Password match validation
- Industry selection required

**Design**:
- Clean, centered form
- Blue primary button
- Mobile-responsive
- Dark mode supported

---

### 2. Add Job

**Route**: `/dashboard/jobs/add`

**Elements**:
- "Add Job" headline
- Form fields:
  - Job Title (required)
  - Company Name (required, autocomplete)
  - Start Date (date picker)
  - End Date (date picker, optional if current)
  - "Current Job" checkbox
  - Employment Type (dropdown)
  - Job Description (textarea, optional)
  - Industry-specific fields (based on user's industry)
- "Save Job" button (primary)
- "Cancel" button (secondary)

**Industry-Specific Fields**:
- **Law Enforcement**: Badge Number, Department, Certifications
- **Security**: License Number, Clearance Level, Patrol Experience
- **Hospitality**: Front Desk Experience, Guest Service Rating
- **Retail**: POS Experience, Cash Handling, Customer Service Rating

**Design**:
- Single-page form or multi-step wizard
- Auto-save draft
- Mobile-optimized date pickers

---

### 3. Add Coworker

**Route**: `/dashboard/coworkers/add`

**Elements**:
- "Request Coworker Verification" headline
- Search/autocomplete for existing PeerCV users
- Manual invite form (email input)
- List of pending verification requests
- "Send Request" button
- "Cancel" button

**Design**:
- Search-first interface
- Real-time user search
- Pending requests list with status

---

### 4. Trust Score Dashboard

**Route**: `/dashboard`

**Elements**:
- Trust Score circular gauge (large, prominent)
- Score breakdown:
  - Verified Jobs: X points
  - Peer References: X points
  - Reference Quality: X points
- Quick stats cards:
  - Verified Jobs Count
  - Coworker Connections
  - References Received
- Quick actions:
  - "Add Job" button
  - "Request Reference" button
  - "View Profile" button
- Activity feed (recent notifications)
- Onboarding progress (if incomplete)

**Design**:
- Dashboard layout with cards
- Trust Score as focal point
- Color-coded score ranges (0-30: red, 31-60: yellow, 61-100: green)

---

### 5. Profile Page

**Route**: `/profile`

**Elements**:
- Profile header:
  - Profile photo (upload/edit)
  - Name
  - Industry badge
  - Trust Score
- Job History section:
  - List of jobs (company, title, dates)
  - Verification status for each job
  - "Add Job" button
  - "Edit" buttons for each job
- Skills section:
  - Skills list
  - "Add Skill" button
- Certifications section (industry-specific):
  - Certifications list
  - "Add Certification" button
- Peer References section:
  - List of references received
  - Reference previews
  - "View All" button
- "Edit Profile" button (floating or top-right)

**Design**:
- Scrollable single-page layout
- Sections with clear dividers
- Edit buttons for each section

---

### 6. References Page

**Route**: `/dashboard/references`

**Elements**:
- "Peer References" headline
- Tabs: "Received" | "Given" | "Pending"
- References list:
  - Reference card:
    - Author name and photo
    - Company/job context
    - Reference preview
    - Rating (if applicable)
    - "View Full" button
- "Request Reference" button (floating)
- Empty state: "No references yet. Request one to get started."

**Design**:
- Card-based layout
- Filterable/sortable list
- Mobile-friendly cards

---

### 7. Settings

**Route**: `/settings`

**Elements**:
- "Account Settings" headline
- Sections:
  - **Profile**: Edit name, email, industry
  - **Security**: Change password, two-factor auth
  - **Notifications**: Email, SMS, in-app preferences
  - **Privacy**: Profile visibility, data sharing
  - **Subscription**: Current plan, upgrade/downgrade, billing
  - **Data**: Export data, delete account
- "Save" buttons for each section

**Design**:
- Tabbed or accordion layout
- Clear section dividers
- Destructive actions (delete account) in red

---

### 8. Notifications

**Route**: `/notifications`

**Elements**:
- "Notifications" headline
- Filters: All | Unread | References | Verifications
- Notification list:
  - Notification item:
    - Icon/avatar
    - Title and message
    - Timestamp
    - Action button
    - Unread indicator
- "Mark All Read" button
- Empty state: "No notifications"

**Design**:
- List layout with clear hierarchy
- Swipe actions (mark read, delete)
- Real-time updates

---

### 9. Subscription Management

**Route**: `/settings/subscription`

**Elements**:
- Current subscription card:
  - Tier name
  - Status (Active, Cancelled, etc.)
  - Renewal date
  - Features included
- "Manage Subscription" button (opens Stripe portal)
- "Upgrade" or "Downgrade" buttons
- Usage stats (if applicable)
- Billing history

**Design**:
- Card-based layout
- Clear pricing display
- Stripe portal integration

---

## Employer Side Screens

### 10. Employer Login

**Route**: `/employer/login`

**Elements**:
- PeerCV logo
- "Employer Login" headline
- Form fields: Email, Password
- "Sign In" button (primary)
- "Forgot Password?" link
- "Not an employer? Sign in as user" link

**Design**:
- Similar to user login but employer-branded
- Clear employer vs user distinction

---

### 11. Employer Dashboard

**Route**: `/employer/dashboard`

**Elements**:
- Header:
  - Company name
  - Subscription badge (Lite, Pro, Enterprise)
- Sidebar navigation:
  - Dashboard
  - Search Candidates
  - Job Posts
  - Messages
  - Billing
  - Settings
- Main content:
  - Quick stats:
    - Active job posts
    - Candidates viewed this month
    - Lookups remaining
    - Messages unread
  - Recent activity feed
  - Quick actions:
    - "Post a Job" button
    - "Search Candidates" button

**Design**:
- Sidebar + main content layout
- Dashboard-style with cards and stats

---

### 12. Search Candidates

**Route**: `/employer/candidates`

**Elements**:
- Search bar (prominent)
- Filters:
  - Industry
  - Job Title
  - Experience Level
  - Trust Score Range
  - Location
  - Certifications
- Candidate list:
  - Candidate card:
    - Photo
    - Name
    - Trust Score
    - Industry
    - Key skills
    - "View Profile" button
- Pagination or infinite scroll
- "Save Candidate" buttons

**Design**:
- Filter sidebar + results list
- Card-based candidate display
- Mobile-responsive filters

---

### 13. View Candidate Profile (Employer)

**Route**: `/employer/candidates/[id]`

**Elements**:
- Candidate header:
  - Photo
  - Name
  - Trust Score (prominent)
  - Industry
- Verified Work History:
  - Job list with verification badges
  - Company, title, dates
  - Coworker verification status
- Peer References:
  - References list
  - Reference previews
  - "View Full" buttons
- Skills and Certifications
- Actions:
  - "Message Candidate" button
  - "Save Candidate" button
  - "Download Report" button (if subscription allows)

**Design**:
- Full-page profile view
- Clear sections
- Action buttons prominent

---

### 14. Job Post Manager

**Route**: `/employer/job-posts`

**Elements**:
- "Job Posts" headline
- Tabs: "Active" | "Draft" | "Closed"
- "Create Job Post" button (floating or top-right)
- Job posts list:
  - Job card:
    - Title
    - Company
    - Status (Published, Draft, Archived)
    - Applicants count
    - Created date
    - Actions: Edit, View Applicants, Close/Open
- Empty state: "No job posts yet. Create one to get started."

**Design**:
- Card-based layout
- Status badges
- Quick actions

---

### 15. Create/Edit Job Post

**Route**: `/employer/job-posts/new` or `/employer/job-posts/[id]/edit`

**Elements**:
- "Create Job Post" or "Edit Job Post" headline
- Form fields:
  - Job Title (required)
  - Company (pre-filled from company profile)
  - Description (rich text editor)
  - Location
  - Pay Range (min/max)
  - Shift (dropdown: Day, Night, Morning, Evening, Flexible)
  - Requirements (textarea)
  - Industry (dropdown)
  - Status (Draft, Published, Archived)
- "Save Draft" button
- "Publish" button (primary)
- "Cancel" button

**Design**:
- Full-page form
- Rich text editor for description
- Auto-save draft

---

### 16. Employer Messages

**Route**: `/employer/messages`

**Elements**:
- "Messages" headline
- Conversation list (sidebar or top):
  - Conversation item:
    - Candidate name/photo
    - Last message preview
    - Timestamp
    - Unread indicator
- Message thread (main area):
  - Message bubbles
  - Input field
  - "Send" button
- Empty state: "No messages yet"

**Design**:
- Split view (list + thread) or single view
- Chat-style interface
- Real-time updates

---

### 17. Employer Billing

**Route**: `/employer/billing`

**Elements**:
- Current subscription card:
  - Plan name (Lite, Pro, Enterprise)
  - Status
  - Renewal date
  - Monthly cost
  - Lookups used/remaining
- "Manage Subscription" button (Stripe portal)
- "Upgrade" or "Change Plan" buttons
- Billing history table
- Usage statistics

**Design**:
- Card-based layout
- Clear pricing and usage display

---

### 18. Employer Settings

**Route**: `/employer/settings`

**Elements**:
- "Company Settings" headline
- Company Profile section:
  - Company name
  - Industry
  - Website
  - Description
  - Logo upload
  - Contact email
- Team Management section (if applicable):
  - Team members list
  - Invite team member button
- Notification preferences
- "Save" buttons

**Design**:
- Tabbed or accordion layout
- Form-based sections

---

## Design System

### Colors
- **Primary Blue**: #0A84FF
- **Accent Blue**: #3B82F6
- **Dark Grey**: #1F2937
- **Light Grey**: #9CA3AF
- **Background**: #F3F4F6 (light), #0D1117 (dark)
- **Card Background**: #FFFFFF (light), #1A1F2B (dark)

### Typography
- **Headings**: Inter, 24-32px, bold
- **Body**: Inter, 16px, regular
- **Small Text**: Inter, 14px, regular

### Components
- **Buttons**: Rounded-xl, padding, shadow
- **Cards**: Rounded-2xl, shadow-md, padding
- **Inputs**: Rounded-lg, border, focus states
- **Badges**: Rounded-full, small padding

### Spacing
- **Section Padding**: 24px
- **Card Padding**: 16-24px
- **Button Padding**: 12px 24px
- **Grid Gap**: 16-24px

---

**All screens are mobile-responsive, dark mode compatible, and follow the PeerCV design system.**
