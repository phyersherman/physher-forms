"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChapter = exports.updateChapter = exports.getChapterById = exports.createChapter = void 0;
const client_1 = __importDefault(require("../db/client"));
/**
 * Chapter Service
 * Handles all chapter-related operations
 */
const createChapter = async (data) => {
    return client_1.default.chapter.create({
        data: {
            course_id: data.course_id,
            title: data.title,
            order_index: data.order_index || 0,
            tenant_id: data.tenant_id || null,
        },
    });
};
exports.createChapter = createChapter;
const getChapterById = async (id) => {
    return client_1.default.chapter.findUnique({
        where: { id },
        include: { modules: { include: { blocks: true } } },
    });
};
exports.getChapterById = getChapterById;
const updateChapter = async (id, data) => {
    return client_1.default.chapter.update({ where: { id }, data });
};
exports.updateChapter = updateChapter;
const deleteChapter = async (id) => {
    return client_1.default.chapter.delete({ where: { id } });
};
exports.deleteChapter = deleteChapter;
