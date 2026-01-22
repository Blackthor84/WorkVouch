import { NavbarServer } from "@/components/navbar-server";
import { Card } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Security
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              How we protect your data and keep your information secure
            </p>
          </div>

          <div className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Data Encryption
              </h2>
              <p className="text-grey-medium dark:text-gray-400 leading-relaxed mb-4">
                All data transmitted to and from WorkVouch is encrypted using
                industry-standard TLS (Transport Layer Security) encryption.
                This ensures that your information is protected while in
                transit.
              </p>
              <p className="text-grey-medium dark:text-gray-400 leading-relaxed">
                Sensitive data stored in our databases is encrypted at rest
                using AES-256 encryption, the same standard used by banks and
                financial institutions.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Secure Authentication
              </h2>
              <ul className="space-y-3 text-grey-medium dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Password Security:
                    </strong>{" "}
                    Passwords are hashed using bcrypt, a secure hashing
                    algorithm. We never store plain-text passwords.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Session Management:
                    </strong>{" "}
                    Secure session tokens with automatic expiration and refresh
                    mechanisms.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Email Verification:
                    </strong>{" "}
                    Email addresses must be verified before account activation.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Two-Factor Authentication:
                    </strong>{" "}
                    Available for enhanced account security (coming soon).
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Infrastructure Security
              </h2>
              <div className="space-y-4 text-grey-medium dark:text-gray-400">
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                    Supabase (PostgreSQL Database)
                  </h3>
                  <p>
                    Your data is stored in Supabase, a secure, enterprise-grade
                    database platform with:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Regular security audits and penetration testing</li>
                    <li>Automatic backups and disaster recovery</li>
                    <li>
                      Row-level security (RLS) policies for fine-grained access
                      control
                    </li>
                    <li>Compliance with GDPR, CCPA, and SOC 2 standards</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                    Stripe (Payment Processing)
                  </h3>
                  <p>
                    Payment information is processed securely through Stripe, a
                    PCI-DSS Level 1 certified payment processor. We never store
                    your full payment details on our servers.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Access Controls
              </h2>
              <ul className="space-y-3 text-grey-medium dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Role-Based Access:
                    </strong>{" "}
                    Different user roles (user, employer, admin) have different
                    access levels.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Privacy Controls:
                    </strong>{" "}
                    You control who can see your profile and what information is
                    visible.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Audit Logging:
                    </strong>{" "}
                    All access to sensitive data is logged for security
                    monitoring.
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Security Best Practices
              </h2>
              <div className="space-y-4 text-grey-medium dark:text-gray-400">
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                    Regular Security Audits
                  </h3>
                  <p>
                    We conduct regular security audits and vulnerability
                    assessments to identify and fix potential security issues.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                    Security Monitoring
                  </h3>
                  <p>
                    We monitor our systems 24/7 for suspicious activity,
                    unauthorized access attempts, and potential security
                    threats.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                    Incident Response
                  </h3>
                  <p>
                    We have a documented incident response plan to quickly
                    address and mitigate any security incidents.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                    Employee Training
                  </h3>
                  <p>
                    Our team is trained on security best practices and data
                    protection requirements.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Data Breach Notification
              </h2>
              <p className="text-grey-medium dark:text-gray-400 leading-relaxed">
                In the unlikely event of a data breach, we will notify affected
                users within 72 hours of discovery, in accordance with GDPR and
                CCPA requirements. Notifications will include details about what
                data was compromised and steps we're taking to address the
                issue.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Reporting Security Issues
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                If you discover a security vulnerability, please report it to us
                immediately at:
              </p>
              <p className="text-primary font-semibold">
                security@workvouch.com
              </p>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-4">
                Please include as much detail as possible about the
                vulnerability. We appreciate responsible disclosure and will
                work with you to address any security issues.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Your Role in Security
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                Security is a shared responsibility. Here's how you can help
                keep your account secure:
              </p>
              <ul className="space-y-2 text-grey-medium dark:text-gray-400">
                <li>• Use a strong, unique password</li>
                <li>• Don't share your account credentials with anyone</li>
                <li>• Enable two-factor authentication when available</li>
                <li>• Keep your email address up to date</li>
                <li>• Report suspicious activity immediately</li>
                <li>• Log out when using shared devices</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
