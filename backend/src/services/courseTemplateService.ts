import prisma from '../db/client'

// Get the Templates tenant (created during seed with is_template=true)
const getTemplatesTenant = async () => {
  return prisma.tenant.findFirst({
    where: { is_template: true }
  })
}

const createTemplate = async (data: { title: string; description?: string }) => {
  const templatesTenant = await getTemplatesTenant()
  if (!templatesTenant) throw new Error('Templates tenant not found')
  
  return prisma.course.create({
    data: {
      title: data.title,
      description: data.description || null,
      tenant_id: templatesTenant.id
    },
    include: {
      chapters: {
        include: {
          modules: {
            include: {
              blocks: true
            }
          }
        }
      }
    }
  })
}

const listTemplates = async () => {
  const templatesTenant = await getTemplatesTenant()
  if (!templatesTenant) return []
  
  return prisma.course.findMany({
    where: { tenant_id: templatesTenant.id },
    include: {
      chapters: {
        include: {
          modules: {
            include: {
              blocks: true
            }
          }
        }
      }
    }
  })
}

const getTemplateById = async (id: string) => {
  const templatesTenant = await getTemplatesTenant()
  if (!templatesTenant) return null
  
  return prisma.course.findFirst({
    where: {
      id,
      tenant_id: templatesTenant.id
    },
    include: {
      chapters: {
        include: {
          modules: {
            include: {
              blocks: true
            }
          }
        }
      }
    }
  })
}

const updateTemplate = async (id: string, data: { title?: string; description?: string }) => {
  const templatesTenant = await getTemplatesTenant()
  if (!templatesTenant) throw new Error('Templates tenant not found')
  
  return prisma.course.update({
    where: { id },
    data,
    include: {
      chapters: {
        include: {
          modules: {
            include: {
              blocks: true
            }
          }
        }
      }
    }
  })
}

const deleteTemplate = async (id: string) => {
  const templatesTenant = await getTemplatesTenant()
  if (!templatesTenant) throw new Error('Templates tenant not found')
  
  return prisma.course.delete({
    where: { id }
  })
}

// Template module operations
const createTemplateModule = async (data: {
  template_id: string
  title: string
  slug: string
  summary: string | null
  order: number
}) => {
  // Templates are stored as Courses with is_template=true
  // We need to get or create a default chapter first
  const course = await prisma.course.findUnique({
    where: { id: data.template_id },
    include: { chapters: true }
  })
  
  if (!course) throw new Error('Template not found')
  
  // Get or create default chapter
  let chapter
  if (course.chapters && course.chapters.length > 0) {
    chapter = course.chapters[0]
  } else {
    chapter = await prisma.chapter.create({
      data: {
        course_id: data.template_id,
        title: 'Default Chapter',
        order_index: 0,
      }
    })
  }
  
  // Create module under the chapter
  return prisma.module.create({
    data: {
      chapter_id: chapter.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      order_index: data.order,
      tenant_id: course.tenant_id || undefined,
    },
    include: {
      blocks: true,
    },
  })
}

const getTemplateModuleById = async (id: string) => {
  return prisma.module.findUnique({
    where: { id },
    include: {
      blocks: true,
    },
  })
}

const updateTemplateModule = async (id: string, data: Partial<{
  title: string
  slug: string
  summary: string | null
  order: number
}>) => {
  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.summary !== undefined) updateData.summary = data.summary
  if (data.order !== undefined) updateData.order_index = data.order

  return prisma.module.update({
    where: { id },
    data: updateData,
    include: {
      blocks: true,
    },
  })
}

const deleteTemplateModule = async (id: string) => {
  return prisma.module.delete({
    where: { id },
  })
}

// Template module blocks (using regular Block model)
const createTemplateModuleBlock = async (data: {
  template_module_id: string
  type: string
  content: string
  config: string
  order_index: number
}) => {
  return prisma.block.create({
    data: {
      module_id: data.template_module_id,
      type: data.type,
      content: data.content,
      config: data.config,
      order_index: data.order_index,
    },
  })
}

const listTemplateModuleBlocks = async (moduleId: string) => {
  return prisma.block.findMany({
    where: { module_id: moduleId },
    orderBy: { order_index: 'asc' },
  })
}

const deleteTemplateModuleBlock = async (id: string) => {
  return prisma.block.delete({
    where: { id },
  })
}

export default { 
  createTemplate, 
  listTemplates, 
  getTemplateById, 
  updateTemplate, 
  deleteTemplate,
  createTemplateModule,
  getTemplateModuleById,
  updateTemplateModule,
  deleteTemplateModule,
  createTemplateModuleBlock,
  listTemplateModuleBlocks,
  deleteTemplateModuleBlock,
}