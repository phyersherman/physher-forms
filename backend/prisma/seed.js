const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Only allow seeding in development
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seeding is disabled in production to protect data.')
    console.error('   To reset your database, use: npx prisma migrate reset --skip-seed')
    process.exit(1)
  }

  console.log('Seeding database (development mode)...')
  console.log('⚠️  Existing tenant/course/user data will be cleared.')
  console.log('✓ Email configurations will be preserved.')

  // Preserve email configurations before cleanup
  const emailConfigs = await prisma.emailConfig.findMany()
  
  // Clean existing data (safe for dev) - BUT PRESERVE EMAIL CONFIG
  await prisma.quizAttempt.deleteMany()
  await prisma.moduleCompletion.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.block.deleteMany()
  await prisma.module.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.course.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.magicCode.deleteMany()
  await prisma.user.deleteMany()
  await prisma.domain.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.courseTemplate.deleteMany()
  await prisma.quizWidget.deleteMany()
  // NOTE: EmailConfig is NOT deleted, so existing configs are preserved

  console.log('Database cleaned. All test data removed.')
  console.log('✓ Email configurations preserved.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
