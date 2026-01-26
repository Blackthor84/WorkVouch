/**
 * WorkVouch Stripe Pricing Plans Configuration
 * 
 * This file contains all pricing plan definitions for Stripe integration.
 * Use this to create products and prices in Stripe Dashboard or via API.
 */

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "usd";
  interval: "month" | "one_time";
  metadata: {
    tier: string;
    category: "employee" | "employer" | "security";
    features: string;
    searchesPerMonth?: number;
    reportsPerMonth?: number;
  };
}

// Employee Plans - WorkVouch is always free for employees
export const employeePlans: StripePlan[] = [
  {
    id: "free",
    name: "Free",
    description: "WorkVouch is always free for workers. Build your verified profile, boost your career, and connect with employers — no hidden fees, no subscriptions, forever free.",
    price: 0,
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "free",
      category: "employee",
      features: "unlimited_jobs,unlimited_references,verified_profile,discoverable,all_features",
    },
  },
];

// Employer Plans
export const employerPlans: StripePlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses and startups",
    price: 49,
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "starter",
      category: "employer",
      features: "basic_trust_scores,export_pdf,coworker_contact",
      searchesPerMonth: 15,
      reportsPerMonth: 10,
    },
  },
  {
    id: "team",
    name: "Team",
    description: "Ideal for growing teams and HR departments",
    price: 149,
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "team",
      category: "employer",
      features:
        "advanced_analytics,unlimited_messaging,tracking_dashboard,priority_support",
      searchesPerMonth: 50,
      reportsPerMonth: 40,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For established companies with high hiring volume",
    price: 299,
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "pro",
      category: "employer",
      features:
        "department_subaccounts,bulk_import,role_permissions,comparison_tools",
      searchesPerMonth: 150,
      reportsPerMonth: 120,
    },
  },
  {
    id: "pay_per_use",
    name: "Pay-Per-Use",
    description: "Pay only for what you need, when you need it",
    price: 14.99,
    currency: "usd",
    interval: "one_time",
    metadata: {
      tier: "pay_per_use",
      category: "employer",
      features:
        "job_history,peer_verification,trust_breakdown,reliability_insights,export_pdf,peer_contact",
    },
  },
  {
    id: "security_bundle",
    name: "Security Agency Bundle",
    description: "Specialized package for security agencies",
    price: 199,
    currency: "usd",
    interval: "month",
    metadata: {
      tier: "security",
      category: "security",
      features:
        "license_verification,certificate_tracking,shift_tools,auto_flag,availability_tools",
      searchesPerMonth: -1, // Unlimited
      reportsPerMonth: 80,
    },
  },
];

// Stripe API script to create all plans
export const createStripePlansScript = `
/**
 * Run this script to create all WorkVouch pricing plans in Stripe
 * 
 * Usage:
 * 1. Set your Stripe secret key: export STRIPE_SECRET_KEY=sk_test_...
 * 2. Run: node scripts/create-stripe-plans.js
 * 
 * Or use Stripe CLI: stripe products create --name="Pro Worker" ...
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPlans() {
  const plans = ${JSON.stringify([...employeePlans, ...employerPlans], null, 2)};

  for (const plan of plans) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: plan.metadata,
      });

      // Create price
      if (plan.interval === 'one_time') {
        await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100), // Convert to cents
          currency: plan.currency,
        });
      } else {
        await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100),
          currency: plan.currency,
          recurring: {
            interval: plan.interval,
          },
        });
      }

      console.log(\`✅ Created plan: \${plan.name}\`);
    } catch (error) {
      console.error(\`❌ Error creating \${plan.name}:\`, error.message);
    }
  }
}

createPlans();
`;

export const allPlans = [...employeePlans, ...employerPlans];
