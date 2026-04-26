/**
 * middleware/upload.js
 * 
 * НАЗНАЧЕНИЕ: Настройка загрузки файлов через Multer.
 * Используется для загрузки фото маршрутов и GPX файлов.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Создаём папки для загрузки если их нет
 */
const uploadDirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'photos'),
    path.join(__dirname, '..', 'uploads', 'gallery'),
    path.join(__dirname, '..', 'uploads', 'gpx'),
    path.join(__dirname, '..', 'uploads', 'avatars')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Создана папка: ${dir}`);
    }
});

/**
 * Настройка для загрузки фото маршрутов
 * Принимает до 10 файлов
 */
const photoUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads', 'photos'));
        },
        filename: function(req, file, cb) {
            const uniqueName = 'route-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, uniqueName + ext);
        }
    }),
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 МБ на файл
    }
});

/**
 * Настройка для загрузки GPX файлов
 * Принимает только один файл
 */
const gpxUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads', 'gpx'));
        },
        filename: function(req, file, cb) {
            const uniqueName = 'track-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, uniqueName + ext);
        }
    }),
    fileFilter: function(req, file, cb) {
        const allowedExtensions = ['.gpx', '.kml', '.geojson'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только GPX, KML и GeoJSON файлы'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 МБ
    }
});

/**
 * Настройка для загрузки аватаров
 */
const avatarUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
        },
        filename: function(req, file, cb) {
            const uniqueName = 'avatar-' + Date.now();
            const ext = path.extname(file.originalname);
            cb(null, uniqueName + ext);
        }
    }),
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только JPG, PNG и WebP'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2 МБ
    }
});

module.exports = {
    photoUpload,
    gpxUpload,
    avatarUpload
};