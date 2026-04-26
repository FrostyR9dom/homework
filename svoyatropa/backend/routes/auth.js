/**
 * routes/auth.js
 * 
 * НАЗНАЧЕНИЕ: Регистрация и вход пользователей по номеру телефона.
 * 
 * КАК РАБОТАЕТ:
 * 1. Пользователь вводит номер телефона на сайте
 * 2. Фронтенд отправляет POST запрос на /api/auth/send-code
 * 3. Сервер создаёт 4-значный код и сохраняет в БД
 * 4. (В реальности) Отправляет SMS через SMS-шлюз
 * 5. (В демо) Возвращает код в ответе для тестирования
 * 6. Пользователь вводит код
 * 7. Фронтенд отправляет POST запрос на /api/auth/verify-code
 * 8. Сервер проверяет код и возвращает JWT токен
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

/**
 * Генерация случайного 4-значного кода
 * 
 * @returns {string} строка из 4 цифр (например "4829")
 */
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Создание JWT токена для пользователя
 * 
 * JWT (JSON Web Token) - это способ безопасно передавать информацию
 * между сервером и клиентом. Токен подписывается секретным ключом,
 * поэтому его нельзя подделать.
 * 
 * @param {Object} user - объект пользователя из БД
 * @returns {string} JWT токен (действует 30 дней)
 */
function generateToken(user) {
    return jwt.sign({
            userId: user.id,
            phone: user.phone
        },
        process.env.JWT_SECRET, { expiresIn: '30d' } // Токен действует 30 дней
    );
}

/**
 * POST /api/auth/send-code
 * 
 * Отправка кода подтверждения на телефон
 * 
 * ТЕЛО ЗАПРОСА:
 * { "phone": "+79001234567" }
 * 
 * ОТВЕТ:
 * { "success": true, "message": "Код отправлен", "code": "4829" } (демо)
 */
router.post('/send-code', (req, res) => {
    try {
        const { phone } = req.body;

        // Проверяем, что телефон указан
        if (!phone) {
            return res.status(400).json({ error: 'Введите номер телефона' });
        }

        // Очищаем телефон от лишних символов (оставляем только цифры и +)
        const cleanPhone = phone.replace(/[^0-9+]/g, '');

        // Проверяем что телефон похож на российский номер
        if (cleanPhone.length < 11) {
            return res.status(400).json({ error: 'Введите полный номер телефона' });
        }

        // Генерируем код подтверждения
        const code = generateCode();

        /**
         * Время истечения кода: текущее время + 5 минут
         * 
         * В JavaScript даты хранятся в миллисекундах от 1970 года.
         * 5 минут = 5 * 60 * 1000 = 300000 миллисекунд
         */
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        /**
         * Сохраняем код в базу данных
         * 
         * Параметризованный запрос (?) защищает от SQL-инъекций
         */
        db.prepare(
            'INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?)'
        ).run(cleanPhone, code, expiresAt);

        console.log(`📱 Отправлен код ${code} на номер ${cleanPhone}`);

        /**
         * В демо-режиме возвращаем код в ответе
         * В продакшене код НЕ должен возвращаться клиенту!
         * Вместо этого нужно отправить SMS через специальный сервис.
         */
        res.json({
            success: true,
            message: 'Код отправлен на телефон',
            code: code, // Только для демо!
            expiresIn: 300 // секунд
        });

    } catch (error) {
        console.error('Ошибка отправки кода:', error);
        res.status(500).json({ error: 'Ошибка сервера при отправке кода' });
    }
});

/**
 * POST /api/auth/verify-code
 * 
 * Проверка кода и вход/регистрация
 * 
 * ТЕЛО ЗАПРОСА:
 * { "phone": "+79001234567", "code": "4829" }
 * 
 * ОТВЕТ:
 * { "success": true, "token": "jwt_token_here", "user": { ... } }
 */
router.post('/verify-code', (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: 'Введите телефон и код' });
        }

        const cleanPhone = phone.replace(/[^0-9+]/g, '');

        /**
         * Ищем действительный код в базе данных
         * 
         * Условия поиска:
         * 1. Телефон совпадает
         * 2. Код совпадает
         * 3. Код ещё не использован (used = 0)
         * 4. Время не истекло (expires_at > сейчас)
         */
        const validCode = db.prepare(`
            SELECT * FROM sms_codes 
            WHERE phone = ? 
              AND code = ? 
              AND used = 0 
              AND expires_at > datetime('now')
            ORDER BY created_at DESC 
            LIMIT 1
        `).get(cleanPhone, code);

        if (!validCode) {
            return res.status(400).json({ error: 'Неверный или истекший код' });
        }

        // Помечаем код как использованный
        db.prepare('UPDATE sms_codes SET used = 1 WHERE id = ?').run(validCode.id);

        /**
         * Ищем пользователя по телефону
         * Если не находим - создаём нового
         */
        let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);

        if (!user) {
            /**
             * Регистрируем нового пользователя
             * 
             * INSERT INTO - добавляет новую запись в таблицу
             * Возвращаем id созданной записи через result.lastInsertRowid
             */
            const result = db.prepare(
                'INSERT INTO users (phone) VALUES (?)'
            ).run(cleanPhone);

            /**
             * Получаем свежесозданного пользователя
             * Это нужно чтобы узнать его id и другие поля
             */
            user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

            console.log(`👤 Зарегистрирован новый пользователь: ${cleanPhone}`);
        }

        // Создаём JWT токен
        const token = generateToken(user);

        console.log(`✅ Пользователь ${cleanPhone} вошёл в систему`);

        /**
         * Возвращаем ответ клиенту
         * 
         * token: нужен для всех последующих запросов к API
         * user: данные пользователя для отображения в интерфейсе
         */
        res.json({
            success: true,
            token: token,
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
        console.error('Ошибка проверки кода:', error);
        res.status(500).json({ error: 'Ошибка сервера при проверке кода' });
    }
});

/**
 * POST /api/auth/update-profile
 * 
 * Обновление профиля пользователя
 * Требует JWT токен в заголовке Authorization
 */
router.post('/update-profile', require('../middleware/auth'), (req, res) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName, city, bio, isAuthor } = req.body;

        db.prepare(`
            UPDATE users 
            SET first_name = ?, 
                last_name = ?, 
                city = ?, 
                bio = ?, 
                is_author = ?
            WHERE id = ?
        `).run(
            firstName || '',
            lastName || '',
            city || '',
            bio || '',
            isAuthor ? 1 : 0,
            userId
        );

        const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                phone: updatedUser.phone,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                city: updatedUser.city,
                bio: updatedUser.bio,
                isAuthor: updatedUser.is_author === 1,
                avatar: updatedUser.avatar_url
            }
        });

    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/auth/me
 * 
 * Получение данных текущего пользователя
 * Требует JWT токен
 */
router.get('/me', require('../middleware/auth'), (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({
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

module.exports = router;