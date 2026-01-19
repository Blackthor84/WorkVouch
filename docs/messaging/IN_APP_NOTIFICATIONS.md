# PeerCV In-App Notifications

**Complete In-App Notification System**

## Notification Types

### 1. New Reference

**Title**: "New Reference Received"
**Message**: "[Coworker Name] wrote you a reference"
**Action**: "View Reference" → Navigate to references page
**Icon**: Star/Checkmark
**Priority**: High
**Sound**: Default notification sound

**Display**:
- Toast notification (bottom-right, 5 seconds)
- Notification bell badge (red dot with count)
- Notification center entry

---

### 2. Coworker Matched

**Title**: "Potential Coworker Found"
**Message**: "We found [X] people who worked at [Company Name]"
**Action**: "View Matches" → Navigate to coworker matches page
**Icon**: Users/People
**Priority**: Medium
**Sound**: None

**Display**:
- Toast notification
- Notification center entry

---

### 3. Employer Viewed Profile

**Title**: "Profile Viewed"
**Message**: "[Company Name] viewed your profile"
**Action**: "View Profile" → Navigate to profile page
**Icon**: Eye/View
**Priority**: Medium
**Sound**: None

**Display**:
- Toast notification
- Notification center entry

---

### 4. Trust Score Milestone

**Title**: "Trust Score Milestone!"
**Message**: "Congratulations! Your Trust Score reached [Score]/100"
**Action**: "View Score" → Navigate to dashboard
**Icon**: Trophy/Award
**Priority**: High
**Sound**: Success sound

**Display**:
- Toast notification (longer display, 8 seconds)
- Notification center entry
- Optional: Modal celebration (for major milestones like 50, 75, 100)

---

### 5. Profile Completion Reminder

**Title**: "Complete Your Profile"
**Message**: "You're [X]% complete. Add [Missing Item] to boost your Trust Score"
**Action**: "Complete Profile" → Navigate to profile edit page
**Icon**: Checklist
**Priority**: Low
**Sound**: None

**Display**:
- Toast notification (dismissible)
- Notification center entry

---

### 6. Verification Request Accepted

**Title**: "Verification Accepted"
**Message**: "[Coworker Name] confirmed you worked together at [Company]"
**Action**: "View Job" → Navigate to job details
**Icon**: Checkmark
**Priority**: Medium
**Sound**: None

**Display**:
- Toast notification
- Notification center entry

---

### 7. Verification Request Denied

**Title**: "Verification Denied"
**Message**: "[Coworker Name] couldn't confirm your work at [Company]"
**Action**: "Review Job" → Navigate to job edit page
**Icon**: X/Warning
**Priority**: High
**Sound**: Alert sound

**Display**:
- Toast notification (red/warning style)
- Notification center entry

---

### 8. Reference Request Received

**Title**: "Reference Request"
**Message**: "[Name] requested a reference from you"
**Action**: "Write Reference" → Navigate to reference form
**Icon**: Pen/Edit
**Priority**: Medium
**Sound**: None

**Display**:
- Toast notification
- Notification center entry

---

### 9. Subscription Upgrade Available

**Title**: "Unlock More Features"
**Message**: "Upgrade to Pro for 10 coworker requests per job"
**Action**: "View Plans" → Navigate to pricing page
**Icon**: Star/Upgrade
**Priority**: Low
**Sound**: None

**Display**:
- Toast notification (dismissible, can be snoozed)
- Notification center entry

---

### 10. Payment Failed

**Title**: "Payment Issue"
**Message**: "Your subscription payment failed. Update your payment method"
**Action**: "Update Payment" → Navigate to billing page
**Icon**: Credit Card/Warning
**Priority**: High
**Sound**: Alert sound

**Display**:
- Toast notification (red/warning style)
- Notification center entry
- Persistent banner (until resolved)

---

## Notification Center Design

### Layout
- **Header**: "Notifications" with "Mark All Read" button
- **Filters**: All, Unread, References, Verifications, System
- **List**: Chronological order (newest first)
- **Empty State**: "No notifications" message

### Notification Item
- **Avatar/Icon**: Sender avatar or notification type icon
- **Title**: Bold, 16px
- **Message**: Regular, 14px, grey text
- **Timestamp**: "2 hours ago", "Yesterday", etc.
- **Action Button**: Contextual (e.g., "View", "Respond")
- **Unread Indicator**: Blue dot on left
- **Swipe Actions**: Mark as read, Delete

### Interaction
- **Tap**: Navigate to related page/action
- **Swipe Left**: Delete notification
- **Swipe Right**: Mark as read
- **Long Press**: Show options (Mark as read, Delete, Mute)

---

## Notification Settings

### User Preferences
- **Enable/Disable**: Toggle notifications on/off
- **Types**: Enable/disable specific notification types
- **Sounds**: Enable/disable notification sounds
- **Badge**: Show/hide notification count badge
- **Email**: Receive email copies of notifications
- **SMS**: Receive SMS for important notifications (opt-in)

### Notification Frequency
- **Real-time**: Receive notifications immediately
- **Digest**: Receive daily/weekly digest
- **Quiet Hours**: Disable notifications during specified hours

---

## Notification Bell Component

### Design
- **Icon**: Bell icon in navbar
- **Badge**: Red dot with unread count (if > 0)
- **Dropdown**: Click to open notification center
- **Animation**: Pulse when new notification arrives

### Behavior
- **Click**: Open notification dropdown
- **Outside Click**: Close dropdown
- **Badge**: Updates in real-time
- **Empty State**: "No new notifications"

---

## Push Notifications (Mobile)

### Setup
- Request permission on first app launch
- Explain benefits of push notifications
- Allow users to enable/disable

### Types
- Same as in-app notifications
- Delivered via device push service
- Deep linking to relevant app screens

### Best Practices
- Don't send too many notifications
- Make notifications actionable
- Personalize when possible
- Respect user preferences

---

## Notification Analytics

### Metrics to Track
- Notification delivery rate
- Notification open rate
- Action completion rate
- Notification dismissal rate
- User engagement by notification type

### A/B Testing
- Test notification copy
- Test notification timing
- Test notification frequency
- Test notification design

---

**All notifications are designed to be helpful, non-intrusive, and actionable.**
