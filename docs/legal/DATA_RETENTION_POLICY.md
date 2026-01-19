# PeerCV Data Retention Policy

**Last Updated: January 2025**

## 1. Overview

This policy outlines how long PeerCV retains different types of data and the processes for data deletion and account purging.

## 2. Data Types and Retention Periods

### 2.1 Account Information
- **Active Accounts**: Retained indefinitely while account is active
- **Inactive Accounts**: Retained for 12 months after last login, then marked for deletion
- **Deleted Accounts**: Most data removed within 30 days, some retained up to 90 days for security

### 2.2 Profile Information
- **Job History**: Retained while account is active, deleted upon account deletion
- **Skills and Certifications**: Retained while account is active, deleted upon account deletion
- **Profile Photos**: Retained while account is active, deleted within 30 days of account deletion
- **Industry Information**: Retained while account is active, deleted upon account deletion

### 2.3 Peer References
- **References You Receive**: Retained while account is active, deleted upon account deletion
- **References You Write**: 
  - Visible to recipients while your account is active
  - Anonymized (author name removed) upon account deletion
  - Content may remain visible to recipients for up to 1 year after your account deletion
  - Recipients may request earlier deletion of references you wrote

### 2.4 Trust Score Data
- **Current Trust Score**: Retained while account is active, deleted upon account deletion
- **Trust Score History**: 
  - Retained while account is active
  - Deleted upon account deletion
  - Aggregated, anonymized data may be retained for analytics (no personal identifiers)

### 2.5 Coworker Connections
- **Connection Requests**: Retained while account is active, deleted upon account deletion
- **Verified Connections**: Retained while account is active, deleted upon account deletion
- **Connection History**: Retained for up to 90 days after account deletion for dispute resolution

### 2.6 Messages
- **Direct Messages**: Retained while account is active, deleted within 30 days of account deletion
- **Message Metadata**: Retained for up to 90 days after account deletion for security purposes

### 2.7 Payment and Subscription Data
- **Stripe Customer ID**: Retained while account is active, retained for 7 years for tax/accounting compliance
- **Subscription Records**: Retained for 7 years for tax/accounting compliance
- **Payment Transaction Data**: Retained for 7 years for tax/accounting compliance (stored by Stripe, not PeerCV)

### 2.8 Authentication Data
- **Email Address**: Retained while account is active, deleted within 90 days of account deletion
- **Password Hashes**: Deleted immediately upon account deletion
- **Session Tokens**: Expire automatically, deleted within 30 days of account deletion
- **Login History**: Retained for up to 90 days after account deletion for security purposes

### 2.9 Logs and Analytics
- **Server Logs**: Retained for 90 days, then automatically purged
- **Error Logs**: Retained for 90 days, then automatically purged
- **Access Logs**: Retained for 90 days, then automatically purged
- **Analytics Data**: Aggregated, anonymized data retained indefinitely (no personal identifiers)

### 2.10 Employer-Specific Data
- **Company Profiles**: Retained while account is active, deleted within 30 days of account deletion
- **Job Postings**: Retained while account is active, deleted within 30 days of account deletion
- **Candidate Lookups**: Retained for 1 year for audit purposes, then deleted
- **Saved Candidates**: Retained while account is active, deleted within 30 days of account deletion

## 3. Account Deletion Process

### 3.1 User-Initiated Deletion
1. User requests account deletion through account settings
2. Confirmation email sent to verify deletion request
3. User confirms deletion
4. Account marked for deletion
5. Most data deleted within 30 days
6. Remaining data (for security/legal purposes) deleted within 90 days

### 3.2 Automatic Deletion (Inactive Accounts)
1. Account inactive for 12 months (no login)
2. Email notification sent to user
3. Account marked for deletion if no response within 30 days
4. Deletion process follows same timeline as user-initiated deletion

### 3.3 Immediate Deletion (Violations)
1. Account terminated for Terms of Service violations
2. Immediate suspension of account access
3. Data deletion follows same timeline (30-90 days)
4. Some data may be retained longer for legal/security purposes

## 4. Data Deletion Methods

### 4.1 Secure Deletion
- Data is permanently deleted from production databases
- Data is removed from backup systems within 90 days
- Deleted data cannot be recovered

### 4.2 Anonymization
- Some data may be anonymized instead of deleted
- Anonymized data has all personal identifiers removed
- Anonymized data may be retained for analytics

### 4.3 Third-Party Services
- Data stored with third-party services (Stripe, email providers) is subject to their retention policies
- PeerCV will request deletion from third parties when possible
- Some third-party data may be retained per their policies

## 5. Legal and Security Exceptions

### 5.1 Legal Holds
- Data may be retained longer if subject to legal hold
- Legal holds may be issued for ongoing litigation or investigations
- Data subject to legal hold will not be deleted until hold is released

### 5.2 Security Incidents
- Data related to security incidents may be retained longer for investigation
- Security-related data may be retained for up to 2 years
- Data may be shared with law enforcement if required by law

### 5.3 Dispute Resolution
- Data related to active disputes may be retained until resolution
- Dispute-related data may be retained for up to 1 year after resolution

## 6. Backup and Recovery

### 6.1 Backup Retention
- Database backups are retained for 30 days
- Backups are automatically purged after 30 days
- Backups may contain deleted account data until purged

### 6.2 Recovery Windows
- Account recovery is possible within 30 days of deletion request
- After 30 days, account recovery is not possible
- Data cannot be recovered after secure deletion

## 7. User Rights

### 7.1 Right to Deletion
- Users may request account deletion at any time
- Deletion requests will be processed within 30 days
- Users will receive confirmation of deletion

### 7.2 Right to Data Export
- Users may request a copy of their data before deletion
- Data export requests will be processed within 30 days
- Exported data will be provided in a portable format (JSON)

### 7.3 Right to Correction
- Users may request correction of inaccurate data
- Correction requests will be processed within 30 days
- Users will receive confirmation of corrections

## 8. Notification of Deletion

### 8.1 User Notification
- Users will receive email confirmation when deletion is complete
- Users will be notified of any data retained for legal/security purposes
- Users will be informed of third-party data retention

### 8.2 Third-Party Notification
- Third parties (employers, coworkers) may be notified if relevant
- References may be anonymized when author's account is deleted
- Recipients of references will be notified if references are removed

## 9. Compliance

### 9.1 GDPR Compliance
- Data retention complies with GDPR requirements
- Users have the right to request deletion
- Deletion requests will be processed within 30 days (or as required by law)

### 9.2 CCPA Compliance
- Data retention complies with CCPA requirements
- California users have the right to request deletion
- Deletion requests will be processed within 45 days (or as required by law)

## 10. Contact

For questions about data retention or deletion:
- **Email**: privacy@peercv.com
- **Support**: support@peercv.com

---

**This policy is subject to change. Users will be notified of material changes.**
