/**
 * middleware/auth.js
 * 
 * НАЗНАЧЕНИЕ: Проверка JWT токена для защиты API маршрутов
 * 
 * КАК ЭТО РАБОТАЕТ:
 * 1. Клиент отправляет запрос с заголовком: Authorization: Bearer <токен>
 * 2. Middleware извлекает токен
 * 3. Проверяет его подлинность с помощью секретного ключа
 * 4. Если токен валидный - добавляет данные пользователя в объект запроса
 * 5. Если токен невалидный - возвращает ошибку 401
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * router.get('/защищённый-маршрут', auth, (req, res) => {
 *     // req.user.userId содержит ID авторизованного пользователя
 * });
 */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        /**
         * Получаем заголовок Authorization
         * 
         * Формат заголовка: "Bearer eyJhbGciOiJIUzI1NiIs..."
         * Нам нужна только вторая часть (после пробела)
         */
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        // Разделяем строку "Bearer xxx" на две части
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ error: 'Неверный формат токена' });
        }

        const token = parts[1];

        /**
         * Проверяем токен
         * 
         * jwt.verify расшифровывает токен с помощью секретного ключа.
         * Если токен подделан или истёк - будет выброшена ошибка.
         */
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        /**
         * Добавляем данные пользователя в объект запроса
         * 
         * Теперь в обработчике маршрута можно использовать:
         * req.user.userId - ID пользователя
         * req.user.phone - телефон пользователя
         */
        req.user = decoded;

        // Передаём управление следующему обработчику
        next();

    } catch (error) {
        /**
         * Возможные ошибки:
         * - TokenExpiredError: токен истёк
         * - JsonWebTokenError: токен подделан или повреждён
         */
        return res.status(401).json({ error: 'Недействительный или истекший токен' });
    }
}

module.exports = authMiddleware;