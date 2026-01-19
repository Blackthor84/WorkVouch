import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  try {
    console.log('=== Create WorkVouch Superadmin ===\n')

    const email = await question('Email: ')
    if (!email || !email.includes('@')) {
      console.error('Invalid email address')
      process.exit(1)
    }

    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    })

    if (existing) {
      console.error(`Admin with email ${email} already exists`)
      process.exit(1)
    }

    const password = await question('Password: ')
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters')
      process.exit(1)
    }

    const confirmPassword = await question('Confirm Password: ')
    if (password !== confirmPassword) {
      console.error('Passwords do not match')
      process.exit(1)
    }

    const passwordHash = await hash(password, 12)

    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        role: 'superadmin',
      },
    })

    console.log(`\n✅ Superadmin created successfully!`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   ID: ${admin.id}\n`)
  } catch (error) {
    console.error('Error creating superadmin:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
