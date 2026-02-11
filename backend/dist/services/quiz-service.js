"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
const submitQuizAttempt = async (submission) => {
    // Get the block with quiz config
    const block = await client_1.default.block.findUnique({
        where: { id: submission.blockId },
        include: {
            module: {
                include: {
                    chapter: {
                        include: {
                            course: true,
                        },
                    },
                },
            },
        },
    });
    if (!block || block.type !== 'quiz') {
        throw new Error('Quiz block not found');
    }
    // Parse quiz config
    let quizConfig = {};
    try {
        quizConfig = JSON.parse(block.config || '{}');
    }
    catch {
        throw new Error('Invalid quiz configuration');
    }
    // Calculate score
    const questions = quizConfig.questions || [];
    let correctCount = 0;
    let totalPoints = 0;
    questions.forEach((question) => {
        const points = question.points || 1;
        totalPoints += points;
        const userAnswer = submission.answers[question.id];
        let isCorrect = false;
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
            isCorrect = userAnswer === question.correctAnswer;
        }
        else if (question.type === 'short-answer') {
            // Case-insensitive comparison for short answers
            isCorrect =
                userAnswer?.toLowerCase().trim() ===
                    question.correctAnswer?.toLowerCase().trim();
        }
        if (isCorrect) {
            correctCount += points;
        }
    });
    const score = totalPoints > 0 ? Math.round((correctCount / totalPoints) * 100) : 0;
    const passingScore = quizConfig.passingScore || 70;
    const passed = score >= passingScore;
    // Save attempt to database
    await client_1.default.quizAttempt.create({
        data: {
            blockId: submission.blockId,
            userId: submission.userId,
            tenantId: submission.tenantId,
            courseId: submission.courseId,
            score,
            passed,
            answers: JSON.stringify(submission.answers),
        },
    });
    return {
        score,
        passed,
        feedback: `You scored ${score}%. ${passed ? '✓ You passed!' : `You need ${passingScore}% to pass.`}`,
    };
};
const markModuleComplete = async (moduleId, userId, courseId, tenantId) => {
    // Check if already completed
    const existing = await client_1.default.moduleCompletion.findFirst({
        where: {
            moduleId,
            userId,
            courseId,
        },
    });
    if (existing) {
        return existing;
    }
    // Create completion record
    return client_1.default.moduleCompletion.create({
        data: {
            moduleId,
            userId,
            courseId,
            tenantId,
        },
    });
};
const isModuleAccessible = async (moduleId, userId, courseId) => {
    // Get module with prerequisites and gating info
    const module = await client_1.default.module.findUnique({
        where: { id: moduleId },
        include: {
            chapter: true,
            blocks: true,
        },
    });
    if (!module) {
        return { accessible: false, reason: 'Module not found' };
    }
    // Check prerequisite modules
    if (module.prerequisite_module_ids && module.prerequisite_module_ids.length > 0) {
        for (const prereqModuleId of module.prerequisite_module_ids) {
            const completion = await client_1.default.moduleCompletion.findFirst({
                where: {
                    moduleId: prereqModuleId,
                    userId,
                    courseId,
                },
            });
            if (!completion) {
                return {
                    accessible: false,
                    reason: `This module requires completing a prerequisite module first.`,
                };
            }
        }
    }
    // Check if quiz passing is required
    if (module.requires_quiz_pass_to_continue) {
        // Find quiz block in this module
        const quizBlock = module.blocks.find((b) => b.type === 'quiz');
        if (quizBlock) {
            // Check if user has passed the quiz
            const passedAttempt = await client_1.default.quizAttempt.findFirst({
                where: {
                    blockId: quizBlock.id,
                    userId,
                    passed: true,
                },
                orderBy: {
                    submittedAt: 'desc',
                },
            });
            if (!passedAttempt) {
                return {
                    accessible: false,
                    reason: 'You must pass the quiz in this module before continuing.',
                };
            }
        }
    }
    return { accessible: true };
};
const getQuizAttempts = async (blockId, userId) => {
    return client_1.default.quizAttempt.findMany({
        where: {
            blockId,
            userId,
        },
        orderBy: {
            submittedAt: 'desc',
        },
    });
};
const getLatestQuizAttempt = async (blockId, userId) => {
    return client_1.default.quizAttempt.findFirst({
        where: {
            blockId,
            userId,
        },
        orderBy: {
            submittedAt: 'desc',
        },
    });
};
exports.default = {
    submitQuizAttempt,
    markModuleComplete,
    isModuleAccessible,
    getQuizAttempts,
    getLatestQuizAttempt,
};
