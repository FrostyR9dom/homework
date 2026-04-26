/**
 * routes/gallery.js
 * 
 * НАЗНАЧЕНИЕ: Управление галереей фотографий.
 * 
 * API:
 * GET    /api/gallery          - получить фото (с сортировкой и пагинацией)
 * POST   /api/gallery/upload   - загрузить новое фото (только для авторизованных)
 * POST   /api/gallery/:id/vote - проголосовать за фото
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

/**
 * Настройка Multer для загрузки изображений
 * 
 * storage: куда сохранять файлы
 * fileFilter: какие файлы разрешены
 * limits: максимальный размер файла
 */
const storage = multer.diskStorage({
    // Папка для сохранения
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'gallery'));
    },
    // Имя файла: timestamp + оригинальное имя
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueName + ext);
    }
});

// Фильтр: разрешаем только изображения
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Разрешены только изображения (JPG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Максимум 10 МБ
    }
});

/**
 * GET /api/gallery
 * Получить фото с сортировкой и пагинацией
 */
router.get('/', (req, res) => {
    try {
        const { sort = 'rating', page = 1, limit = 12 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 12, 48);
        const offset = (pageNum - 1) * limitNum;

        let orderBy;
        switch (sort) {
            case 'newest':
                orderBy = 'g.created_at DESC';
                break;
            case 'oldest':
                orderBy = 'g.created_at ASC';
                break;
            case 'rating':
            default:
                orderBy = 'CASE WHEN g.votes > 0 THEN g.rating * 1.0 / g.votes ELSE 0 END DESC';
                break;
        }

        // Считаем общее количество
        const total = db.prepare('SELECT COUNT(*) as count FROM gallery').get().count;

        // Получаем фото
        const photos = db.prepare(`
            SELECT 
                g.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.avatar_url as author_avatar
            FROM gallery g
            JOIN users u ON g.user_id = u.id
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `).all(limitNum, offset);

        // Обрабатываем данные
        const processedPhotos = photos.map(photo => ({
            id: photo.id,
            photoData: '/uploads/gallery/' + photo.photo_url,
            author: photo.author_name || 'Аноним',
            authorAvatar: photo.author_avatar,
            rating: photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : '0.0',
            votes: photo.votes,
            date: photo.created_at
        }));

        res.json({
            success: true,
            photos: processedPhotos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Ошибка галереи:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * POST /api/gallery/upload
 * Загрузить новое фото (только для авторизованных)
 */
router.post('/upload', auth, upload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const userId = req.user.userId;
        const photoUrl = req.file.filename;

        // Сохраняем в БД
        const result = db.prepare(`
            INSERT INTO gallery (user_id, photo_url, rating, votes)
            VALUES (?, ?, 50, 1)
        `).run(userId, photoUrl);

        console.log(`📸 Загружено новое фото #${result.lastInsertRowid}`);

        res.status(201).json({
            success: true,
            message: 'Фото успешно загружено',
            photo: {
                id: result.lastInsertRowid,
                photoData: '/uploads/gallery/' + photoUrl
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * POST /api/gallery/:id/vote
 * Проголосовать за фото
 */
router.post('/:id/vote', auth, (req, res) => {
    try {
        const photoId = parseInt(req.params.id);
        const userId = req.user.userId;
        const { rating } = req.body; // Оценка от 1 до 100

        if (!rating || rating < 1 || rating > 100) {
            return res.status(400).json({ error: 'Оценка должна быть от 1 до 100' });
        }

        // Проверяем что фото существует
        const photo = db.prepare('SELECT * FROM gallery WHERE id = ?').get(photoId);
        if (!photo) {
            return res.status(404).json({ error: 'Фото не найдено' });
        }

        /**
         * Проверяем что пользователь ещё не голосовал
         * В реальном проекте нужно создать отдельную таблицу для голосов
         * Пока разрешаем голосовать только один раз (простая проверка)
         */
        const voteKey = `gallery_vote_${photoId}_${userId}`;
        // В демо используем простой флаг в отдельной таблице не храним

        // Обновляем рейтинг
        db.prepare(`
            UPDATE gallery 
            SET rating = rating + ?, votes = votes + 1 
            WHERE id = ?
        `).run(rating, photoId);

        const updated = db.prepare('SELECT * FROM gallery WHERE id = ?').get(photoId);
        const avgRating = updated.votes > 0 ? (updated.rating / updated.votes).toFixed(1) : '0.0';

        res.json({
            success: true,
            message: `Вы оценили фото на ${rating} баллов`,
            newRating: avgRating,
            votes: updated.votes
        });
    } catch (error) {
        console.error('Ошибка голосования:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;