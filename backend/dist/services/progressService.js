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
const certificateService = __importStar(require("./certificate-service"));
/**
 * Progress Service
 * Handles tracking and retrieving course progression including module, chapter, and course completions
 */
/**
 * Mark a module as completed
 */
const completeModule = async (moduleId, userId, courseId, tenantId) => {
    // Check if already completed
    const existing = await client_1.default.moduleCompletion.findFirst({
        where: { moduleId, userId, courseId },
    });
    if (existing) {
        return existing;
    }
    return await client_1.default.moduleCompletion.create({
        data: {
            moduleId,
            userId,
            courseId,
            tenantId,
        },
    });
};
/**
 * Mark a chapter as completed
 */
const completeChapter = async (chapterId, userId, courseId, tenantId) => {
    // Check if already completed
    const existing = await client_1.default.chapterCompletion.findFirst({
        where: { chapterId, userId, courseId },
    });
    if (existing) {
        return existing;
    }
    return await client_1.default.chapterCompletion.create({
        data: {
            chapterId,
            userId,
            courseId,
            tenantId,
        },
    });
};
/**
 * Complete a course (mark enrollment as completed and generate certificate)
 */
const completeCourse = async (courseId, userId, tenantId) => {
    const enrollment = await client_1.default.enrollment.findUnique({
        where: {
            tenantId_courseId_userId: { tenantId, courseId, userId },
        },
    });
    if (!enrollment) {
        throw new Error('Enrollment not found');
    }
    // Mark as completed
    const updatedEnrollment = await client_1.default.enrollment.update({
        where: { id: enrollment.id },
        data: {
            completedAt: new Date(),
        },
    });
    // Generate certificate automatically
    try {
        const certificate = await certificateService.generateCertificate({
            enrollmentId: enrollment.id,
            userId,
            courseId,
            tenantId,
        });
        // Link certificate to enrollment
        await client_1.default.enrollment.update({
            where: { id: enrollment.id },
            data: { certificateId: certificate.id },
        });
        return { ...updatedEnrollment, certificateId: certificate.id };
    }
    catch (err) {
        console.error('Error generating certificate:', err);
        // Return enrollment even if certificate generation fails
        return updatedEnrollment;
    }
};
/**
 * Get course progress for a user
 * Returns completed modules, chapters, and overall progress percentage
 */
const getCourseProgress = async (courseId, userId) => {
    // Get the course with all chapters and modules
    const course = await client_1.default.course.findUnique({
        where: { id: courseId },
        include: {
            chapters: {
                include: {
                    modules: true,
                },
            },
        },
    });
    if (!course) {
        throw new Error('Course not found');
    }
    // Count total modules and chapters
    let totalModules = 0;
    let totalChapters = course.chapters.length;
    for (const chapter of course.chapters) {
        totalModules += chapter.modules.length;
    }
    // Get completed modules and chapters
    const completedModulesRaw = await client_1.default.moduleCompletion.findMany({
        where: { userId, courseId },
    });
    const completedChaptersRaw = await client_1.default.chapterCompletion.findMany({
        where: { userId, courseId },
    });
    const completedModules = new Set(completedModulesRaw.map(c => c.moduleId));
    const completedChapters = new Set(completedChaptersRaw.map(c => c.chapterId));
    // Calculate progress percentage
    const moduleProgressPercent = totalModules > 0 ? (completedModules.size / totalModules) * 100 : 0;
    const chapterProgressPercent = totalChapters > 0 ? (completedChapters.size / totalChapters) * 100 : 0;
    // Check course completion
    const enrollment = await client_1.default.enrollment.findUnique({
        where: {
            tenantId_courseId_userId: { tenantId: course.tenant_id, courseId, userId },
        },
    });
    return {
        courseId,
        userId,
        totalModules,
        totalChapters,
        completedModulesCount: completedModules.size,
        completedChaptersCount: completedChapters.size,
        completedModules: Array.from(completedModules),
        completedChapters: Array.from(completedChapters),
        moduleProgressPercent: Math.round(moduleProgressPercent),
        chapterProgressPercent: Math.round(chapterProgressPercent),
        courseCompleted: enrollment?.completedAt ? true : false,
        courseCompletedAt: enrollment?.completedAt,
        certificateId: enrollment?.certificateId || null,
    };
};
/**
 * Get chapters and modules progress for a user in a course
 * Returns chapter structure with completion status
 */
const getCourseStructureWithProgress = async (courseId, userId) => {
    // Get the course with all chapters and modules
    const course = await client_1.default.course.findUnique({
        where: { id: courseId },
        include: {
            chapters: {
                include: {
                    modules: {
                        orderBy: { order_index: 'asc' },
                    },
                },
                orderBy: { order_index: 'asc' },
            },
        },
    });
    if (!course) {
        throw new Error('Course not found');
    }
    // Get completed modules and chapters
    const completedModulesRaw = await client_1.default.moduleCompletion.findMany({
        where: { userId, courseId },
    });
    const completedChaptersRaw = await client_1.default.chapterCompletion.findMany({
        where: { userId, courseId },
    });
    const completedModules = new Set(completedModulesRaw.map(c => c.moduleId));
    const completedChapters = new Set(completedChaptersRaw.map(c => c.chapterId));
    // Build structure with progress
    const chaptersWithProgress = course.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        order_index: chapter.order_index,
        completed: completedChapters.has(chapter.id),
        modules: chapter.modules.map(module => ({
            id: module.id,
            title: module.title,
            order_index: module.order_index,
            completed: completedModules.has(module.id),
        })),
    }));
    return chaptersWithProgress;
};
/**
 * Check if a module is the first module of a chapter
 */
const isFirstModule = (chapter, moduleId) => {
    return chapter.modules.length > 0 && chapter.modules[0].id === moduleId;
};
/**
 * Check if a module is the last module of a chapter
 */
const isLastModule = (chapter, moduleId) => {
    return chapter.modules.length > 0 && chapter.modules[chapter.modules.length - 1].id === moduleId;
};
exports.default = {
    completeModule,
    completeChapter,
    completeCourse,
    getCourseProgress,
    getCourseStructureWithProgress,
    isFirstModule,
    isLastModule,
};
