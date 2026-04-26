/**
 * routes/routes.js
 * 
 * НАЗНАЧЕНИЕ: Все операции с туристическими маршрутами.
 * 
 * API МАРШРУТЫ:
 * GET    /api/routes          - получить все маршруты (с фильтрацией)
 * GET    /api/routes/:id      - получить один маршрут
 * POST   /api/routes          - создать новый маршрут (только для авторов)
 * PUT    /api/routes/:id      - обновить маршрут (только автор)
 * DELETE /api/routes/:id      - удалить маршрут (только автор)
 * POST   /api/routes/:id/buy  - купить маршрут
 * GET    /api/routes/my       - мои созданные маршруты
 * GET    /api/routes/purchased - мои купленные маршруты
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// ============================================================
// ПОЛУЧИТЬ ВСЕ МАРШРУТЫ (с фильтрацией)
// ============================================================

/**
 * GET /api/routes
 * 
 * ПАРАМЕТРЫ ЗАПРОСА (query string):
 * ?type=hike        - фильтр по типу
 * ?region=krasnodar - фильтр по региону
 * ?sort=newest      - сортировка (newest, popular, price_asc, price_desc)
 * ?page=1           - номер страницы
 * ?limit=12         - сколько маршрутов на странице
 * 
 * ПРИМЕР: /api/routes?type=hike&region=krasnodar&sort=newest&page=1
 */
router.get('/', (req, res) => {
    try {
        // Получаем параметры из URL
        const {
            type, // Тип маршрута (hike, bike, car...)
            region, // Регион (krasnodar, altai...)
            sort = 'newest', // Сортировка по умолчанию - новые
            page = 1, // Первая страница по умолчанию
            limit = 12 // 12 маршрутов на странице
        } = req.query;

        // Переводим в числа (защита от некорректных значений)
        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 12, 50); // Максимум 50
        const offset = (pageNum - 1) * limitNum;

        /**
         * Строим SQL запрос динамически в зависимости от фильтров
         * 
         * Базовая часть запроса:
         * JOIN с таблицей users чтобы получить имя автора
         * WHERE 1=1 - хитрость чтобы удобно добавлять условия через AND
         */
        let sql = `
            SELECT 
                r.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.avatar_url as author_avatar
            FROM routes r
            JOIN users u ON r.author_id = u.id
            WHERE r.is_approved = 1
        `;
        const params = [];

        // Добавляем фильтр по типу если указан
        if (type && type !== 'all') {
            sql += ' AND r.type = ?';
            params.push(type);
        }

        // Добавляем фильтр по региону если указан
        if (region && region !== 'all') {
            sql += ' AND r.region = ?';
            params.push(region);
        }

        // Добавляем сортировку
        switch (sort) {
            case 'popular':
                sql += ' ORDER BY r.sales DESC';
                break;
            case 'price_asc':
                sql += ' ORDER BY r.price ASC';
                break;
            case 'price_desc':
                sql += ' ORDER BY r.price DESC';
                break;
            case 'rating':
                sql += ' ORDER BY r.rating DESC';
                break;
            case 'newest':
            default:
                sql += ' ORDER BY r.created_at DESC';
                break;
        }

        // Сначала считаем общее количество (для пагинации)
        const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const countResult = db.prepare(countSql).get(...params);
        const total = countResult.total;

        // Добавляем пагинацию к основному запросу
        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        // Выполняем запрос
        const routes = db.prepare(sql).all(...params);

        /**
         * Обрабатываем каждую запись перед отправкой:
         * - Парсим JSON поля (equipment, seasons, photos)
         * - Добавляем regionName (человеческое название региона)
         */
        const regionNames = {
            'krasnodar': 'Краснодарский край',
            'adygea': 'Адыгея',
            'rostov': 'Ростовская область',
            'kch': 'Карачаево-Черкесия',
            'crimea': 'Крым',
            'moscow': 'Московская область',
            'spb': 'Ленинградская область',
            'kareliya': 'Карелия',
            'altai': 'Алтайский край',
            'urals': 'Урал',
            'siberia': 'Сибирь',
            'baikal': 'Байкальский регион',
            'volga': 'Поволжье',
            'caucasus': 'Северный Кавказ',
            'far-east': 'Дальний Восток'
        };

        const processedRoutes = routes.map(route => ({
            id: route.id,
            title: route.title,
            type: route.type,
            region: route.region,
            regionName: regionNames[route.region] || route.region,
            location: route.location,
            description: route.description,
            fullDescription: route.full_description,
            startPoint: route.start_point,
            endPoint: route.end_point,
            distance: route.distance,
            elevation: route.elevation,
            duration: route.duration,
            bestStartTime: route.best_start_time,
            difficulty: route.difficulty,
            // Парсим JSON строки в массивы
            equipment: JSON.parse(route.equipment || '[]'),
            seasons: JSON.parse(route.seasons || '[]'),
            photos: JSON.parse(route.photos || '[]'),
            recommendations: route.recommendations,
            additionalTips: route.additional_tips,
            minAge: route.min_age,
            maxParticipants: route.max_participants,
            price: route.price,
            gpxFileName: route.gpx_file,
            sales: route.sales,
            views: route.views,
            rating: route.review_count > 0 ? (route.rating / route.review_count).toFixed(1) : '0.0',
            reviewCount: route.review_count,
            author: {
                id: route.author_id,
                name: route.author_name || 'Аноним',
                avatar: route.author_avatar,
                rating: '5.0' // В будущем можно добавить рейтинг авторов
            },
            createdAt: route.created_at
        }));

        // Возвращаем ответ
        res.json({
            success: true,
            routes: processedRoutes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Ошибка получения маршрутов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================================
// ПОЛУЧИТЬ ОДИН МАРШРУТ ПО ID
// ============================================================

/**
 * GET /api/routes/:id
 * 
 * :id - это динамический параметр, подставляется из URL
 * Например: /api/routes/42 - получит маршрут с id=42
 */
router.get('/:id', (req, res) => {
    try {
        const routeId = parseInt(req.params.id);

        if (isNaN(routeId)) {
            return res.status(400).json({ error: 'Некорректный ID маршрута' });
        }

        // Получаем маршрут из БД вместе с данными автора
        const route = db.prepare(`
            SELECT 
                r.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.avatar_url as author_avatar,
                u.bio as author_bio
            FROM routes r
            JOIN users u ON r.author_id = u.id
            WHERE r.id = ?
        `).get(routeId);

        if (!route) {
            return res.status(404).json({ error: 'Маршрут не найден' });
        }

        // Увеличиваем счётчик просмотров
        db.prepare('UPDATE routes SET views = views + 1 WHERE id = ?').run(routeId);

        // Получаем отзывы на этот маршрут
        const reviews = db.prepare(`
            SELECT 
                rev.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.avatar_url as author_avatar
            FROM reviews rev
            JOIN users u ON rev.user_id = u.id
            WHERE rev.route_id = ?
            ORDER BY rev.created_at DESC
            LIMIT 20
        `).all(routeId);

        // Обрабатываем данные маршрута
        const processedRoute = {
            id: route.id,
            title: route.title,
            type: route.type,
            region: route.region,
            location: route.location,
            description: route.description,
            fullDescription: route.full_description,
            startPoint: route.start_point,
            endPoint: route.end_point,
            distance: route.distance,
            elevation: route.elevation,
            duration: route.duration,
            bestStartTime: route.best_start_time,
            difficulty: route.difficulty,
            equipment: JSON.parse(route.equipment || '[]'),
            seasons: JSON.parse(route.seasons || '[]'),
            photos: JSON.parse(route.photos || '[]'),
            recommendations: route.recommendations,
            additionalTips: route.additional_tips,
            minAge: route.min_age,
            maxParticipants: route.max_participants,
            price: route.price,
            gpxFileName: route.gpx_file,
            sales: route.sales,
            views: route.views + 1,
            rating: route.review_count > 0 ? (route.rating / route.review_count).toFixed(1) : '0.0',
            reviewCount: route.review_count,
            author: {
                id: route.author_id,
                name: route.author_name || 'Аноним',
                avatar: route.author_avatar,
                bio: route.author_bio || 'Путешественник',
                rating: '5.0'
            },
            createdAt: route.created_at
        };

        // Обрабатываем отзывы
        const processedReviews = reviews.map(rev => ({
            id: rev.id,
            author: rev.author_name || 'Аноним',
            avatar: rev.author_avatar,
            rating: rev.rating,
            text: rev.text,
            date: new Date(rev.created_at).toLocaleDateString('ru-RU')
        }));

        res.json({
            success: true,
            route: processedRoute,
            reviews: processedReviews
        });

    } catch (error) {
        console.error('Ошибка получения маршрута:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================================
// СОЗДАТЬ НОВЫЙ МАРШРУТ (только для авторов)
// ============================================================

/**
 * POST /api/routes
 * 
 * ТЕЛО ЗАПРОСА:
 * {
 *   "title": "Поход к водопадам",
 *   "type": "hike",
 *   "region": "krasnodar",
 *   "price": 299,
 *   ... и другие поля
 * }
 * 
 * Требуется JWT токен в заголовке Authorization
 */
router.post('/', auth, (req, res) => {
    try {
        const userId = req.user.userId;

        // Получаем пользователя из БД
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        // Проверяем что пользователь - автор
        if (!user || user.is_author !== 1) {
            return res.status(403).json({
                error: 'Только авторы могут создавать маршруты. Включите статус автора в настройках.'
            });
        }

        // Извлекаем данные из тела запроса
        const {
            title,
            type = 'hike',
            region = 'krasnodar',
            location = '',
            description = '',
            fullDescription = '',
            startPoint = '',
            endPoint = '',
            distance = '',
            elevation = '',
            duration = '',
            bestStartTime = '',
            difficulty = 'medium',
            equipment = [],
            recommendations = '',
            seasons = [],
            minAge = 0,
            maxParticipants = 0,
            additionalTips = '',
            price = 299,
            photos = [],
            gpxFileName = ''
        } = req.body;

        // Проверяем обязательные поля
        if (!title || title.trim().length < 3) {
            return res.status(400).json({ error: 'Название маршрута должно содержать минимум 3 символа' });
        }

        if (price < 99) {
            return res.status(400).json({ error: 'Минимальная цена - 99 ₽' });
        }

        // Сохраняем маршрут в БД
        const result = db.prepare(`
            INSERT INTO routes (
                author_id, title, type, region, location,
                description, full_description, start_point, end_point,
                distance, elevation, duration, best_start_time,
                difficulty, equipment, recommendations, seasons,
                min_age, max_participants, additional_tips,
                price, photos, gpx_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            userId, title, type, region, location,
            description, fullDescription, startPoint, endPoint,
            distance, elevation, duration, bestStartTime,
            difficulty, JSON.stringify(equipment), recommendations, JSON.stringify(seasons),
            minAge, maxParticipants, additionalTips,
            price, JSON.stringify(photos), gpxFileName
        );

        // Рассчитываем доход автора (70% от цены)
        const authorIncome = Math.round(price * 0.7);

        console.log(`✅ Создан новый маршрут #${result.lastInsertRowid}: "${title}"`);

        // Возвращаем созданный маршрут
        res.status(201).json({
            success: true,
            message: `Маршрут "${title}" успешно создан и отправлен на модерацию`,
            route: {
                id: result.lastInsertRowid,
                title: title,
                price: price,
                authorIncome: authorIncome
            }
        });

    } catch (error) {
        console.error('Ошибка создания маршрута:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании маршрута' });
    }
});

// ============================================================
// ОБНОВИТЬ МАРШРУТ (только автор)
// ============================================================
router.put('/:id', auth, (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user.userId;

        // Проверяем что маршрут существует и принадлежит пользователю
        const route = db.prepare('SELECT * FROM routes WHERE id = ? AND author_id = ?').get(routeId, userId);

        if (!route) {
            return res.status(404).json({ error: 'Маршрут не найден или у вас нет прав на его редактирование' });
        }

        // Обновляем поля
        const updates = req.body;
        const fields = [];
        const values = [];

        // Маппинг названий полей из фронтенда в поля БД
        const fieldMap = {
            title: 'title',
            type: 'type',
            region: 'region',
            location: 'location',
            description: 'description',
            fullDescription: 'full_description',
            startPoint: 'start_point',
            endPoint: 'end_point',
            distance: 'distance',
            elevation: 'elevation',
            duration: 'duration',
            bestStartTime: 'best_start_time',
            difficulty: 'difficulty',
            recommendations: 'recommendations',
            additionalTips: 'additional_tips',
            minAge: 'min_age',
            maxParticipants: 'max_participants',
            price: 'price',
            gpxFileName: 'gpx_file'
        };

        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (updates[key] !== undefined) {
                fields.push(`${dbField} = ?`);
                values.push(updates[key]);
            }
        }

        // JSON поля требуют сериализации
        if (updates.equipment !== undefined) {
            fields.push('equipment = ?');
            values.push(JSON.stringify(updates.equipment));
        }
        if (updates.seasons !== undefined) {
            fields.push('seasons = ?');
            values.push(JSON.stringify(updates.seasons));
        }
        if (updates.photos !== undefined) {
            fields.push('photos = ?');
            values.push(JSON.stringify(updates.photos));
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        values.push(routeId);
        db.prepare(`UPDATE routes SET ${fields.join(', ')} WHERE id = ?`).run(...values);

        res.json({ success: true, message: 'Маршрут успешно обновлён' });

    } catch (error) {
        console.error('Ошибка обновления маршрута:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================================
// УДАЛИТЬ МАРШРУТ (только автор)
// ============================================================
router.delete('/:id', auth, (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user.userId;

        const route = db.prepare('SELECT * FROM routes WHERE id = ? AND author_id = ?').get(routeId, userId);

        if (!route) {
            return res.status(404).json({ error: 'Маршрут не найден' });
        }

        db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);

        res.json({ success: true, message: 'Маршрут удалён' });

    } catch (error) {
        console.error('Ошибка удаления маршрута:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================================
// КУПИТЬ МАРШРУТ
// ============================================================
router.post('/:id/buy', auth, (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user.userId;

        // Проверяем что маршрут существует
        const route = db.prepare('SELECT * FROM routes WHERE id = ? AND is_approved = 1').get(routeId);

        if (!route) {
            return res.status(404).json({ error: 'Маршрут не найден' });
        }

        // Проверяем что пользователь не купил этот маршрут раньше
        const existingPurchase = db.prepare(
            'SELECT id FROM purchases WHERE user_id = ? AND route_id = ?'
        ).get(userId, routeId);

        if (existingPurchase) {
            return res.status(400).json({ error: 'Вы уже купили этот маршрут' });
        }

        // Рассчитываем комиссию (30% платформе, 70% автору)
        const price = route.price;
        const commission = Math.round(price * 0.3);
        const authorIncome = price - commission;

        /**
         * Используем транзакцию чтобы обеспечить целостность данных
         * Если что-то пойдёт не так - все изменения откатятся
         */
        const transaction = db.transaction(() => {
            // Записываем покупку
            db.prepare(`
                INSERT INTO purchases (user_id, route_id, price, author_income, platform_commission)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId, routeId, price, authorIncome, commission);

            // Увеличиваем счётчик продаж маршрута
            db.prepare('UPDATE routes SET sales = sales + 1 WHERE id = ?').run(routeId);
        });

        transaction();

        console.log(`💰 Продажа: маршрут #${routeId} куплен пользователем #${userId} за ${price}₽`);

        res.json({
            success: true,
            message: 'Маршрут успешно куплен!',
            download: {
                gpxFile: route.gpx_file,
                photos: JSON.parse(route.photos || '[]')
            }
        });

    } catch (error) {
        console.error('Ошибка покупки маршрута:', error);
        res.status(500).json({ error: 'Ошибка сервера при покупке' });
    }
});

// ============================================================
// МОИ СОЗДАННЫЕ МАРШРУТЫ
// ============================================================
router.get('/my/created', auth, (req, res) => {
    try {
        const userId = req.user.userId;

        const routes = db.prepare(`
            SELECT * FROM routes 
            WHERE author_id = ? 
            ORDER BY created_at DESC
        `).all(userId);

        res.json({ success: true, routes: routes });

    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================================
// МОИ КУПЛЕННЫЕ МАРШРУТЫ
// ============================================================
router.get('/my/purchased', auth, (req, res) => {
    try {
        const userId = req.user.userId;

        const purchases = db.prepare(`
            SELECT 
                p.*,
                r.title as route_title,
                r.photos as route_photos,
                r.gpx_file as route_gpx,
                u.first_name || ' ' || u.last_name as author_name
            FROM purchases p
            JOIN routes r ON p.route_id = r.id
            JOIN users u ON r.author_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.purchase_date DESC
        `).all(userId);

        res.json({ success: true, purchases: purchases });

    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================================
// ДОБАВИТЬ В ИЗБРАННОЕ
// ============================================================
router.post('/:id/favorite', auth, (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user.userId;

        // Проверяем что маршрут существует
        const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId);
        if (!route) {
            return res.status(404).json({ error: 'Маршрут не найден' });
        }

        // Проверяем не добавлен ли уже в избранное
        const existing = db.prepare(
            'SELECT id FROM favorites WHERE user_id = ? AND route_id = ?'
        ).get(userId, routeId);

        if (existing) {
            // Удаляем из избранного
            db.prepare('DELETE FROM favorites WHERE user_id = ? AND route_id = ?').run(userId, routeId);
            return res.json({ success: true, favorited: false, message: 'Удалено из избранного' });
        } else {
            // Добавляем в избранное
            db.prepare('INSERT INTO favorites (user_id, route_id) VALUES (?, ?)').run(userId, routeId);
            return res.json({ success: true, favorited: true, message: 'Добавлено в избранное' });
        }

    } catch (error) {
        console.error('Ошибка избранного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;