/**
 * Payment Gating Middleware
 * 
 * Checks if employer has sufficient subscription tier for a feature.
 * Workers are never gated.
 */

import { getPlanFeatures } from "@/lib/stripePlans";
import { shouldBypassPaywall } from "@/lib/beta-tester";

export interface PaywallCheck {
  allowed: boolean;
  reason?: string;
  requiredTier?: string;
  currentTier?: string;
}

/**
 * Check if employer can access a feature
 */
export async function checkPaywall(
  userType: "employee" | "employer",
  subscriptionTier: string | null,
  requiredFeature: string,
  userEmail?: string | null,
  userRole?: string | string[]
): Promise<PaywallCheck> {
  // Workers are never gated
  if (userType === "employee") {
    return { allowed: true };
  }

  // Beta testers bypass paywall
  if (shouldBypassPaywall(userEmail, userRole)) {
    return { allowed: true };
  }

  // No subscription = not allowed (except for free tier features)
  if (!subscriptionTier || subscriptionTier === "free") {
    return {
      allowed: false,
      reason: "Subscription required",
      requiredTier: "starter",
      currentTier: subscriptionTier || "none",
    };
  }

  // Check feature requirements
  const planFeatures = getPlanFeatures(subscriptionTier);
  
  // Map features to tier requirements
  const featureTierMap: Record<string, string[]> = {
    "basic_search": ["starter", "team", "pro", "security-bundle"],
    "advanced_analytics": ["team", "pro", "security-bundle"],
    "unlimited_messaging": ["team", "pro", "security-bundle"],
    "bulk_import": ["pro"],
    "department_subaccounts": ["pro"],
    "security_features": ["security-bundle"],
  };

  const allowedTiers = featureTierMap[requiredFeature] || [];
  const isAllowed = allowedTiers.includes(subscriptionTier);

  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Feature requires ${allowedTiers[0]} tier or higher`,
      requiredTier: allowedTiers[0],
      currentTier: subscriptionTier,
    };
  }

  return { allowed: true };
}
