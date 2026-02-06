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
    return client_1.default.templateModule.create({
        data: {
            template_id: data.template_id,
            title: data.title,
            slug: data.slug,
            summary: data.summary,
            order_index: data.order,
        },
        include: {
            blocks: true,
        },
    });
};
const getTemplateModuleById = async (id) => {
    return client_1.default.templateModule.findUnique({
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
    return client_1.default.templateModule.update({
        where: { id },
        data: updateData,
        include: {
            blocks: true,
        },
    });
};
const deleteTemplateModule = async (id) => {
    return client_1.default.templateModule.delete({
        where: { id },
    });
};
// Template module blocks
const createTemplateModuleBlock = async (data) => {
    return client_1.default.templateModuleBlock.create({
        data: {
            template_module_id: data.template_module_id,
            type: data.type,
            content: data.content,
            config: data.config,
            order_index: data.order_index,
        },
    });
};
const listTemplateModuleBlocks = async (moduleId) => {
    return client_1.default.templateModuleBlock.findMany({
        where: { template_module_id: moduleId },
        orderBy: { order_index: 'asc' },
    });
};
const deleteTemplateModuleBlock = async (id) => {
    return client_1.default.templateModuleBlock.delete({
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
