"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
const chapterService = __importStar(require("./chapterService"));
const moduleService = __importStar(require("./moduleService"));
const blockService = __importStar(require("./blockService"));
const courseDataService_1 = require("./courseDataService");
/**
 * Course Service (Facade)
 * Aggregates core course CRUD operations and delegates to specialized services
 * Maintains backward compatibility through re-exported functions
 */
/**
 * Creates a new course
 */
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
            const createdChapter = await chapterService.createChapter({
                course_id: course.id,
                title: chapter.title,
                order_index: chapter.order_index
            });
            // Create modules if provided
            if (chapter.modules && chapter.modules.length > 0) {
                for (const module of chapter.modules) {
                    const createdModule = await moduleService.createModule({
                        chapter_id: createdChapter.id,
                        title: module.title,
                        slug: module.slug,
                        summary: module.summary,
                        order_index: module.order_index
                    });
                    // Create blocks if provided
                    if (module.blocks && module.blocks.length > 0) {
                        for (const block of module.blocks) {
                            await blockService.createBlock({
                                module_id: createdModule.id,
                                type: block.type,
                                content: block.content,
                                config: block.config,
                                order_index: block.order_index
                            });
                        }
                    }
                }
            }
        }
    }
    return getById(course.id);
};
/**
 * Lists all global courses (tenant_id is null)
 */
const listGlobalCourses = async () => {
    return client_1.default.course.findMany({
        where: { tenant_id: null },
        include: { chapters: { include: { modules: { include: { blocks: true } } } } }
    });
};
/**
 * Lists all courses for a specific tenant
 */
const listByTenant = async (tenant_id) => {
    return client_1.default.course.findMany({
        where: { tenant_id },
        include: { chapters: { include: { modules: { include: { blocks: true } } } } }
    });
};
/**
 * Gets a single course by ID with all its structure
 */
const getById = async (id) => {
    return client_1.default.course.findUnique({
        where: { id },
        include: { chapters: { include: { modules: { include: { blocks: true } } } } }
    });
};
/**
 * Updates course basic info and/or structure
 */
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
            await chapterService.deleteChapter(ch.id);
        }
        // Upsert chapters
        for (const chapter of data.chapters) {
            let chapterId;
            if (chapter.id && existingChapterIds.has(chapter.id)) {
                // Update existing chapter
                await chapterService.updateChapter(chapter.id, {
                    title: chapter.title,
                    order_index: chapter.order_index
                });
                chapterId = chapter.id;
            }
            else {
                // Create new chapter
                const created = await chapterService.createChapter({
                    course_id: id,
                    title: chapter.title,
                    order_index: chapter.order_index
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
                    await moduleService.deleteModule(mod.id);
                }
                // Upsert modules
                for (const module of chapter.modules) {
                    let moduleId;
                    if (module.id && existingModuleIds.has(module.id)) {
                        // Update existing module
                        await moduleService.updateModule(module.id, {
                            title: module.title,
                            slug: module.slug,
                            summary: module.summary,
                            order_index: module.order_index
                        });
                        moduleId = module.id;
                    }
                    else {
                        // Create new module
                        const created = await moduleService.createModule({
                            chapter_id: chapterId,
                            title: module.title,
                            slug: module.slug,
                            summary: module.summary,
                            order_index: module.order_index
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
                            await blockService.deleteBlock(blk.id);
                        }
                        // Upsert blocks
                        for (const block of module.blocks) {
                            if (block.id && existingBlockIds.has(block.id)) {
                                // Update existing block
                                await blockService.updateBlock(block.id, {
                                    type: block.type,
                                    content: block.content,
                                    config: block.config,
                                    order_index: block.order_index
                                });
                            }
                            else {
                                // Create new block
                                await blockService.createBlock({
                                    module_id: moduleId,
                                    type: block.type,
                                    content: block.content,
                                    config: block.config,
                                    order_index: block.order_index
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    return getById(id);
};
/**
 * Deletes a course
 */
const deleteCourse = async (id) => {
    return client_1.default.course.delete({ where: { id } });
};
exports.default = {
    // Core course CRUD
    createCourse,
    listGlobalCourses,
    listByTenant,
    getById,
    updateCourse,
    deleteCourse,
    // Data operations (complex)
    assignCourseToTenant: courseDataService_1.assignCourseToTenant,
    copyFromTemplate: courseDataService_1.copyFromTemplate,
    // Chapter operations (delegated)
    createChapter: chapterService.createChapter,
    getChapterById: chapterService.getChapterById,
    updateChapter: chapterService.updateChapter,
    deleteChapter: chapterService.deleteChapter,
    // Module operations (delegated)
    createModule: moduleService.createModule,
    getModuleById: moduleService.getModuleById,
    updateModule: moduleService.updateModule,
    deleteModule: moduleService.deleteModule,
    // Block operations (delegated)
    createBlock: blockService.createBlock,
    updateBlock: blockService.updateBlock,
    deleteBlock: blockService.deleteBlock,
    listBlocksByModule: blockService.listBlocksByModule,
    reorderBlocks: blockService.reorderBlocks
};
