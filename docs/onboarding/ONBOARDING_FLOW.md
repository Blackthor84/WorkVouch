# PeerCV Onboarding Flow

**Complete Step-by-Step User Journey**

## Overview

The PeerCV onboarding process guides new users through account creation, profile setup, job history entry, coworker matching, and Trust Score building. The flow is designed to be intuitive, mobile-first, and industry-specific.

---

## Step 1: Welcome Screen

### Screen Elements
- **PeerCV Logo**: Centered, animated fade-in
- **Headline**: "Your Work. Verified by the People Who Worked With You."
- **Subheading**: "Build your verified career profile with peer references"
- **CTA Button**: "Get Started Free" (primary blue button)
- **Secondary Link**: "Already have an account? Sign In"

### User Actions
- Click "Get Started Free" → Proceed to Step 2
- Click "Sign In" → Redirect to sign-in page

### Design Notes
- Clean, minimal design
- Blue + grey color scheme
- Mobile-responsive
- Dark mode supported

---

## Step 2: Create Account

### Screen Elements
- **Form Fields**:
  - Full Name (required)
  - Email Address (required)
  - Password (required, min 8 characters)
  - Confirm Password (required)
- **Industry Selector**: Dropdown with options:
  - Law Enforcement
  - Security
  - Hospitality
  - Retail
- **Terms Checkbox**: "I agree to the Terms of Service and Privacy Policy"
- **CTA Button**: "Create Account"
- **Social Login Options**: (Optional) Google, LinkedIn

### Validation
- Email format validation
- Password strength indicator
- Industry selection required
- Terms acceptance required

### User Actions
- Fill form → Click "Create Account" → Proceed to Step 3
- Click "Sign In" link → Redirect to sign-in page

### Post-Action
- Send welcome email
- Create user profile in database
- Set default role to "user"
- Store industry preference

---

## Step 3: Email Verification

### Screen Elements
- **Icon**: Email/envelope icon
- **Headline**: "Verify Your Email"
- **Message**: "We've sent a verification link to [email]. Please check your inbox and click the link to verify your account."
- **Resend Button**: "Resend Verification Email"
- **Skip Link**: "I'll verify later" (optional, allows proceeding)

### User Actions
- Click verification link in email → Proceed to Step 4
- Click "Resend" → New email sent
- Click "Skip" → Proceed to Step 4 (with reminder to verify later)

---

## Step 4: Add First Job

### Screen Elements
- **Progress Indicator**: "Step 1 of 4" (or similar)
- **Headline**: "Let's Add Your First Job"
- **Subheading**: "This helps us match you with coworkers and build your Trust Score"
- **Form Fields**:
  - Job Title (required, text input)
  - Company Name (required, text input with autocomplete)
  - Start Date (required, date picker)
  - End Date (optional if current job, checkbox for "Current Job")
  - Employment Type (dropdown: Full-time, Part-time, Contract, Temporary)
  - Job Description (optional, textarea)
  - Industry-Specific Fields (based on Step 2 selection):
    - Law Enforcement: Badge Number, Department, Certifications
    - Security: License Number, Clearance Level, Patrol Experience
    - Hospitality: Front Desk Experience, Guest Service Rating, Housekeeping Proficiency
    - Retail: POS Experience, Cash Handling, Customer Service Rating
- **CTA Button**: "Add Job"
- **Skip Link**: "I'll add jobs later" (optional)

### User Actions
- Fill form → Click "Add Job" → Proceed to Step 5
- Click "Skip" → Proceed to Step 5 (with reminder to add jobs later)

### Post-Action
- Save job to database
- Trigger coworker matching algorithm
- Display success message

---

## Step 5: Coworker Suggestion Screen

### Screen Elements
- **Headline**: "We Found Potential Coworkers!"
- **Subheading**: "These people also worked at [Company Name]. Send them a verification request."
- **Coworker Cards** (if matches found):
  - Profile Photo (or placeholder)
  - Name
  - Job Title (if available)
  - Overlapping Dates
  - "Request Verification" button
- **Empty State** (if no matches):
  - Message: "No coworkers found yet. Don't worry—you can add more jobs or invite coworkers manually."
  - "Add Another Job" button
  - "Skip for Now" link
- **Progress Indicator**: "Step 2 of 4"

### User Actions
- Click "Request Verification" on coworker cards → Send verification requests → Proceed to Step 6
- Click "Add Another Job" → Return to Step 4
- Click "Skip for Now" → Proceed to Step 6

### Post-Action
- Send verification request notifications to coworkers
- Track pending verifications

---

## Step 6: Send Coworker Invites

### Screen Elements
- **Headline**: "Invite Coworkers to Verify Your Work"
- **Subheading**: "You can also invite coworkers by email if they're not on PeerCV yet"
- **Manual Invite Form**:
  - Email Address input
  - "Send Invite" button
  - List of sent invites (pending, accepted, declined)
- **Progress Indicator**: "Step 3 of 4"
- **CTA Button**: "Continue"

### User Actions
- Enter email → Click "Send Invite" → Invite sent
- Click "Continue" → Proceed to Step 7

### Post-Action
- Send email invite to coworker
- Track invite status

---

## Step 7: Add Additional Jobs

### Screen Elements
- **Headline**: "Add More Jobs to Build Your Profile"
- **Subheading**: "The more verified jobs you add, the higher your Trust Score"
- **Job List**: Display of added jobs (if any)
- **"Add Another Job" Button**: Opens job form (same as Step 4)
- **Progress Indicator**: "Step 4 of 4"
- **CTA Button**: "Continue to Dashboard"
- **Skip Link**: "Skip for Now"

### User Actions
- Click "Add Another Job" → Add job → Return to this screen
- Click "Continue to Dashboard" → Proceed to Step 8
- Click "Skip for Now" → Proceed to Step 8

---

## Step 8: Build Trust Score Overview

### Screen Elements
- **Headline**: "Your Trust Score"
- **Trust Score Display**: Large circular gauge showing current score (0-100)
- **Score Breakdown**:
  - Verified Jobs: X points
  - Peer References: X points
  - Reference Quality: X points
- **Tips Section**: "How to Improve Your Trust Score"
  - Add more verified jobs
  - Request references from coworkers
  - Complete your profile
- **CTA Button**: "View My Profile"
- **Secondary Button**: "Learn More About Trust Scores"

### User Actions
- Click "View My Profile" → Proceed to Step 9
- Click "Learn More" → Open Trust Score help page

---

## Step 9: Profile Completion Checklist

### Screen Elements
- **Headline**: "Complete Your Profile"
- **Checklist Items**:
  - ✅ Email verified
  - ✅ Industry selected
  - ✅ At least one job added
  - ⬜ Profile photo uploaded
  - ⬜ Skills added
  - ⬜ Certifications added (industry-specific)
  - ⬜ At least one coworker verified
  - ⬜ At least one reference received
- **Progress Bar**: Shows completion percentage
- **CTA Button**: "Complete Profile"
- **Skip Link**: "Go to Dashboard"

### User Actions
- Click checklist items → Navigate to relevant sections
- Click "Complete Profile" → Proceed to Step 10
- Click "Go to Dashboard" → Proceed to Step 10

---

## Step 10: Prompt to Upgrade to Pro

### Screen Elements
- **Headline**: "Unlock More Features with PeerCV Pro"
- **Feature Highlights**:
  - 10 coworker requests per job (vs 3 on Starter)
  - AI résumé rewriting
  - ATS optimization
  - Profile analytics
- **Pricing**: "$8.99/month"
- **CTA Button**: "Upgrade to Pro"
- **Secondary Button**: "Maybe Later"

### User Actions
- Click "Upgrade to Pro" → Redirect to pricing page
- Click "Maybe Later" → Proceed to Step 11

### Design Notes
- Non-intrusive, dismissible
- Can be skipped without penalty
- Appears only for Starter tier users

---

## Step 11: Enter Main Dashboard

### Screen Elements
- **Welcome Message**: "Welcome to PeerCV, [Name]!"
- **Quick Stats**:
  - Trust Score
  - Verified Jobs Count
  - Coworker Connections
  - References Received
- **Quick Actions**:
  - "Add Job" button
  - "Request Reference" button
  - "View Profile" button
- **Activity Feed**: Recent notifications and updates
- **Onboarding Complete Badge**: "🎉 You're all set!"

### User Actions
- User can now navigate freely through the app
- Onboarding is complete

### Post-Action
- Mark onboarding as complete in database
- Send completion email
- Track onboarding completion analytics

---

## Mobile Onboarding Flow

### Adaptations for Mobile
- **Swipe Navigation**: Allow swiping between steps
- **Simplified Forms**: Break long forms into multiple screens
- **Touch-Optimized**: Larger buttons and touch targets
- **Progress Indicator**: Always visible at top
- **Back Button**: Allow going back to previous steps

---

## Industry-Specific Customizations

### Law Enforcement
- **Welcome Message**: "Build your verified law enforcement career profile"
- **Job Fields**: Badge number, department, certifications, incident reports
- **Coworker Matching**: Emphasize department and date overlaps

### Security
- **Welcome Message**: "Verify your security industry experience"
- **Job Fields**: License number, clearance level, patrol experience
- **Coworker Matching**: Emphasize company and shift overlaps

### Hospitality
- **Welcome Message**: "Showcase your hospitality experience"
- **Job Fields**: Front desk experience, guest service rating, housekeeping proficiency
- **Coworker Matching**: Emphasize hotel/restaurant and date overlaps

### Retail
- **Welcome Message**: "Build your retail career profile"
- **Job Fields**: POS experience, cash handling, customer service rating, inventory skills
- **Coworker Matching**: Emphasize store location and date overlaps

---

## Error Handling

### Common Errors
- **Email Already Exists**: Show error message, suggest sign-in
- **Weak Password**: Show password strength indicator
- **Invalid Dates**: Show date validation error
- **Network Error**: Show retry option
- **Verification Email Not Received**: Show resend option

---

## Analytics Tracking

### Events to Track
- Onboarding started
- Account created
- Email verified
- First job added
- First coworker matched
- First reference received
- Onboarding completed
- Upgrade prompt shown/clicked
- Steps skipped

---

## A/B Testing Opportunities

- **Welcome Screen**: Test different headlines and CTAs
- **Job Form**: Test single-page vs multi-step form
- **Coworker Matching**: Test immediate vs delayed matching
- **Upgrade Prompt**: Test timing and messaging
- **Progress Indicators**: Test different progress visualization

---

**This onboarding flow is designed to be intuitive, helpful, and conversion-optimized while respecting user time and preferences.**
