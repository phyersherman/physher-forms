const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper to create random quiz attempts
function createRandomAttempts(count, minScore = 50, maxScore = 100) {
  const attempts = []
  for (let i = 0; i < count; i++) {
    const score = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore
    attempts.push({
      score,
      passed: score >= 70
    })
  }
  return attempts
}

async function main() {
  console.log('Seeding database...')

  // clean existing data (safe for dev)
  await prisma.quizAttempt.deleteMany()
  await prisma.moduleCompletion.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.block.deleteMany()
  await prisma.module.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.course.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.domain.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.courseTemplate.deleteMany()
  await prisma.quizWidget.deleteMany()

  const bcrypt = require('bcryptjs')

  // Create three tenants with their own courses and users
  const tenants = []
  const tenantConfigs = [
    {
      name: 'Acme Corp',
      host: 'acme.local',
      primaryColor: '#0ea5a4',
      secondaryColor: '#64748b',
      users: 16,
      attemptsPerUser: 10
    },
    {
      name: 'Tech Plus',
      host: 'techplus.local',
      primaryColor: '#667eea',
      secondaryColor: '#f59e0b',
      users: 17,
      attemptsPerUser: 10
    },
    {
      name: 'Global Academy',
      host: 'academy.local',
      primaryColor: '#10b981',
      secondaryColor: '#ef4444',
      users: 17,
      attemptsPerUser: 10
    }
  ]

  for (const config of tenantConfigs) {
    console.log(`Creating tenant: ${config.name}`)

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: config.name,
        defaultLocale: 'en',
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        logoUrl: '',
        domains: {
          create: [{ host: config.host, isPrimary: true }]
        }
      },
      include: { domains: true }
    })

    // Create users for this tenant
    const users = []
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: `admin@${config.host}`,
        fullName: `${config.name} Admin`,
        role: 'admin',
        password: bcrypt.hashSync('adminpass', 10),
        tenantId: tenant.id
      }
    })
    users.push(adminUser)
    
    // Create learner users
    for (let i = 0; i < config.users - 1; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user${i + 1}@${config.host}`,
          fullName: `User ${i + 1}`,
          role: 'learner',
          password: bcrypt.hashSync('password123', 10),
          tenantId: tenant.id
        }
      })
      users.push(user)
    }

    // Create 2 courses with analytics data
    const courses = []
    for (let courseIdx = 0; courseIdx < 2; courseIdx++) {
      const course = await prisma.course.create({
        data: {
          title: `${config.name} Course ${courseIdx + 1}`,
          description: `A comprehensive course about ${courseIdx === 0 ? 'Fundamentals' : 'Advanced Topics'}`,
          tenant_id: tenant.id
        }
      })
      courses.push(course)

      // Enroll all users in this course ONCE (before creating quiz blocks)
      for (let userIdx = 0; userIdx < users.length; userIdx++) {
        const user = users[userIdx]
        try {
          await prisma.enrollment.create({
            data: {
              tenantId: tenant.id,
              courseId: course.id,
              userId: user.id
            }
          })
        } catch (e) {
          // Enrollment already exists, ignore
        }
      }

      // Create chapter for course
      const chapter = await prisma.chapter.create({
        data: {
          course_id: course.id,
          title: `Chapter 1: Introduction`,
          order_index: 0,
          tenant_id: tenant.id
        }
      })

      // Create module for chapter
      const module = await prisma.module.create({
        data: {
          chapter_id: chapter.id,
          title: `Module 1: Overview`,
          summary: 'Learn the basics',
          order_index: 0,
          tenant_id: tenant.id
        }
      })

      // Create 2 quiz blocks per course
      for (let quizIdx = 0; quizIdx < 2; quizIdx++) {
        const quizBlock = await prisma.block.create({
          data: {
            module_id: module.id,
            type: 'quiz',
            config: JSON.stringify({
              title: `Quiz ${quizIdx + 1}`,
              timeLimitMinutes: 30,
              questions: [
                { id: 'q1', text: 'Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: Math.floor(Math.random() * 4) },
                { id: 'q2', text: 'Question 2', options: ['Option 1', 'Option 2', 'Option 3'], correctAnswer: Math.floor(Math.random() * 3) }
              ]
            }),
            content: JSON.stringify({ title: `Quiz ${quizIdx + 1}` }),
            order_index: quizIdx,
            tenant_id: tenant.id
          }
        })

        // Create quiz attempts for each user
        const attemptsPerUser = config.attemptsPerUser
        for (let userIdx = 0; userIdx < users.length; userIdx++) {
          const user = users[userIdx]

          // Create quiz attempts for this user
          const attempts = createRandomAttempts(attemptsPerUser)
          for (let i = 0; i < attempts.length; i++) {
            await prisma.quizAttempt.create({
              data: {
                blockId: quizBlock.id,
                userId: user.id,
                courseId: course.id,
                tenantId: tenant.id,
                score: attempts[i].score,
                passed: attempts[i].passed,
                answers: JSON.stringify({ q1: 'A', q2: 'Option 1' }),
                submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            })
          }
        }
      }
    }

    tenants.push(tenant)
  }

  console.log('Seeding finished.')
  console.log(`Created ${tenants.length} tenants with courses and quiz analytics`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
