/**
 * filters.js - Фильтрация и отображение маршрутов
 */

// Функция для экранирования HTML (защита от XSS)
function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Демо-маршруты убраны - сайт для реального наполнения

function getAllRoutes() {
    var routesJson = localStorage.getItem('yatyrist_routes');
    var routes = routesJson ? JSON.parse(routesJson) : [];

    // Если маршрутов нет, добавляем демо для тестирования
    if (routes.length === 0) {
        routes = [{
                id: 'demo1',
                title: 'Поход к горе Эльбрус',
                description: 'Классический маршрут к высшей точке Европы',
                type: 'hike',
                region: 'krasnodar',
                price: 15000,
                duration: '7 дней',
                distance: '50 км',
                author: { name: 'Алексей', rating: '4.8' },
                photos: []
            },
            {
                id: 'demo2',
                title: 'Велопрогулка по Черноморскому побережью',
                description: 'Легкий маршрут для любителей велосипеда',
                type: 'bike',
                region: 'crimea',
                price: 5000,
                duration: '3 дня',
                distance: '100 км',
                author: { name: 'Мария', rating: '4.9' },
                photos: []
            }
        ];
        localStorage.setItem('yatyrist_routes', JSON.stringify(routes));
    }

    return routes;
}

function cleanDemoRoutes() {
    var allRoutes = getAllRoutes();
    var demoAuthors = ['анна', 'сергей', 'марат', 'руслан'];
    var filteredRoutes = allRoutes.filter(function(route) {
        if (!route.author || !route.author.name) return true;
        var authorName = route.author.name.toString().toLowerCase();
        return !demoAuthors.some(function(demoName) {
            return authorName.indexOf(demoName) !== -1;
        });
    });

    if (filteredRoutes.length !== allRoutes.length) {
        localStorage.setItem('yatyrist_routes', JSON.stringify(filteredRoutes));
    }
}

function getTypeName(type) {
    var types = {
        'car': 'Авто',
        'bike': 'Вело',
        'moto': 'Мото',
        'hike': 'Пеший',
        'sup': 'SUP доски',
        'kayak': 'Каякинг',
        'water': 'Водный туризм',
        'horse': 'Конные маршруты',
        'rock': 'Скалолазание',
        'ski': 'Лыжи'
    };
    return types[type] || type;
}

function getTypeIcon(type) {
    switch (type) {
        case 'car':
            return '🚗';
        case 'bike':
            return '🚲';
        case 'moto':
            return '🏍️';
        case 'hike':
            return '🥾';
        case 'sup':
            return '🏄';
        case 'kayak':
            return '🛶';
        case 'water':
            return '💧';
        case 'horse':
            return '🐴';
        case 'rock':
            return '🧗';
        case 'ski':
            return '⛷️';
        default:
            return '🥾';
    }
}

function getRegionName(region) {
    var regions = {
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
    return regions[region] || region;
}

function getAvatarLetter(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function getAvatarColor(name) {
    var colors = ['#2E7D32', '#1976D2', '#FF8F00', '#E53935', '#8E24AA', '#00838F'];
    var index = name ? name.length % colors.length : 0;
    return colors[index];
}

// Функция отображения картинки маршрута (если есть фото - показывает его)
function getRouteImage(route) {
    // Если есть фото в маршруте
    if (route.photos && route.photos.length > 0 && route.photos[0].data) {
        return '<img src="' + route.photos[0].data + '" style="width: 100%; height: 100%; object-fit: cover;">';
    }

    // Иначе цветная заглушка с иконкой
    var icon = getTypeIcon(route.type);
    return '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #2E7D32, #1B5E20); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">' + icon + '</div>';
}

function renderRoutes() {
    var currentTypeFilter = localStorage.getItem('currentTypeFilter') || 'all';
    var currentRegionFilter = localStorage.getItem('currentRegionFilter') || 'all';

    var allRoutes = getAllRoutes();
    var filtered = [];

    for (var i = 0; i < allRoutes.length; i++) {
        var route = allRoutes[i];
        var typeMatch = (currentTypeFilter === 'all' || route.type === currentTypeFilter);
        var regionMatch = (currentRegionFilter === 'all' || route.region === currentRegionFilter);
        if (typeMatch && regionMatch) {
            filtered.push(route);
        }
    }

    var routesGrid = document.getElementById('routesGrid');
    if (!routesGrid) return;

    if (filtered.length === 0) {
        routesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-map-marked-alt"></i><br>Маршрутов не найдено<br><a href="create-route.html" class="btn btn-primary" style="margin-top: 15px;">Создать маршрут</a></div>';
        return;
    }

    var html = '';
    for (var j = 0; j < filtered.length; j++) {
        var r = filtered[j];
        var avatarLetter = getAvatarLetter(r.author.name);
        var avatarColor = getAvatarColor(r.author.name);

        html += '<div class="route-card">';
        html += '<div class="card-img">';
        html += getRouteImage(r);
        html += '<span class="card-badge">' + getTypeName(r.type) + '</span>';
        html += '<span class="card-region"><i class=\"fas fa-map-pin\"></i> ' + getRegionName(r.region) + '</span>';
        html += '</div>';
        html += '<div class="card-content">';
        html += '<div class="author-info">';
        html += '<div class="author-avatar" style="background: ' + avatarColor + '; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem;">' + avatarLetter + '</div>';
        html += '<span class="author-name">' + escapeHtml(r.author.name) + '</span>';
        html += '<span class="author-rating"><i class="fas fa-star"></i> ' + (r.author.rating || '5.0') + '</span>';
        html += '</div>';
        html += '<h3 class="card-title">' + escapeHtml(r.title) + '</h3>';
        html += '<p class="card-desc">' + escapeHtml((r.description || '').substring(0, 100)) + '</p>';
        html += '<div class="card-meta">';
        html += '<span><i class="fas fa-clock"></i> ' + (r.duration || '—') + '</span>';
        html += '<span><i class="fas fa-map"></i> ' + (r.distance || '—') + '</span>';
        html += '</div>';
        html += '<div class="card-footer">';
        html += '<span class="card-price">' + r.price + ' ₽</span>';
        html += '<a href="route.html?id=' + r.id + '" class="btn btn-small btn-primary">Подробнее →</a>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }

    routesGrid.innerHTML = html;

    var totalRoutesElem = document.getElementById('totalRoutes');
    if (totalRoutesElem) totalRoutesElem.textContent = allRoutes.length;

    // Обновляем количество пользователей
    var usersJson = localStorage.getItem('yatyrist_users');
    var users = usersJson ? JSON.parse(usersJson) : [];

    // Если пользователей нет, добавляем демо для тестирования
    if (users.length === 0) {
        users = [
            { id: 'demo1', firstName: 'Алексей', lastName: 'Иванов', email: 'alex@example.com' },
            { id: 'demo2', firstName: 'Мария', lastName: 'Петрова', email: 'maria@example.com' },
            { id: 'demo3', firstName: 'Дмитрий', lastName: 'Сидоров', email: 'dmitry@example.com' }
        ];
        localStorage.setItem('yatyrist_users', JSON.stringify(users));
    }

    var totalUsersElem = document.getElementById('totalUsers');
    if (totalUsersElem) totalUsersElem.textContent = users.length;
}

document.addEventListener('DOMContentLoaded', function() {
    cleanDemoRoutes();
    renderRoutes();

    var filterBtns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < filterBtns.length; i++) {
        filterBtns[i].addEventListener('click', function() {
            var filter = this.getAttribute('data-filter');
            localStorage.setItem('currentTypeFilter', filter);
            for (var j = 0; j < filterBtns.length; j++) {
                filterBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            renderRoutes();
        });
    }

    var regionBtns = document.querySelectorAll('.region-btn');
    for (var i = 0; i < regionBtns.length; i++) {
        regionBtns[i].addEventListener('click', function() {
            var region = this.getAttribute('data-region');
            localStorage.setItem('currentRegionFilter', region);
            for (var j = 0; j < regionBtns.length; j++) {
                regionBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            renderRoutes();
        });
    }

    var users = JSON.parse(localStorage.getItem('yatyrist_users') || '[]');
    var totalUsersElem = document.getElementById('totalUsers');
    if (totalUsersElem) totalUsersElem.textContent = users.length;
});