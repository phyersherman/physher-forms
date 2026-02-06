"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
const createCourse = async (data) => {
    return client_1.default.course.create({ data: { title: data.title, description: data.description || null, tenant_id: data.tenant_id || null } });
};
const listGlobalCourses = async () => {
    return client_1.default.course.findMany({ where: { tenant_id: null }, include: { chapters: { include: { modules: { include: { blocks: true } } } } } });
};
const listByTenant = async (tenant_id) => {
    return client_1.default.course.findMany({ where: { tenant_id }, include: { chapters: { include: { modules: { include: { blocks: true } } } } } });
};
const getById = async (id) => {
    return client_1.default.course.findUnique({ where: { id }, include: { chapters: { include: { modules: { include: { blocks: true } } } } } });
};
const updateCourse = async (id, data) => {
    return client_1.default.course.update({ where: { id }, data });
};
const deleteCourse = async (id) => {
    return client_1.default.course.delete({ where: { id } });
};
const assignCourseToTenant = async (globalCourseId, tenantId, overrideTitle) => {
    // Get the global course with all its structure
    const globalCourse = await client_1.default.course.findUnique({
        where: { id: globalCourseId },
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
    if (!globalCourse)
        throw new Error('Global course not found');
    if (globalCourse.tenant_id !== null)
        throw new Error('Course is not a global course');
    // Check if already assigned
    const existing = await client_1.default.course.findFirst({
        where: {
            global_course_id: globalCourseId,
            tenant_id: tenantId
        }
    });
    if (existing)
        throw new Error('Course already assigned to this tenant');
    // Create new tenant-specific course
    const newCourse = await client_1.default.course.create({
        data: {
            title: overrideTitle || globalCourse.title,
            description: globalCourse.description,
            tenant_id: tenantId,
            global_course_id: globalCourseId
        }
    });
    // Copy chapters and their content
    for (const chapter of globalCourse.chapters) {
        const newChapter = await client_1.default.chapter.create({
            data: {
                course_id: newCourse.id,
                title: chapter.title,
                order_index: chapter.order_index,
                tenant_id: tenantId,
                assessment_title: chapter.assessment_title || undefined,
                assessment_required: chapter.assessment_required || false,
                prerequisite_chapter_ids: chapter.prerequisite_chapter_ids || []
            }
        });
        // Copy modules in each chapter
        for (const module of chapter.modules) {
            const newModule = await client_1.default.module.create({
                data: {
                    chapter_id: newChapter.id,
                    title: module.title,
                    slug: module.slug,
                    summary: module.summary,
                    order_index: module.order_index,
                    required: module.required,
                    prerequisite_module_ids: module.prerequisite_module_ids,
                    requires_quiz_pass_to_continue: module.requires_quiz_pass_to_continue,
                    tenant_id: tenantId
                }
            });
            // Copy blocks in each module
            for (const block of module.blocks) {
                await client_1.default.block.create({
                    data: {
                        module_id: newModule.id,
                        type: block.type,
                        content: block.content,
                        config: block.config,
                        order_index: block.order_index,
                        tenant_id: tenantId
                    }
                });
            }
        }
    }
    // Return the complete new course
    return getById(newCourse.id);
};
const copyFromTemplate = async (templateId, data) => {
    // Get the template course with all its structure
    const template = await client_1.default.course.findUnique({
        where: { id: templateId },
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
    if (!template)
        throw new Error('Template not found');
    // Create new course in the target tenant
    const newCourse = await client_1.default.course.create({
        data: {
            title: data.title,
            description: data.description || null,
            tenant_id: data.tenant_id
        }
    });
    // Copy chapters and their content
    for (const chapter of template.chapters) {
        const newChapter = await client_1.default.chapter.create({
            data: {
                course_id: newCourse.id,
                title: chapter.title,
                order_index: chapter.order_index,
                tenant_id: data.tenant_id,
                assessment_title: chapter.assessment_title || undefined,
                assessment_required: chapter.assessment_required || false,
                prerequisite_chapter_ids: chapter.prerequisite_chapter_ids || []
            }
        });
        // Copy modules in each chapter
        for (const module of chapter.modules) {
            const newModule = await client_1.default.module.create({
                data: {
                    chapter_id: newChapter.id,
                    title: module.title,
                    slug: module.slug,
                    summary: module.summary,
                    order_index: module.order_index,
                    required: module.required,
                    prerequisite_module_ids: module.prerequisite_module_ids,
                    requires_quiz_pass_to_continue: module.requires_quiz_pass_to_continue,
                    tenant_id: data.tenant_id
                }
            });
            // Copy blocks in each module
            for (const block of module.blocks) {
                await client_1.default.block.create({
                    data: {
                        module_id: newModule.id,
                        type: block.type,
                        content: block.content,
                        config: block.config,
                        order_index: block.order_index,
                        tenant_id: data.tenant_id
                    }
                });
            }
        }
    }
    // Return the complete new course
    return getById(newCourse.id);
};
const createModule = async (data) => {
    return client_1.default.module.create({
        data: {
            chapter_id: data.chapter_id,
            title: data.title,
            slug: data.slug,
            summary: data.summary,
            order_index: data.order_index || 0,
            required: data.required !== undefined ? data.required : true,
            prerequisite_module_ids: data.prerequisite_module_ids || [],
            requires_quiz_pass_to_continue: data.requires_quiz_pass_to_continue || false,
            tenant_id: data.tenant_id || null,
        }
    });
};
const updateModule = async (id, data) => {
    return client_1.default.module.update({
        where: { id },
        data: {
            title: data.title,
            slug: data.slug,
            summary: data.summary,
            order_index: data.order_index,
            required: data.required,
            prerequisite_module_ids: data.prerequisite_module_ids,
            requires_quiz_pass_to_continue: data.requires_quiz_pass_to_continue,
        }
    });
};
const getModuleById = async (id) => {
    return client_1.default.module.findUnique({ where: { id }, include: { blocks: true } });
};
const deleteModule = async (id) => {
    // Delete all blocks associated with this module first
    await client_1.default.block.deleteMany({ where: { module_id: id } });
    // Then delete the module
    return client_1.default.module.delete({ where: { id } });
};
// Chapter functions
const createChapter = async (data) => {
    return client_1.default.chapter.create({
        data: {
            course_id: data.course_id,
            title: data.title,
            order_index: data.order_index || 0,
            tenant_id: data.tenant_id || null,
        }
    });
};
const getChapterById = async (id) => {
    return client_1.default.chapter.findUnique({ where: { id }, include: { modules: { include: { blocks: true } } } });
};
const updateChapter = async (id, data) => {
    return client_1.default.chapter.update({ where: { id }, data });
};
const deleteChapter = async (id) => {
    return client_1.default.chapter.delete({ where: { id } });
};
// Block functions
const createBlock = async (data) => {
    return client_1.default.block.create({
        data: {
            module_id: data.module_id,
            type: data.type,
            content: data.content,
            config: data.config,
            order_index: data.order_index || 0,
            tenant_id: data.tenant_id || null,
        }
    });
};
const updateBlock = async (id, data) => {
    return client_1.default.block.update({ where: { id }, data });
};
const deleteBlock = async (id) => {
    return client_1.default.block.delete({ where: { id } });
};
const listBlocksByModule = async (module_id) => {
    return client_1.default.block.findMany({
        where: { module_id },
        orderBy: { order_index: 'asc' }
    });
};
const reorderBlocks = async (moduleId, blocks) => {
    const updates = blocks.map(block => client_1.default.block.update({
        where: { id: block.id },
        data: { order_index: block.order_index },
    }));
    return Promise.all(updates);
};
exports.default = {
    createCourse,
    listGlobalCourses,
    listByTenant,
    getById,
    updateCourse,
    deleteCourse,
    assignCourseToTenant,
    copyFromTemplate,
    createModule,
    getModuleById,
    updateModule,
    deleteModule,
    createChapter,
    getChapterById,
    updateChapter,
    deleteChapter,
    createBlock,
    updateBlock,
    deleteBlock,
    listBlocksByModule,
    reorderBlocks
};
