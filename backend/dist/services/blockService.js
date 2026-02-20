"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderBlocks = exports.listBlocksByModule = exports.deleteBlock = exports.updateBlock = exports.createBlock = void 0;
const client_1 = __importDefault(require("../db/client"));
/**
 * Block Service
 * Handles all block-related operations (lesson content blocks)
 */
const createBlock = async (data) => {
    return client_1.default.block.create({
        data: {
            module_id: data.module_id,
            type: data.type,
            content: data.content,
            config: data.config,
            order_index: data.order_index || 0,
            tenant_id: data.tenant_id || null,
        },
    });
};
exports.createBlock = createBlock;
const updateBlock = async (id, data) => {
    return client_1.default.block.update({ where: { id }, data });
};
exports.updateBlock = updateBlock;
const deleteBlock = async (id) => {
    return client_1.default.block.delete({ where: { id } });
};
exports.deleteBlock = deleteBlock;
const listBlocksByModule = async (module_id) => {
    return client_1.default.block.findMany({
        where: { module_id },
        orderBy: { order_index: 'asc' },
    });
};
exports.listBlocksByModule = listBlocksByModule;
const reorderBlocks = async (moduleId, blocks) => {
    const updates = blocks.map((block) => client_1.default.block.update({
        where: { id: block.id },
        data: { order_index: block.order_index },
    }));
    return Promise.all(updates);
};
exports.reorderBlocks = reorderBlocks;
