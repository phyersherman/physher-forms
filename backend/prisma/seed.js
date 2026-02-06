const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // clean existing data (safe for dev)
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

  // Create admin tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      defaultLocale: 'en',
      primaryColor: '#0ea5a4',
      secondaryColor: '#64748b',
      logoUrl: '',
      domains: {
        create: [{ host: 'acme.local', isPrimary: true }]
      },
      users: {
        create: [{ email: 'admin@acme.local', fullName: 'Acme Admin', role: 'admin', password: bcrypt.hashSync('adminpass', 10) }]
      }
    },
    include: { domains: true, users: true }
  })

  // Create templates tenant
  const templatesTenant = await prisma.tenant.create({
    data: {
      name: 'Templates',
      is_template: true,
      defaultLocale: 'en',
      primaryColor: '#667eea',
      secondaryColor: '#64748b',
      logoUrl: ''
    }
  })

  // Create a global course (no tenant_id)
  const globalCourse = await prisma.course.create({
    data: {
      title: 'Welcome Course',
      description: 'Introductory course template',
      tenant_id: null  // null = global course
    }
  })

  // Create chapter for global course
  const globalChapter = await prisma.chapter.create({
    data: {
      course_id: globalCourse.id,
      title: 'Getting Started',
      order_index: 0,
      tenant_id: null  // Global chapters don't have tenant_id
    }
  })

  // Create module for global course
  const globalModule = await prisma.module.create({
    data: {
      chapter_id: globalChapter.id,
      title: 'Welcome',
      summary: 'Introduction to the course',
      order_index: 0,
      tenant_id: null  // Global modules don't have tenant_id
    }
  })

  // Create block for global course
  const globalBlock = await prisma.block.create({
    data: {
      module_id: globalModule.id,
      type: 'text',
      content: '<h1>Welcome to the Course!</h1><p>This is your first lesson.</p>',
      order_index: 0,
      tenant_id: null  // Global blocks don't have tenant_id
    }
  })

  // Now create a tenant-specific copy of the global course
  const tenantCourse = await prisma.course.create({
    data: {
      title: globalCourse.title,
      description: globalCourse.description,
      tenant_id: tenant.id,
      global_course_id: globalCourse.id  // Link to the global course
    }
  })

  // Copy chapter to tenant course
  const tenantChapter = await prisma.chapter.create({
    data: {
      course_id: tenantCourse.id,
      title: globalChapter.title,
      order_index: globalChapter.order_index,
      tenant_id: tenant.id,
      assessment_title: globalChapter.assessment_title || undefined,
      assessment_required: globalChapter.assessment_required || false,
      prerequisite_chapter_ids: globalChapter.prerequisite_chapter_ids || []
    }
  })

  // Copy module to tenant chapter
  const tenantModule = await prisma.module.create({
    data: {
      chapter_id: tenantChapter.id,
      title: globalModule.title,
      summary: globalModule.summary,
      order_index: globalModule.order_index,
      tenant_id: tenant.id
    }
  })

  // Copy block to tenant module
  await prisma.block.create({
    data: {
      module_id: tenantModule.id,
      type: globalBlock.type,
      content: globalBlock.content,
      order_index: globalBlock.order_index,
      tenant_id: tenant.id
    }
  })

  const user = tenant.users[0]

  await prisma.enrollment.create({
    data: {
      tenantId: tenant.id,
      courseId: tenantCourse.id,
      userId: user.id
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
