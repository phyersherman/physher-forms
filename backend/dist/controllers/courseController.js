"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const courseService_1 = __importDefault(require("../services/courseService"));
const createCourse = async (req, res) => {
    const { title, description, tenantId, tenant_id, chapters } = req.body;
    const finalTenantId = tenantId || tenant_id;
    try {
        const course = await courseService_1.default.createCourse({
            title: title || 'New Course',
            description,
            tenant_id: finalTenantId,
            chapters
        });
        res.status(201).json(course);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create course';
        res.status(400).json({ error: message });
    }
};
const listGlobalCourses = async (req, res) => {
    try {
        const courses = await courseService_1.default.listGlobalCourses();
        res.json(courses);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list courses';
        res.status(400).json({ error: message });
    }
};
const listCourses = async (req, res) => {
    const tenant_id = (req.params.tenantId || (typeof req.query.tenant_id === 'string' ? req.query.tenant_id : undefined) || req.user?.tenantId);
    if (!tenant_id)
        return res.status(400).json({ error: 'tenant_id required' });
    const courses = await courseService_1.default.listByTenant(tenant_id);
    res.json(courses);
};
const assignCourseToTenant = async (req, res) => {
    const { globalCourseId, tenantId, title } = req.body;
    if (!globalCourseId || !tenantId)
        return res.status(400).json({ error: 'globalCourseId and tenantId required' });
    try {
        const titleStr = typeof title === 'string' ? title : undefined;
        const course = await courseService_1.default.assignCourseToTenant(globalCourseId, tenantId, titleStr);
        res.status(201).json(course);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to assign course';
        res.status(400).json({ error: message });
    }
};
const copyCourse = async (req, res) => {
    const { courseId } = req.params;
    const { targetTenantId } = req.body;
    if (!targetTenantId)
        return res.status(400).json({ error: 'targetTenantId required' });
    try {
        const course = await courseService_1.default.assignCourseToTenant(courseId, targetTenantId);
        res.status(201).json(course);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to copy course';
        res.status(400).json({ error: message });
    }
};
const deleteCourse = async (req, res) => {
    await courseService_1.default.deleteCourse(req.params.id);
    res.json({ ok: true });
};
const updateCourse = async (req, res) => {
    const { title, description, chapters } = req.body;
    const updated = await courseService_1.default.updateCourse(req.params.id, { title, description, chapters });
    res.json(updated);
};
const getCourse = async (req, res) => {
    const c = await courseService_1.default.getById(req.params.id);
    if (!c)
        return res.status(404).json({ error: 'not found' });
    res.json(c);
};
const getModule = async (req, res) => {
    const m = await courseService_1.default.getModuleById(req.params.moduleId);
    if (!m)
        return res.status(404).json({ error: 'module not found' });
    res.json(m);
};
// modules
const addModule = async (req, res) => {
    const { title, slug, summary, order_index, required, prerequisite_module_ids, requires_quiz_pass_to_continue, } = req.body;
    if (!title)
        return res.status(400).json({ error: 'title required' });
    const chapter = await courseService_1.default.getChapterById(req.params.chapterId);
    if (!chapter)
        return res.status(404).json({ error: 'chapter not found' });
    const m = await courseService_1.default.createModule({
        chapter_id: req.params.chapterId,
        title,
        slug,
        summary,
        order_index,
        required,
        prerequisite_module_ids,
        requires_quiz_pass_to_continue,
        tenant_id: chapter.tenant_id || undefined,
    });
    res.status(201).json(m);
};
const updateModule = async (req, res) => {
    const { title, slug, summary, order_index, required, prerequisite_module_ids, requires_quiz_pass_to_continue, } = req.body;
    const m = await courseService_1.default.updateModule(req.params.moduleId, {
        title,
        slug,
        summary,
        order_index,
        required,
        prerequisite_module_ids,
        requires_quiz_pass_to_continue,
    });
    res.json(m);
};
const deleteModule = async (req, res) => {
    await courseService_1.default.deleteModule(req.params.moduleId);
    res.json({ ok: true });
};
// chapters
const addChapter = async (req, res) => {
    const { title, order_index } = req.body;
    if (!title)
        return res.status(400).json({ error: 'title required' });
    const course = await courseService_1.default.getById(req.params.courseId);
    if (!course)
        return res.status(404).json({ error: 'course not found' });
    const c = await courseService_1.default.createChapter({
        course_id: req.params.courseId,
        title,
        order_index,
        tenant_id: course.tenant_id || undefined,
    });
    res.status(201).json(c);
};
const getChapter = async (req, res) => {
    const c = await courseService_1.default.getChapterById(req.params.chapterId);
    if (!c)
        return res.status(404).json({ error: 'chapter not found' });
    res.json(c);
};
const updateChapter = async (req, res) => {
    const { title, order_index } = req.body;
    const c = await courseService_1.default.updateChapter(req.params.chapterId, { title, order_index });
    res.json(c);
};
const deleteChapter = async (req, res) => {
    await courseService_1.default.deleteChapter(req.params.chapterId);
    res.json({ ok: true });
};
// blocks
const addBlock = async (req, res) => {
    const { type, content, config, order_index } = req.body;
    if (!type)
        return res.status(400).json({ error: 'type required' });
    const module = await courseService_1.default.getModuleById(req.params.moduleId);
    if (!module)
        return res.status(404).json({ error: 'module not found' });
    const b = await courseService_1.default.createBlock({
        module_id: req.params.moduleId,
        type,
        content,
        config,
        order_index,
        tenant_id: module.tenant_id || undefined,
    });
    res.status(201).json(b);
};
const updateBlock = async (req, res) => {
    const { type, content, config, order_index } = req.body;
    const b = await courseService_1.default.updateBlock(req.params.blockId, { type, content, config, order_index });
    res.json(b);
};
const deleteBlock = async (req, res) => {
    await courseService_1.default.deleteBlock(req.params.blockId);
    res.json({ ok: true });
};
const listBlocksByModule = async (req, res) => {
    const blocks = await courseService_1.default.listBlocksByModule(req.params.moduleId);
    res.json(blocks);
};
const reorderBlocks = async (req, res) => {
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) {
        return res.status(400).json({ error: 'blocks must be an array' });
    }
    const updated = await courseService_1.default.reorderBlocks(req.params.moduleId, blocks);
    res.json(updated);
};
// Backward compatibility: add module to course (creates default chapter if needed)
const addModuleToCourse = async (req, res) => {
    const { title, slug, summary, order_index, required, prerequisite_module_ids, requires_quiz_pass_to_continue, } = req.body;
    if (!title)
        return res.status(400).json({ error: 'title required' });
    const course = await courseService_1.default.getById(req.params.courseId);
    if (!course)
        return res.status(404).json({ error: 'course not found' });
    // Find or create default chapter
    let chapter;
    if (course.chapters && course.chapters.length > 0) {
        chapter = course.chapters[0]; // Use first chapter
    }
    else {
        // Create default chapter
        chapter = await courseService_1.default.createChapter({
            course_id: req.params.courseId,
            title: 'Default Chapter',
            order_index: 0,
            tenant_id: course.tenant_id || undefined,
        });
    }
    const m = await courseService_1.default.createModule({
        chapter_id: chapter.id,
        title,
        slug,
        summary,
        order_index,
        required,
        prerequisite_module_ids,
        requires_quiz_pass_to_continue,
        tenant_id: course.tenant_id || undefined,
    });
    res.status(201).json(m);
};
const exportCourseAsCSV = async (req, res) => {
    try {
        const json = await courseService_1.default.exportCourseAsJSON(req.params.courseId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.courseId}.json"`);
        res.send(json);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to export course';
        res.status(400).json({ error: message });
    }
};
const importCoursesFromCSV = async (req, res) => {
    try {
        const { csvContent } = req.body;
        const tenantId = (req.params.tenantId || req.query.tenantId);
        if (!csvContent) {
            return res.status(400).json({ error: 'csvContent is required' });
        }
        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        console.log('[IMPORT] Received content length:', csvContent.length, 'bytes');
        console.log('[IMPORT] Tenant ID:', tenantId);
        // Parse JSON
        const { courses, errors: parseErrors } = courseService_1.default.parseImportJSON(csvContent);
        console.log('[IMPORT] Parse result - courses:', courses.length, 'errors:', parseErrors.length);
        if (parseErrors.length > 0) {
            console.log('[IMPORT] Parse errors:', parseErrors);
        }
        if (parseErrors.length > 0) {
            return res.status(400).json({
                success: false,
                totalParsed: courses.length,
                importedCount: 0,
                importedIds: [],
                errors: parseErrors
            });
        }
        // Validate parsed courses
        const { valid, errors: validationErrors } = courseService_1.default.validateParsedCourses(courses);
        console.log('[IMPORT] Validation result - valid:', valid, 'errors:', validationErrors.length);
        if (validationErrors.length > 0) {
            console.log('[IMPORT] Validation errors:', validationErrors);
        }
        if (!valid) {
            return res.status(400).json({
                success: false,
                totalParsed: courses.length,
                importedCount: 0,
                importedIds: [],
                errors: validationErrors
            });
        }
        // Import courses
        const result = await courseService_1.default.importCoursesFromParsed(courses, tenantId);
        res.status(result.success ? 201 : 400).json({
            success: result.success,
            totalParsed: courses.length,
            importedCount: result.importedIds.length,
            importedIds: result.importedIds,
            errors: result.errors
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import courses';
        res.status(500).json({
            success: false,
            totalParsed: 0,
            importedCount: 0,
            importedIds: [],
            errors: [{ line: 0, field: 'import', message }]
        });
    }
};
const previewImportFromCSV = async (req, res) => {
    try {
        const { csvContent } = req.body;
        if (!csvContent) {
            return res.status(400).json({ error: 'csvContent is required' });
        }
        // Parse JSON
        const { courses, errors: parseErrors } = courseService_1.default.parseImportJSON(csvContent);
        if (parseErrors.length > 0) {
            return res.status(400).json({
                valid: false,
                parseErrors,
                courses: 0
            });
        }
        // Validate parsed courses
        const { valid, errors: validationErrors } = courseService_1.default.validateParsedCourses(courses);
        res.json({
            valid,
            parseErrors: [],
            validationErrors,
            coursesToCreate: courses.length
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to preview import';
        res.status(500).json({
            valid: false,
            parseErrors: [message],
            coursesToCreate: 0
        });
    }
};
const downloadCSVTemplate = async (req, res) => {
    try {
        const template = courseService_1.default.generateJSONTemplate();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="course-template.json"');
        res.send(template);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate template';
        res.status(500).json({ error: message });
    }
};
exports.default = {
    createCourse,
    listCourses,
    listGlobalCourses,
    assignCourseToTenant,
    copyCourse,
    getCourse,
    updateCourse,
    deleteCourse,
    addModule,
    getModule,
    updateModule,
    deleteModule,
    addChapter,
    getChapter,
    updateChapter,
    deleteChapter,
    addBlock,
    updateBlock,
    deleteBlock,
    listBlocksByModule,
    reorderBlocks,
    addModuleToCourse,
    exportCourseAsCSV,
    importCoursesFromCSV,
    previewImportFromCSV,
    downloadCSVTemplate
};
