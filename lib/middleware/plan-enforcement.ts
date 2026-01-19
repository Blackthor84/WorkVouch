import { prisma } from '../prisma'
import { PlanTier } from '@prisma/client'

export async function checkEmployerPlan(employerId: string): Promise<{
  hasAccess: boolean
  planTier: PlanTier
  message?: string
}> {
  const employer = await prisma.employerAccount.findUnique({
    where: { id: employerId },
    select: { planTier: true },
  })

  if (!employer) {
    return {
      hasAccess: false,
      planTier: 'free',
      message: 'Employer account not found',
    }
  }

  if (employer.planTier === 'free') {
    return {
      hasAccess: false,
      planTier: 'free',
      message: 'This feature requires a paid plan. Please upgrade to Basic or Pro.',
    }
  }

  return {
    hasAccess: true,
    planTier: employer.planTier,
  }
}

export async function canFileDispute(employerId: string): Promise<boolean> {
  const { hasAccess, planTier } = await checkEmployerPlan(employerId)
  return hasAccess && planTier === 'pro'
}

export async function canViewEmployees(employerId: string): Promise<boolean> {
  const { hasAccess } = await checkEmployerPlan(employerId)
  return hasAccess
}

export async function canRequestVerification(employerId: string): Promise<boolean> {
  const { hasAccess } = await checkEmployerPlan(employerId)
  return hasAccess
}
