/**
 * routes/forum.js
 * 
 * НАЗНАЧЕНИЕ: Управление форумом.
 * 
 * API:
 * GET    /api/forum/sections              - получить все разделы
 * GET    /api/forum/section/:sectionId    - получить темы раздела
 * GET    /api/forum/topic/:topicId        - получить тему с сообщениями
 * POST   /api/forum/topic                 - создать новую тему
 * POST   /api/forum/topic/:topicId/reply  - ответить в теме
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Имена разделов форума (хранятся в коде, не в БД)
const SECTIONS = {
    general: { name: 'Общие темы', icon: 'globe', description: 'Обсуждение всего, что связано с путешествиями' },
    companions: { name: 'Поиск попутчиков', icon: 'users', description: 'Найдите компанию для совместных путешествий' },
    equipment: { name: 'Снаряжение', icon: 'hiking', description: 'Обсуждаем экипировку, отзывы, выбор' },
    reports: { name: 'Отчёты о походах', icon: 'map-signs', description: 'Делитесь впечатлениями и фотографиями' },
    beginners: { name: 'Вопросы новичков', icon: 'question-circle', description: 'Поможем с первыми шагами в туризме' }
};

/**
 * GET /api/forum/sections
 * Получить список разделов со статистикой
 */
router.get('/sections', (req, res) => {
    try {
        const sectionsWithStats = [];

        for (const [sectionId, sectionData] of Object.entries(SECTIONS)) {
            // Считаем количество тем в разделе
            const topicsCount = db.prepare(
                'SELECT COUNT(*) as count FROM forum_topics WHERE section = ?'
            ).get(sectionId).count;

            // Считаем количество сообщений
            const postsCount = db.prepare(`
                SELECT COUNT(*) as count 
                FROM forum_posts fp
                JOIN forum_topics ft ON fp.topic_id = ft.id
                WHERE ft.section = ?
            `).get(sectionId).count;

            sectionsWithStats.push({
                id: sectionId,
                name: sectionData.name,
                icon: sectionData.icon,
                description: sectionData.description,
                topicsCount: topicsCount,
                postsCount: postsCount
            });
        }

        res.json({ success: true, sections: sectionsWithStats });
    } catch (error) {
        console.error('Ошибка форума:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/forum/section/:sectionId
 * Получить темы в разделе
 */
router.get('/section/:sectionId', (req, res) => {
    try {
        const { sectionId } = req.params;

        if (!SECTIONS[sectionId]) {
            return res.status(404).json({ error: 'Раздел не найден' });
        }

        const topics = db.prepare(`
            SELECT 
                ft.*,
                u.first_name || ' ' || u.last_name as author_name,
                (SELECT COUNT(*) FROM forum_posts WHERE topic_id = ft.id) as posts_count
            FROM forum_topics ft
            JOIN users u ON ft.author_id = u.id
            WHERE ft.section = ?
            ORDER BY ft.last_post_date DESC
        `).all(sectionId);

        res.json({ success: true, topics: topics });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/forum/topic/:topicId
 * Получить тему со всеми сообщениями
 */
router.get('/topic/:topicId', (req, res) => {
    try {
        const topicId = parseInt(req.params.topicId);

        // Получаем тему
        const topic = db.prepare(`
            SELECT ft.*, u.first_name || ' ' || u.last_name as author_name
            FROM forum_topics ft
            JOIN users u ON ft.author_id = u.id
            WHERE ft.id = ?
        `).get(topicId);

        if (!topic) {
            return res.status(404).json({ error: 'Тема не найдена' });
        }

        // Увеличиваем счётчик просмотров
        db.prepare('UPDATE forum_topics SET views = views + 1 WHERE id = ?').run(topicId);

        // Получаем сообщения
        const posts = db.prepare(`
            SELECT 
                fp.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.avatar_url as author_avatar
            FROM forum_posts fp
            JOIN users u ON fp.author_id = u.id
            WHERE fp.topic_id = ?
            ORDER BY fp.created_at ASC
        `).all(topicId);

        res.json({
            success: true,
            topic: topic,
            posts: posts
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * POST /api/forum/topic
 * Создать новую тему (только для авторизованных)
 */
router.post('/topic', auth, (req, res) => {
    try {
        const userId = req.user.userId;
        const { section, title, message } = req.body;

        if (!section || !SECTIONS[section]) {
            return res.status(400).json({ error: 'Выберите раздел' });
        }
        if (!title || title.trim().length < 3) {
            return res.status(400).json({ error: 'Название темы должно содержать минимум 3 символа' });
        }
        if (!message || message.trim().length < 10) {
            return res.status(400).json({ error: 'Сообщение должно содержать минимум 10 символов' });
        }

        // Используем транзакцию
        const transaction = db.transaction(() => {
            // Создаём тему
            const topicResult = db.prepare(`
                INSERT INTO forum_topics (section, title, author_id, views, last_post_date)
                VALUES (?, ?, ?, 1, datetime('now'))
            `).run(section, title, userId);

            // Добавляем первое сообщение
            db.prepare(`
                INSERT INTO forum_posts (topic_id, author_id, message)
                VALUES (?, ?, ?)
            `).run(topicResult.lastInsertRowid, userId, message);
        });

        transaction();

        res.status(201).json({
            success: true,
            message: 'Тема создана'
        });
    } catch (error) {
        console.error('Ошибка создания темы:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * POST /api/forum/topic/:topicId/reply
 * Ответить в теме (только для авторизованных)
 */
router.post('/topic/:topicId/reply', auth, (req, res) => {
    try {
        const topicId = parseInt(req.params.topicId);
        const userId = req.user.userId;
        const { message } = req.body;

        if (!message || message.trim().length < 2) {
            return res.status(400).json({ error: 'Сообщение слишком короткое' });
        }

        // Проверяем что тема существует
        const topic = db.prepare('SELECT id FROM forum_topics WHERE id = ?').get(topicId);
        if (!topic) {
            return res.status(404).json({ error: 'Тема не найдена' });
        }

        const transaction = db.transaction(() => {
            // Добавляем сообщение
            db.prepare(`
                INSERT INTO forum_posts (topic_id, author_id, message)
                VALUES (?, ?, ?)
            `).run(topicId, userId, message);

            // Обновляем дату последнего сообщения
            db.prepare(`
                UPDATE forum_topics SET last_post_date = datetime('now') WHERE id = ?
            `).run(topicId);
        });

        transaction();

        res.status(201).json({
            success: true,
            message: 'Ответ добавлен'
        });
    } catch (error) {
        console.error('Ошибка ответа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;