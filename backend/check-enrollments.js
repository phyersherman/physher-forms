const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const acmeId = 'cmljnoc0s0000m6iamnl3lzal';
    const courseIds = await prisma.course.findMany({
      where: { tenant_id: acmeId },
      select: { id: true, title: true }
    });
    
    console.log('Acme courses:', courseIds.length);
    
    for (const course of courseIds) {
      const enrollmentCount = await prisma.enrollment.count({
        where: { courseId: course.id, tenantId: acmeId }
      });
      const uniqueUsers = await prisma.enrollment.findMany({
        where: { courseId: course.id, tenantId: acmeId },
        select: { userId: true },
        distinct: ['userId']
      });
      console.log(`${course.title}: ${enrollmentCount} total enrollments, ${uniqueUsers.length} unique users`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
