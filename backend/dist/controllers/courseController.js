"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const courseService_1 = __importDefault(require("../services/courseService"));
const createCourse = async (req, res) => {
    const { title, description, tenant_id } = req.body;
    try {
        const course = await courseService_1.default.createCourse({
            title: title || 'New Course',
            description,
            tenant_id
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
    const tenant_id = req.params.tenantId || req.query.tenant_id || req.user?.tenantId;
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
        const course = await courseService_1.default.assignCourseToTenant(globalCourseId, tenantId, title);
        res.status(201).json(course);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to assign course';
        res.status(400).json({ error: message });
    }
};
const deleteCourse = async (req, res) => {
    await courseService_1.default.deleteCourse(req.params.id);
    res.json({ ok: true });
};
const updateCourse = async (req, res) => {
    const { title, description } = req.body;
    const updated = await courseService_1.default.updateCourse(req.params.id, { title, description });
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
exports.default = {
    createCourse,
    listCourses,
    listGlobalCourses,
    assignCourseToTenant,
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
    addModuleToCourse
};
