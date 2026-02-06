"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const block_service_1 = __importDefault(require("../services/block-service"));
const createBlock = async (req, res) => {
    const { module_id, type, content, config, order_index } = req.body;
    const tenant_id = req.tenantId;
    if (!module_id || !type) {
        return res.status(400).json({ error: 'module_id and type required' });
    }
    if (!tenant_id) {
        return res.status(401).json({ error: 'not authenticated' });
    }
    try {
        const block = await block_service_1.default.createBlock({
            module_id,
            type,
            content,
            config,
            order_index: order_index || 0,
            tenant_id,
        });
        res.status(201).json(block);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const getBlock = async (req, res) => {
    const blockId = typeof req.params.blockId === 'string' ? req.params.blockId : req.params.blockId[0];
    try {
        const block = await block_service_1.default.getBlockById(blockId);
        if (!block)
            return res.status(404).json({ error: 'block not found' });
        res.json(block);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const listBlocksByModule = async (req, res) => {
    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : req.params.moduleId[0];
    try {
        const blocks = await block_service_1.default.listByModule(moduleId);
        res.json(blocks);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const updateBlock = async (req, res) => {
    const blockId = typeof req.params.blockId === 'string' ? req.params.blockId : req.params.blockId[0];
    const { type, content, config, order_index } = req.body;
    try {
        const block = await block_service_1.default.updateBlock(blockId, {
            type,
            content,
            config,
            order_index,
        });
        res.json(block);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const deleteBlock = async (req, res) => {
    const blockId = typeof req.params.blockId === 'string' ? req.params.blockId : req.params.blockId[0];
    try {
        await block_service_1.default.deleteBlock(blockId);
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const reorderBlocks = async (req, res) => {
    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : req.params.moduleId[0];
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) {
        return res.status(400).json({ error: 'blocks must be an array' });
    }
    try {
        const updated = await block_service_1.default.reorderBlocks(moduleId, blocks);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.default = {
    createBlock,
    getBlock,
    listBlocksByModule,
    updateBlock,
    deleteBlock,
    reorderBlocks,
};
