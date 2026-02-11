"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
const getQuizAnalytics = async (blockId, tenantId, courseId, daysBack = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    // Get all attempts for this quiz block
    const attempts = await client_1.default.quizAttempt.findMany({
        where: {
            blockId,
            tenantId,
            courseId,
            submittedAt: {
                gte: cutoffDate,
            },
        },
        orderBy: {
            submittedAt: 'asc',
        },
    });
    if (attempts.length === 0) {
        return {
            blockId,
            totalAttempts: 0,
            uniqueUsers: 0,
            scoreStats: {
                minScore: 0,
                maxScore: 0,
                averageScore: 0,
                medianScore: 0,
                stdDeviation: 0,
                totalAttempts: 0,
            },
            passFailBreakdown: {
                passCount: 0,
                failCount: 0,
                passPercentage: 0,
                failPercentage: 0,
            },
            attemptTrends: [],
            scoreDistribution: [],
        };
    }
    // Calculate score statistics
    const scores = attempts.map((a) => a.score);
    const sortedScores = [...scores].sort((a, b) => a - b);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const medianScore = sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const stdDeviation = Math.sqrt(variance);
    // Calculate pass/fail breakdown (assuming 70% is passing)
    const passCount = attempts.filter((a) => a.passed).length;
    const failCount = attempts.length - passCount;
    const passPercentage = (passCount / attempts.length) * 100;
    const failPercentage = (failCount / attempts.length) * 100;
    // Score distribution (in intervals of 10)
    const distribution = {
        '0-10': 0,
        '11-20': 0,
        '21-30': 0,
        '31-40': 0,
        '41-50': 0,
        '51-60': 0,
        '61-70': 0,
        '71-80': 0,
        '81-90': 0,
        '91-100': 0,
    };
    scores.forEach((score) => {
        if (score <= 10)
            distribution['0-10']++;
        else if (score <= 20)
            distribution['11-20']++;
        else if (score <= 30)
            distribution['21-30']++;
        else if (score <= 40)
            distribution['31-40']++;
        else if (score <= 50)
            distribution['41-50']++;
        else if (score <= 60)
            distribution['51-60']++;
        else if (score <= 70)
            distribution['61-70']++;
        else if (score <= 80)
            distribution['71-80']++;
        else if (score <= 90)
            distribution['81-90']++;
        else
            distribution['91-100']++;
    });
    const scoreDistribution = Object.entries(distribution).map(([range, count]) => ({
        range,
        count,
    }));
    // Group attempts by date for trending
    const attemptsByDate = {};
    attempts.forEach((attempt) => {
        const dateStr = new Date(attempt.submittedAt).toISOString().split('T')[0];
        if (!attemptsByDate[dateStr]) {
            attemptsByDate[dateStr] = { scores: [], passCount: 0, totalCount: 0 };
        }
        attemptsByDate[dateStr].scores.push(attempt.score);
        attemptsByDate[dateStr].totalCount++;
        if (attempt.passed) {
            attemptsByDate[dateStr].passCount++;
        }
    });
    const attemptTrends = Object.entries(attemptsByDate)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
        date,
        attempts: data.totalCount,
        averageScore: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100,
        passRate: Math.round((data.passCount / data.totalCount) * 100),
    }));
    // Get unique users
    const uniqueUsers = new Set(attempts.map((a) => a.userId)).size;
    return {
        blockId,
        totalAttempts: attempts.length,
        uniqueUsers,
        scoreStats: {
            minScore: Math.round(minScore * 100) / 100,
            maxScore: Math.round(maxScore * 100) / 100,
            averageScore: Math.round(averageScore * 100) / 100,
            medianScore: Math.round(medianScore * 100) / 100,
            stdDeviation: Math.round(stdDeviation * 100) / 100,
            totalAttempts: attempts.length,
        },
        passFailBreakdown: {
            passCount,
            failCount,
            passPercentage: Math.round(passPercentage * 100) / 100,
            failPercentage: Math.round(failPercentage * 100) / 100,
        },
        attemptTrends,
        scoreDistribution,
    };
};
const getCourseQuizAnalytics = async (courseId, tenantId, daysBack = 30) => {
    // Get all quiz blocks in this course
    const quizBlocks = await client_1.default.block.findMany({
        where: {
            type: 'quiz',
            module: {
                chapter: {
                    course_id: courseId,
                },
            },
        },
        include: {
            module: true,
        },
    });
    const results = [];
    for (const block of quizBlocks) {
        const analytics = await getQuizAnalytics(block.id, tenantId, courseId, daysBack);
        let blockTitle = 'Untitled Quiz';
        try {
            const config = JSON.parse(block.config || '{}');
            blockTitle = config.title || blockTitle;
        }
        catch {
            // ignore
        }
        results.push({
            blockId: block.id,
            blockTitle,
            analytics,
        });
    }
    return results;
};
const getTopPerformers = async (blockId, tenantId, courseId, limit = 10) => {
    const attempts = await client_1.default.quizAttempt.findMany({
        where: {
            blockId,
            tenantId,
            courseId,
        },
    });
    // Group by user and get best score
    const userStats = {};
    attempts.forEach((attempt) => {
        if (!userStats[attempt.userId]) {
            userStats[attempt.userId] = {
                highestScore: attempt.score,
                attemptCount: 1,
                lastAttempt: attempt.submittedAt,
            };
        }
        else {
            userStats[attempt.userId].highestScore = Math.max(userStats[attempt.userId].highestScore, attempt.score);
            userStats[attempt.userId].attemptCount++;
            userStats[attempt.userId].lastAttempt = new Date(Math.max(userStats[attempt.userId].lastAttempt.getTime(), attempt.submittedAt.getTime()));
        }
    });
    return Object.entries(userStats)
        .map(([userId, stats]) => ({
        userId,
        ...stats,
    }))
        .sort((a, b) => b.highestScore - a.highestScore)
        .slice(0, limit);
};
exports.default = {
    getQuizAnalytics,
    getCourseQuizAnalytics,
    getTopPerformers,
};
