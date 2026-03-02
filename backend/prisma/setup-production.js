/**
 * Production Setup Script
 * Creates the initial global admin user for first-time deployment
 * Run with: node prisma/setup-production.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('\n===========================================')
  console.log('   LMS Production Setup Wizard')
  console.log('===========================================\n')
  
  // Check if global admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'admin',
      tenantId: null
    }
  })
  
  if (existingAdmin) {
    console.log('⚠️  A global admin user already exists!')
    console.log(`   Email: ${existingAdmin.email}`)
    console.log(`   Created: ${existingAdmin.createdAt}\n`)
    
    const overwrite = await question('Do you want to create another admin? (yes/no): ')
    if (overwrite.toLowerCase() !== 'yes') {
      console.log('\nSetup cancelled. Existing admin preserved.')
      rl.close()
      return
    }
    console.log('')
  }
  
  // Collect admin details
  console.log('Creating global administrator account...\n')
  
  const email = await question('Admin email address: ')
  if (!email || !email.includes('@')) {
    console.error('\n❌ Invalid email address')
    rl.close()
    process.exit(1)
  }
  
  const fullName = await question('Admin full name: ')
  if (!fullName || fullName.trim().length < 2) {
    console.error('\n❌ Name must be at least 2 characters')
    rl.close()
    process.exit(1)
  }
  
  // Password with confirmation
  let password, passwordConfirm
  while (true) {
    password = await question('Admin password (min 8 characters): ')
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters. Try again.\n')
      continue
    }
    
    passwordConfirm = await question('Confirm password: ')
    if (password !== passwordConfirm) {
      console.log('❌ Passwords do not match. Try again.\n')
      continue
    }
    
    break
  }
  
  console.log('\n-------------------------------------------')
  console.log('Creating admin user...')
  
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    })
    
    if (existingUser) {
      console.error(`\n❌ User with email ${email} already exists!`)
      rl.close()
      process.exit(1)
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create global admin user
    const admin = await prisma.user.create({
      data: {
        email,
        fullName: fullName.trim(),
        password: hashedPassword,
        role: 'admin',
        tenantId: null, // Global admin
        status: 'active',
        authMethod: 'password'
      }
    })
    
    console.log('\n✅ Setup complete!\n')
    console.log('===========================================')
    console.log('   Global Admin Created')
    console.log('===========================================')
    console.log(`Email:    ${admin.email}`)
    console.log(`Name:     ${admin.fullName}`)
    console.log(`Role:     ${admin.role} (global)`)
    console.log(`ID:       ${admin.id}`)
    console.log(`Created:  ${admin.createdAt}`)
    console.log('===========================================\n')
    console.log('You can now log in at: https://your-domain.com/login\n')
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:')
    console.error(error.message)
    rl.close()
    process.exit(1)
  }
  
  rl.close()
}

main()
  .catch(e => {
    console.error('\n❌ Setup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
