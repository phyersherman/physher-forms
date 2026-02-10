"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
const createCourse = async (data) => {
    const course = await client_1.default.course.create({
        data: {
            title: data.title,
            description: data.description || null,
            tenant_id: data.tenant_id || null
        }
    });
    // Create chapters if provided
    if (data.chapters && data.chapters.length > 0) {
        for (const chapter of data.chapters) {
            const createdChapter = await client_1.default.chapter.create({
                data: {
                    title: chapter.title,
                    course_id: course.id,
                    order_index: chapter.order_index || 0
                }
            });
            // Create modules if provided
            if (chapter.modules && chapter.modules.length > 0) {
                for (const module of chapter.modules) {
                    const createdModule = await client_1.default.module.create({
                        data: {
                            title: module.title,
                            slug: module.slug || module.title.toLowerCase().replace(/\s+/g, '-'),
                            summary: module.summary || '',
                            chapter_id: createdChapter.id,
                            order_index: module.order_index || 0
                        }
                    });
                    // Create blocks if provided
                    if (module.blocks && module.blocks.length > 0) {
                        for (const block of module.blocks) {
                            await client_1.default.block.create({
                                data: {
                                    type: block.type,
                                    content: block.content || '',
                                    config: block.config || '{}',
                                    module_id: createdModule.id,
                                    order_index: block.order_index || 0
                                }
                            });
                        }
                    }
                }
            }
        }
    }
    // Return full course with chapters
    return client_1.default.course.findUnique({
        where: { id: course.id },
        include: { chapters: { include: { modules: { include: { blocks: true } } } } }
    });
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
    // Update course basic info
    const course = await client_1.default.course.update({
        where: { id },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description })
        }
    });
    // If chapters provided, sync them with existing chapters
    if (data.chapters !== undefined) {
        const existingChapters = await client_1.default.chapter.findMany({ where: { course_id: id } });
        const existingChapterIds = new Set(existingChapters.map(c => c.id));
        const incomingChapterIds = new Set(data.chapters.filter(c => c.id).map(c => c.id));
        // Delete chapters not in incoming data
        const chaptersToDelete = existingChapters.filter(c => !incomingChapterIds.has(c.id));
        for (const ch of chaptersToDelete) {
            await client_1.default.chapter.delete({ where: { id: ch.id } });
        }
        // Upsert chapters
        for (const chapter of data.chapters) {
            let chapterId;
            if (chapter.id && existingChapterIds.has(chapter.id)) {
                // Update existing chapter
                await client_1.default.chapter.update({
                    where: { id: chapter.id },
                    data: {
                        title: chapter.title,
                        order_index: chapter.order_index || 0
                    }
                });
                chapterId = chapter.id;
            }
            else {
                // Create new chapter
                const created = await client_1.default.chapter.create({
                    data: {
                        title: chapter.title,
                        course_id: id,
                        order_index: chapter.order_index || 0
                    }
                });
                chapterId = created.id;
            }
            // Handle modules
            if (chapter.modules && chapter.modules.length > 0) {
                const existingModules = await client_1.default.module.findMany({ where: { chapter_id: chapterId } });
                const existingModuleIds = new Set(existingModules.map((m) => m.id));
                const incomingModuleIds = new Set(chapter.modules.filter((m) => m.id).map((m) => m.id));
                // Delete modules not in incoming data
                const modulesToDelete = existingModules.filter(m => !incomingModuleIds.has(m.id));
                for (const mod of modulesToDelete) {
                    await client_1.default.module.delete({ where: { id: mod.id } });
                }
                // Upsert modules
                for (const module of chapter.modules) {
                    let moduleId;
                    if (module.id && existingModuleIds.has(module.id)) {
                        // Update existing module
                        await client_1.default.module.update({
                            where: { id: module.id },
                            data: {
                                title: module.title,
                                slug: module.slug || module.title.toLowerCase().replace(/\s+/g, '-'),
                                summary: module.summary || '',
                                order_index: module.order_index || 0
                            }
                        });
                        moduleId = module.id;
                    }
                    else {
                        // Create new module
                        const created = await client_1.default.module.create({
                            data: {
                                title: module.title,
                                slug: module.slug || module.title.toLowerCase().replace(/\s+/g, '-'),
                                summary: module.summary || '',
                                chapter_id: chapterId,
                                order_index: module.order_index || 0
                            }
                        });
                        moduleId = created.id;
                    }
                    // Handle blocks
                    if (module.blocks && module.blocks.length > 0) {
                        const existingBlocks = await client_1.default.block.findMany({ where: { module_id: moduleId } });
                        const existingBlockIds = new Set(existingBlocks.map((b) => b.id));
                        const incomingBlockIds = new Set(module.blocks.filter((b) => b.id).map((b) => b.id));
                        // Delete blocks not in incoming data
                        const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.has(b.id));
                        for (const blk of blocksToDelete) {
                            await client_1.default.block.delete({ where: { id: blk.id } });
                        }
                        // Upsert blocks
                        for (const block of module.blocks) {
                            if (block.id && existingBlockIds.has(block.id)) {
                                // Update existing block
                                await client_1.default.block.update({
                                    where: { id: block.id },
                                    data: {
                                        type: block.type,
                                        content: block.content || '',
                                        config: block.config || '{}',
                                        order_index: block.order_index || 0
                                    }
                                });
                            }
                            else {
                                // Create new block
                                await client_1.default.block.create({
                                    data: {
                                        type: block.type,
                                        content: block.content || '',
                                        config: block.config || '{}',
                                        module_id: moduleId,
                                        order_index: block.order_index || 0
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    // Return updated course with chapters
    return client_1.default.course.findUnique({
        where: { id },
        include: { chapters: { include: { modules: { include: { blocks: true } } } } }
    });
};
const deleteCourse = async (id) => {
    return client_1.default.course.delete({ where: { id } });
};
const assignCourseToTenant = async (globalCourseId, tenantId, overrideTitle) => {
    try {
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
        console.log(`[assignCourseToTenant] Starting copy of course ${globalCourseId} to tenant ${tenantId}`);
        // Create new tenant-specific course
        const newCourse = await client_1.default.course.create({
            data: {
                title: overrideTitle || globalCourse.title,
                description: globalCourse.description,
                tenant_id: tenantId,
                global_course_id: globalCourseId
            }
        });
        console.log(`[assignCourseToTenant] Created new course ${newCourse.id}`);
        // Map old module IDs to new module IDs during copying
        const moduleIdMap = new Map();
        const chapterIdMap = new Map();
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
                    prerequisite_chapter_ids: [] // Will update after all chapters are created
                }
            });
            chapterIdMap.set(chapter.id, newChapter.id);
            // Copy modules in each chapter (first pass: create modules without prerequisites)
            for (const module of chapter.modules) {
                const newModule = await client_1.default.module.create({
                    data: {
                        chapter_id: newChapter.id,
                        title: module.title,
                        slug: module.slug,
                        summary: module.summary,
                        order_index: module.order_index,
                        required: module.required,
                        prerequisite_module_ids: [], // Will update after all modules are created
                        requires_quiz_pass_to_continue: module.requires_quiz_pass_to_continue,
                        tenant_id: tenantId
                    }
                });
                moduleIdMap.set(module.id, newModule.id);
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
        console.log(`[assignCourseToTenant] Created ${chapterIdMap.size} chapters and ${moduleIdMap.size} modules`);
        // Second pass: update prerequisites using the ID mappings
        for (const chapter of globalCourse.chapters) {
            const newChapterId = chapterIdMap.get(chapter.id);
            if (!newChapterId)
                continue;
            // Update chapter prerequisites - only include prerequisite chapters that exist in the copy
            if (chapter.prerequisite_chapter_ids?.length) {
                const remappedChapterPrereqs = chapter.prerequisite_chapter_ids
                    .map(id => chapterIdMap.get(id))
                    .filter((id) => !!id);
                if (remappedChapterPrereqs.length > 0) {
                    console.log(`[assignCourseToTenant] Updating chapter ${newChapterId} prerequisites: ${remappedChapterPrereqs}`);
                    await client_1.default.chapter.update({
                        where: { id: newChapterId },
                        data: { prerequisite_chapter_ids: remappedChapterPrereqs }
                    });
                }
            }
            // Update module prerequisites
            for (const module of chapter.modules) {
                const newModuleId = moduleIdMap.get(module.id);
                if (newModuleId && module.prerequisite_module_ids?.length) {
                    // Only include prerequisites that exist in the copied modules
                    const remappedModulePrereqs = module.prerequisite_module_ids
                        .map(id => moduleIdMap.get(id))
                        .filter((id) => !!id);
                    if (remappedModulePrereqs.length > 0) {
                        console.log(`[assignCourseToTenant] Updating module ${newModuleId} prerequisites: ${remappedModulePrereqs}`);
                        await client_1.default.module.update({
                            where: { id: newModuleId },
                            data: { prerequisite_module_ids: remappedModulePrereqs }
                        });
                    }
                }
            }
        }
        console.log(`[assignCourseToTenant] Successfully completed course copy`);
        // Return the complete new course
        return getById(newCourse.id);
    }
    catch (error) {
        console.error(`[assignCourseToTenant] Error:`, error);
        throw error;
    }
};
const copyFromTemplate = async (templateId, data) => {
    try {
        console.log(`[copyFromTemplate] Starting copy of template ${templateId} to tenant ${data.tenant_id}`);
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
        console.log(`[copyFromTemplate] Created new course ${newCourse.id}`);
        // Map old module IDs to new module IDs during copying
        const moduleIdMap = new Map();
        const chapterIdMap = new Map();
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
                    prerequisite_chapter_ids: [] // Will update after all chapters are created
                }
            });
            chapterIdMap.set(chapter.id, newChapter.id);
            // Copy modules in each chapter (first pass: create modules without prerequisites)
            for (const module of chapter.modules) {
                const newModule = await client_1.default.module.create({
                    data: {
                        chapter_id: newChapter.id,
                        title: module.title,
                        slug: module.slug,
                        summary: module.summary,
                        order_index: module.order_index,
                        required: module.required,
                        prerequisite_module_ids: [], // Will update after all modules are created
                        requires_quiz_pass_to_continue: module.requires_quiz_pass_to_continue,
                        tenant_id: data.tenant_id
                    }
                });
                moduleIdMap.set(module.id, newModule.id);
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
        console.log(`[copyFromTemplate] Created ${chapterIdMap.size} chapters and ${moduleIdMap.size} modules`);
        // Second pass: update prerequisites using the ID mappings
        for (const chapter of template.chapters) {
            const newChapterId = chapterIdMap.get(chapter.id);
            if (!newChapterId)
                continue;
            // Update chapter prerequisites - only include prerequisite chapters that exist in the copy
            if (chapter.prerequisite_chapter_ids?.length) {
                const remappedChapterPrereqs = chapter.prerequisite_chapter_ids
                    .map(id => chapterIdMap.get(id))
                    .filter((id) => !!id);
                if (remappedChapterPrereqs.length > 0) {
                    console.log(`[copyFromTemplate] Updating chapter ${newChapterId} prerequisites: ${remappedChapterPrereqs}`);
                    await client_1.default.chapter.update({
                        where: { id: newChapterId },
                        data: { prerequisite_chapter_ids: remappedChapterPrereqs }
                    });
                }
            }
            // Update module prerequisites
            for (const module of chapter.modules) {
                const newModuleId = moduleIdMap.get(module.id);
                if (newModuleId && module.prerequisite_module_ids?.length) {
                    // Only include prerequisites that exist in the copied modules
                    const remappedModulePrereqs = module.prerequisite_module_ids
                        .map(id => moduleIdMap.get(id))
                        .filter((id) => !!id);
                    if (remappedModulePrereqs.length > 0) {
                        console.log(`[copyFromTemplate] Updating module ${newModuleId} prerequisites: ${remappedModulePrereqs}`);
                        await client_1.default.module.update({
                            where: { id: newModuleId },
                            data: { prerequisite_module_ids: remappedModulePrereqs }
                        });
                    }
                }
            }
        }
        console.log(`[copyFromTemplate] Successfully completed course copy`);
        // Return the complete new course
        return getById(newCourse.id);
    }
    catch (error) {
        console.error(`[copyFromTemplate] Error:`, error);
        throw error;
    }
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
