"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const courseTemplateService_1 = __importDefault(require("../services/courseTemplateService"));
const createTemplate = async (req, res) => {
    const { title, description } = req.body;
    if (!title)
        return res.status(400).json({ error: 'title required' });
    try {
        const t = await courseTemplateService_1.default.createTemplate({ title, description });
        res.status(201).json(t);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create template' });
    }
};
const listTemplates = async (req, res) => {
    try {
        const templates = await courseTemplateService_1.default.listTemplates();
        res.json(templates);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to list templates' });
    }
};
const getTemplate = async (req, res) => {
    try {
        const t = await courseTemplateService_1.default.getTemplateById(req.params.id);
        if (!t)
            return res.status(404).json({ error: 'not found' });
        res.json(t);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to get template' });
    }
};
const updateTemplate = async (req, res) => {
    const { title, description } = req.body;
    try {
        const updated = await courseTemplateService_1.default.updateTemplate(req.params.id, { title, description });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update template' });
    }
};
const deleteTemplate = async (req, res) => {
    try {
        await courseTemplateService_1.default.deleteTemplate(req.params.id);
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
};
// Template module management
const addTemplateModule = async (req, res) => {
    const { title, slug, summary, order } = req.body;
    if (!title)
        return res.status(400).json({ error: 'title required' });
    try {
        const module = await courseTemplateService_1.default.createTemplateModule({
            template_id: req.params.templateId,
            title,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
            summary: summary || null,
            order: order || 0,
        });
        res.status(201).json(module);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create template module' });
    }
};
const getTemplateModule = async (req, res) => {
    try {
        const module = await courseTemplateService_1.default.getTemplateModuleById(req.params.moduleId);
        if (!module)
            return res.status(404).json({ error: 'module not found' });
        res.json(module);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to get template module' });
    }
};
const updateTemplateModule = async (req, res) => {
    const { title, slug, summary, order } = req.body;
    try {
        const module = await courseTemplateService_1.default.updateTemplateModule(req.params.moduleId, {
            title,
            slug,
            summary,
            order,
        });
        res.json(module);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update template module' });
    }
};
const deleteTemplateModule = async (req, res) => {
    try {
        await courseTemplateService_1.default.deleteTemplateModule(req.params.moduleId);
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete template module' });
    }
};
// Template module blocks
const addTemplateModuleBlock = async (req, res) => {
    const { type, content, config, order } = req.body;
    if (!type)
        return res.status(400).json({ error: 'type required' });
    try {
        const block = await courseTemplateService_1.default.createTemplateModuleBlock({
            template_module_id: req.params.moduleId,
            type,
            content,
            config,
            order_index: order || 0,
        });
        res.status(201).json(block);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create block' });
    }
};
const getTemplateModuleBlocks = async (req, res) => {
    try {
        const blocks = await courseTemplateService_1.default.listTemplateModuleBlocks(req.params.moduleId);
        res.json(blocks);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to list blocks' });
    }
};
const deleteTemplateModuleBlock = async (req, res) => {
    try {
        await courseTemplateService_1.default.deleteTemplateModuleBlock(req.params.blockId);
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete block' });
    }
};
exports.default = {
    createTemplate,
    listTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    addTemplateModule,
    getTemplateModule,
    updateTemplateModule,
    deleteTemplateModule,
    addTemplateModuleBlock,
    getTemplateModuleBlocks,
    deleteTemplateModuleBlock,
};
