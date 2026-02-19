const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Delete all data to start fresh
    await prisma.quizAttempt.deleteMany();
    await prisma.moduleCompletion.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.block.deleteMany();
    await prisma.module.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.domain.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.courseTemplate.deleteMany();
    await prisma.quizWidget.deleteMany();
    console.log('Database cleared');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
