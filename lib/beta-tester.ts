/**
 * Beta Tester Mode
 * 
 * Allows beta testers to bypass subscription paywalls.
 * Controlled by ALLOW_BETA_TESTER environment variable.
 */

const ALLOW_BETA_TESTER = process.env.ALLOW_BETA_TESTER === "true";

// Beta tester emails (add your beta testers here)
const betaTesters = [
  "nicoleanneaglin@gmail.com",
  // Add more beta tester emails here
];

/**
 * Check if email is a beta tester
 */
export function isBetaTester(email: string | null | undefined): boolean {
  if (!ALLOW_BETA_TESTER || !email) {
    return false;
  }
  return betaTesters.includes(email.toLowerCase().trim());
}

/**
 * Check if beta tester mode is enabled
 */
export function isBetaModeEnabled(): boolean {
  return ALLOW_BETA_TESTER;
}

/**
 * Check if user should bypass paywall
 */
export function shouldBypassPaywall(
  email: string | null | undefined,
  userRole?: string | string[]
): boolean {
  // Check if user has beta role
  const hasBetaRole = 
    userRole === "beta" || 
    (Array.isArray(userRole) && userRole.includes("beta"));
  
  // Check if email is in beta tester list
  const isBetaEmail = isBetaTester(email);
  
  return ALLOW_BETA_TESTER && (hasBetaRole || isBetaEmail);
}
