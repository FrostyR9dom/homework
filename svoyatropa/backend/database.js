/**
 * database.js
 * 
 * НАЗНАЧЕНИЕ: Подключение к базе данных SQLite и создание всех таблиц.
 * 
 * Используем SQLite (через better-sqlite3), потому что:
 * 1. Не требует установки отдельного сервера БД
 * 2. База данных - это один файл (удобно для разработки)
 * 3. При росте проекта легко заменить на PostgreSQL
 */

// Подключаем библиотеку для работы с SQLite
const Database = require('better-sqlite3');
// Подключаем библиотеку для работы с путями файлов
const path = require('path');

/**
 * Создаём или открываем базу данных
 * Если файла нет - он создастся автоматически
 */
const db = new Database(
    path.join(__dirname, 'database.sqlite'), { verbose: console.log } // Выводим все SQL запросы в консоль для отладки
);

/**
 * Включаем поддержку внешних ключей (WAL mode)
 * Это нужно чтобы работали связи между таблицами
 */
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// СОЗДАНИЕ ТАБЛИЦ
// ============================================================

/**
 * Таблица users - пользователи сайта
 * 
 * ПОЛЯ:
 * - id: уникальный номер пользователя (автоинкремент)
 * - phone: номер телефона (уникальный, обязательный)
 * - first_name: имя пользователя
 * - last_name: фамилия пользователя
 * - city: город проживания
 * - bio: краткая информация "О себе"
 * - is_author: может ли создавать маршруты (true/false)
 * - avatar_url: путь к аватарке
 * - created_at: дата регистрации
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        city TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        is_author INTEGER DEFAULT 0,
        avatar_url TEXT DEFAULT '/img/avatars/default-avatar.png',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/**
 * Таблица sms_codes - коды подтверждения
 * 
 * Когда пользователь запрашивает вход, мы создаём код
 * и сохраняем его здесь. Код действует 5 минут.
 * 
 * ПОЛЯ:
 * - id: уникальный номер
 * - phone: номер телефона
 * - code: 4-значный код
 * - expires_at: когда код истекает (через 5 минут)
 * - used: был ли код использован
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS sms_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/**
 * Таблица routes - туристические маршруты
 * 
 * ПОЛЯ:
 * - id: уникальный номер маршрута
 * - author_id: кто создал (связь с таблицей users)
 * - title: название маршрута
 * - type: тип (hike, bike, car, water и т.д.)
 * - region: регион (krasnodar, altai и т.д.)
 * - location: ближайший город
 * - description: краткое описание
 * - full_description: полное описание
 * - start_point: точка старта
 * - end_point: точка финиша
 * - distance: протяжённость в км
 * - elevation: набор высоты
 * - duration: время прохождения
 * - best_start_time: лучшее время выхода
 * - difficulty: сложность (easy, medium, hard)
 * - equipment: экипировка (JSON массив)
 * - recommendations: рекомендации (JSON массив)
 * - seasons: сезоны (JSON массив)
 * - min_age: минимальный возраст
 * - max_participants: максимальное количество участников
 * - additional_tips: дополнительные советы
 * - price: цена в рублях
 * - photos: фотографии (JSON массив с путями)
 * - gpx_file: путь к GPX файлу
 * - sales: количество продаж
 * - views: количество просмотров
 * - rating: суммарный рейтинг
 * - review_count: количество отзывов
 * - is_approved: прошёл ли модерацию
 * - created_at: дата создания
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        type TEXT DEFAULT 'hike',
        region TEXT DEFAULT 'krasnodar',
        location TEXT DEFAULT '',
        description TEXT DEFAULT '',
        full_description TEXT DEFAULT '',
        start_point TEXT DEFAULT '',
        end_point TEXT DEFAULT '',
        distance TEXT DEFAULT '',
        elevation TEXT DEFAULT '',
        duration TEXT DEFAULT '',
        best_start_time TEXT DEFAULT '',
        difficulty TEXT DEFAULT 'medium',
        equipment TEXT DEFAULT '[]',
        recommendations TEXT DEFAULT '',
        seasons TEXT DEFAULT '[]',
        min_age INTEGER DEFAULT 0,
        max_participants INTEGER DEFAULT 0,
        additional_tips TEXT DEFAULT '',
        price INTEGER DEFAULT 299,
        photos TEXT DEFAULT '[]',
        gpx_file TEXT DEFAULT '',
        sales INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        is_approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

/**
 * Таблица purchases - покупки маршрутов
 * 
 * ПОЛЯ:
 * - id: уникальный номер покупки
 * - user_id: кто купил
 * - route_id: что купил
 * - price: цена покупки
 * - author_income: доход автора (после комиссии)
 * - platform_commission: комиссия платформы
 * - purchase_date: дата покупки
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        price INTEGER NOT NULL,
        author_income INTEGER NOT NULL,
        platform_commission INTEGER NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    )
`);

/**
 * Таблица reviews - отзывы на маршруты
 * 
 * ПОЛЯ:
 * - id: уникальный номер отзыва
 * - route_id: на какой маршрут отзыв
 * - user_id: кто оставил отзыв
 * - rating: оценка (1-5)
 * - text: текст отзыва
 * - created_at: дата создания
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        text TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

/**
 * Таблица gallery - фотографии в галерее
 * 
 * ПОЛЯ:
 * - id: уникальный номер фото
 * - user_id: кто загрузил
 * - photo_url: путь к файлу
 * - rating: суммарный рейтинг
 * - votes: количество голосов
 * - created_at: дата загрузки
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        votes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

/**
 * Таблица forum_topics - темы на форуме
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS forum_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,
        title TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        views INTEGER DEFAULT 0,
        last_post_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
    )
`);

/**
 * Таблица forum_posts - сообщения в темах форума
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS forum_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)
    )
`);

/**
 * Таблица favorites - избранные маршруты пользователей
 */
db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (route_id) REFERENCES routes(id),
        UNIQUE(user_id, route_id)
    )
`);

console.log('✅ База данных инициализирована успешно');

// Экспортируем объект базы данных для использования в других файлах
module.exports = db;