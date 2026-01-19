import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  industry: z.string().optional(),
  type: z.enum(['user', 'employer']),
  companyName: z.string().optional(), // Required if type is employer
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = signupSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    const existingEmployer = await prisma.employerAccount.findUnique({
      where: { email: data.email },
    })

    if (existingUser || existingEmployer) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(data.password)

    if (data.type === 'user') {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          industry: data.industry,
        },
      })

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
    } else {
      if (!data.companyName) {
        return NextResponse.json(
          { error: 'Company name is required for employer accounts' },
          { status: 400 }
        )
      }

      const employer = await prisma.employerAccount.create({
        data: {
          companyName: data.companyName,
          email: data.email,
          passwordHash,
        },
      })

      return NextResponse.json({
        success: true,
        employer: {
          id: employer.id,
          email: employer.email,
          companyName: employer.companyName,
        },
      })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
