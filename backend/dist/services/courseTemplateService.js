"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
// Get the Templates tenant (created during seed with is_template=true)
const getTemplatesTenant = async () => {
    return client_1.default.tenant.findFirst({
        where: { is_template: true }
    });
};
const createTemplate = async (data) => {
    const templatesTenant = await getTemplatesTenant();
    if (!templatesTenant)
        throw new Error('Templates tenant not found');
    return client_1.default.course.create({
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
    });
};
const listTemplates = async () => {
    const templatesTenant = await getTemplatesTenant();
    if (!templatesTenant)
        return [];
    return client_1.default.course.findMany({
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
    });
};
const getTemplateById = async (id) => {
    const templatesTenant = await getTemplatesTenant();
    if (!templatesTenant)
        return null;
    return client_1.default.course.findFirst({
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
    });
};
const updateTemplate = async (id, data) => {
    const templatesTenant = await getTemplatesTenant();
    if (!templatesTenant)
        throw new Error('Templates tenant not found');
    return client_1.default.course.update({
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
    });
};
const deleteTemplate = async (id) => {
    const templatesTenant = await getTemplatesTenant();
    if (!templatesTenant)
        throw new Error('Templates tenant not found');
    return client_1.default.course.delete({
        where: { id }
    });
};
// Template module operations
const createTemplateModule = async (data) => {
    // Templates are stored as Courses with is_template=true
    // We need to get or create a default chapter first
    const course = await client_1.default.course.findUnique({
        where: { id: data.template_id },
        include: { chapters: true }
    });
    if (!course)
        throw new Error('Template not found');
    // Get or create default chapter
    let chapter;
    if (course.chapters && course.chapters.length > 0) {
        chapter = course.chapters[0];
    }
    else {
        chapter = await client_1.default.chapter.create({
            data: {
                course_id: data.template_id,
                title: 'Default Chapter',
                order_index: 0,
            }
        });
    }
    // Create module under the chapter
    return client_1.default.module.create({
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
    });
};
const getTemplateModuleById = async (id) => {
    return client_1.default.module.findUnique({
        where: { id },
        include: {
            blocks: true,
        },
    });
};
const updateTemplateModule = async (id, data) => {
    const updateData = {};
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.slug !== undefined)
        updateData.slug = data.slug;
    if (data.summary !== undefined)
        updateData.summary = data.summary;
    if (data.order !== undefined)
        updateData.order_index = data.order;
    return client_1.default.module.update({
        where: { id },
        data: updateData,
        include: {
            blocks: true,
        },
    });
};
const deleteTemplateModule = async (id) => {
    return client_1.default.module.delete({
        where: { id },
    });
};
// Template module blocks (using regular Block model)
const createTemplateModuleBlock = async (data) => {
    return client_1.default.block.create({
        data: {
            module_id: data.template_module_id,
            type: data.type,
            content: data.content,
            config: data.config,
            order_index: data.order_index,
        },
    });
};
const listTemplateModuleBlocks = async (moduleId) => {
    return client_1.default.block.findMany({
        where: { module_id: moduleId },
        orderBy: { order_index: 'asc' },
    });
};
const deleteTemplateModuleBlock = async (id) => {
    return client_1.default.block.delete({
        where: { id },
    });
};
exports.default = {
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
};
