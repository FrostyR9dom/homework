/**
 * routes/users.js
 * 
 * НАЗНАЧЕНИЕ: Управление профилями пользователей.
 * 
 * API:
 * GET  /api/users/profile     - получить свой профиль
 * PUT  /api/users/profile     - обновить профиль
 * GET  /api/users/stats       - статистика автора (продажи, доход)
 * GET  /api/users/favorites   - избранные маршруты
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

/**
 * GET /api/users/profile
 * Получить профиль текущего пользователя
 * Требуется JWT токен
 */
router.get('/profile', auth, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, phone, first_name, last_name, city, bio, 
                   is_author, avatar_url, created_at
            FROM users WHERE id = ?
        `).get(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.first_name,
                lastName: user.last_name,
                city: user.city,
                bio: user.bio,
                isAuthor: user.is_author === 1,
                avatar: user.avatar_url,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * PUT /api/users/profile
 * Обновить профиль (имя, фамилия, город, био, статус автора)
 * Требуется JWT токен
 */
router.put('/profile', auth, (req, res) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName, city, bio, isAuthor } = req.body;

        db.prepare(`
            UPDATE users 
            SET first_name = ?, last_name = ?, city = ?, bio = ?, is_author = ?
            WHERE id = ?
        `).run(
            firstName || '',
            lastName || '',
            city || '',
            bio || '',
            isAuthor ? 1 : 0,
            userId
        );

        // Получаем обновлённого пользователя
        const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        res.json({
            success: true,
            message: 'Профиль обновлён',
            user: {
                id: updated.id,
                phone: updated.phone,
                firstName: updated.first_name,
                lastName: updated.last_name,
                city: updated.city,
                bio: updated.bio,
                isAuthor: updated.is_author === 1,
                avatar: updated.avatar_url
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/users/stats
 * Статистика для автора: продажи, доход, рейтинг
 * Требуется JWT токен
 */
router.get('/stats', auth, (req, res) => {
    try {
        const userId = req.user.userId;

        // Количество созданных маршрутов
        const routesCount = db.prepare(
            'SELECT COUNT(*) as count FROM routes WHERE author_id = ?'
        ).get(userId).count;

        // Общие продажи и доход
        const salesData = db.prepare(`
            SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(price), 0) as total_revenue,
                COALESCE(SUM(author_income), 0) as total_income,
                COALESCE(SUM(platform_commission), 0) as total_commission
            FROM purchases p
            JOIN routes r ON p.route_id = r.id
            WHERE r.author_id = ?
        `).get(userId);

        // Продажи за текущий месяц
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthSales = db.prepare(`
            SELECT COALESCE(SUM(author_income), 0) as month_income
            FROM purchases p
            JOIN routes r ON p.route_id = r.id
            WHERE r.author_id = ? AND p.purchase_date >= ?
        `).get(userId, monthStart.toISOString());

        // Средний рейтинг
        const ratingData = db.prepare(`
            SELECT 
                COALESCE(AVG(rating), 0) as avg_rating,
                COUNT(*) as review_count
            FROM reviews rev
            JOIN routes r ON rev.route_id = r.id
            WHERE r.author_id = ?
        `).get(userId);

        res.json({
            success: true,
            stats: {
                routesCount: routesCount,
                totalSales: salesData.total_sales,
                totalRevenue: salesData.total_revenue,
                totalIncome: salesData.total_income,
                platformCommission: salesData.total_commission,
                monthIncome: monthSales.month_income,
                availableForWithdrawal: salesData.total_income,
                avgRating: ratingData.avg_rating.toFixed(1),
                reviewCount: ratingData.review_count
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/users/favorites
 * Получить избранные маршруты пользователя
 * Требуется JWT токен
 */
router.get('/favorites', auth, (req, res) => {
    try {
        const userId = req.user.userId;

        const favorites = db.prepare(`
            SELECT 
                r.*,
                u.first_name || ' ' || u.last_name as author_name
            FROM favorites f
            JOIN routes r ON f.route_id = r.id
            JOIN users u ON r.author_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `).all(userId);

        res.json({ success: true, favorites: favorites });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;