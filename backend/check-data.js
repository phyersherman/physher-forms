const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  const tenants = await db.tenant.findMany({ select: { id: true, name: true } });
  for (const tenant of tenants) {
    const userCount = await db.user.count({ where: { tenantId: tenant.id } });
    const courseCount = await db.course.count({ where: { tenant_id: tenant.id } });
    const enrollmentCount = await db.enrollment.count({ where: { tenantId: tenant.id } });
    console.log(`${tenant.name}: ${userCount} users, ${courseCount} courses, ${enrollmentCount} enrollments`);
    
    const courses = await db.course.findMany({
      where: { tenant_id: tenant.id },
      select: { id: true, title: true }
    });
    
    for (const course of courses) {
      const enrolled = await db.enrollment.count({ where: { courseId: course.id, tenantId: tenant.id } });
      console.log(`  - ${course.title}: ${enrolled} enrolled`);
    }
  }
  process.exit(0);
})();
