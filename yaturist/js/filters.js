/**
 * filters.js - Фильтрация и отображение маршрутов
 */

// Демо-маршруты для первого запуска
function initDemoRoutes() {
    var existingRoutes = localStorage.getItem('yatyrist_routes');
    if (existingRoutes && JSON.parse(existingRoutes).length > 0) {
        return;
    }

    var demoRoutes = [{
            id: 1,
            title: 'Агурские водопады и Орлиные скалы',
            type: 'hike',
            region: 'krasnodar',
            regionName: 'Краснодарский край',
            location: 'Сочи',
            price: 349,
            duration: '4-5 часов',
            distance: '6 км',
            author: { id: 1, name: 'Анна Сочинская', rating: 4.9 },
            description: 'Живописный маршрут по ущелью реки Агура. Три каскада водопадов.',
            sales: 1247,
            rating: 4.9,
            photos: [] // Нет фото, будет заглушка
        },
        {
            id: 2,
            title: 'Велопрогулка: Геленджик — Кабардинка',
            type: 'bike',
            region: 'krasnodar',
            regionName: 'Краснодарский край',
            location: 'Геленджик',
            price: 199,
            duration: '3 часа',
            distance: '20 км',
            author: { id: 2, name: 'Сергей Вело', rating: 4.7 },
            description: 'Лучший веломаршрут по побережью.',
            sales: 856,
            rating: 4.7,
            photos: []
        },
        {
            id: 3,
            title: 'Автопутешествие на плато Лаго-Наки',
            type: 'car',
            region: 'adygea',
            regionName: 'Адыгея',
            location: 'Лаго-Наки',
            price: 999,
            duration: '2 дня',
            distance: '180 км',
            author: { id: 3, name: 'Марат Горный', rating: 5.0 },
            description: 'Маршрут для внедорожников по Кавказскому заповеднику.',
            sales: 234,
            rating: 5.0,
            photos: []
        },
        {
            id: 4,
            title: 'Мотопробег по горным серпантинам',
            type: 'moto',
            region: 'kch',
            regionName: 'Карачаево-Черкесия',
            location: 'Домбай',
            price: 799,
            duration: '1 день',
            distance: '150 км',
            author: { id: 4, name: 'Руслан Мото', rating: 4.9 },
            description: 'Захватывающий маршрут для мотоциклистов.',
            sales: 156,
            rating: 4.9,
            photos: []
        }
    ];

    localStorage.setItem('yatyrist_routes', JSON.stringify(demoRoutes));
}

function getAllRoutes() {
    var routesJson = localStorage.getItem('yatyrist_routes');
    return routesJson ? JSON.parse(routesJson) : [];
}

function getTypeName(type) {
    var types = { 'car': 'Авто', 'bike': 'Вело', 'moto': 'Мото', 'hike': 'Пеший' };
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
        default:
            return '🥾';
    }
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
        html += '<span class="card-region"><i class="fas fa-map-pin"></i> ' + (r.regionName || r.region) + '</span>';
        html += '</div>';
        html += '<div class="card-content">';
        html += '<div class="author-info">';
        html += '<div class="author-avatar" style="background: ' + avatarColor + '; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem;">' + avatarLetter + '</div>';
        html += '<span class="author-name">' + r.author.name + '</span>';
        html += '<span class="author-rating"><i class="fas fa-star"></i> ' + (r.author.rating || '5.0') + '</span>';
        html += '</div>';
        html += '<h3 class="card-title">' + r.title + '</h3>';
        html += '<p class="card-desc">' + (r.description || '').substring(0, 100) + '</p>';
        html += '<div class="card-meta">';
        html += '<span><i class="fas fa-clock"></i> ' + (r.duration || '—') + '</span>';
        html += '<span><i class="fas fa-route"></i> ' + (r.distance || '—') + '</span>';
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
}

document.addEventListener('DOMContentLoaded', function() {
    initDemoRoutes();
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