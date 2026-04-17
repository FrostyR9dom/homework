/**
 * filters.js
 * Фильтрация и отображение маршрутов на главной странице
 */

// ===== ФУНКЦИЯ СОЗДАНИЯ CSS-ЗАГЛУШКИ ВМЕСТО КАРТИНКИ =====
function createImagePlaceholder(type, title, photos) {
    // Если есть загруженные фото, используем первое
    if (photos && photos.length > 0 && photos[0].data) {
        return `<img src="${photos[0].data}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    // Иначе цветная заглушка
    var bgColor, icon;
    if (type === 'car') {
        bgColor = 'linear-gradient(135deg, #FF8F00 0%, #E65100 100%)';
        icon = '<i class="fas fa-car" style="font-size: 3rem;"></i>';
    } else if (type === 'bike') {
        bgColor = 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)';
        icon = '<i class="fas fa-bicycle" style="font-size: 3rem;"></i>';
    } else {
        bgColor = 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)';
        icon = '<i class="fas fa-hiking" style="font-size: 3rem;"></i>';
    }

    return '<div style="width: 100%; height: 100%; background: ' + bgColor + '; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">' +
        icon +
        '<span style="margin-top: 10px; font-size: 0.9rem; opacity: 0.9; max-width: 80%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + title + '</span>' +
        '</div>';
}

function createAvatarPlaceholder(name) {
    var initial = name.charAt(0).toUpperCase();
    var colors = ['#2E7D32', '#1976D2', '#FF8F00', '#E53935', '#8E24AA', '#00838F'];
    var colorIndex = name.length % colors.length;
    var bgColor = colors[colorIndex];
    return '<div style="width: 100%; height: 100%; background: ' + bgColor + '; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem; border-radius: 50%;">' + initial + '</div>';
}

// ===== ЗАГРУЗКА МАРШРУТОВ ИЗ LOCALSTORAGE =====
function getAllRoutes() {
    // Сначала пытаемся загрузить пользовательские маршруты
    var userRoutesJson = localStorage.getItem('yatyrist_routes');
    var userRoutes = userRoutesJson ? JSON.parse(userRoutesJson) : [];

    // Статические маршруты (демо)
    var staticRoutes = [{
            id: 1,
            title: 'Агурские водопады и Орлиные скалы',
            type: 'hike',
            region: 'krasnodar',
            regionName: 'Краснодарский край',
            location: 'Сочи',
            price: 349,
            duration: '4-5 часов',
            distance: '6 км',
            rating: 4.9,
            author: { name: 'Анна Сочинская', rating: 4.9 },
            description: 'Живописный маршрут по ущелью реки Агура. Три каскада водопадов, реликтовый лес и смотровая площадка на горе Ахун.',
            photos: []
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
            rating: 4.7,
            author: { name: 'Сергей Вело', rating: 4.7 },
            description: 'Лучший веломаршрут по побережью. Ровная набережная, сосновый бор, виды на бухту.',
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
            rating: 5.0,
            author: { name: 'Марат Горный', rating: 5.0 },
            description: 'Маршрут для внедорожников по Кавказскому заповеднику. Альпийские луга, пещеры и вид на Оштен с Фиштом.',
            photos: []
        },
        {
            id: 4,
            title: 'Восхождение на гору Фишт',
            type: 'hike',
            region: 'krasnodar',
            regionName: 'Краснодарский край',
            location: 'Кавказский хребет',
            price: 1499,
            duration: '3 дня',
            distance: '28 км',
            rating: 4.8,
            author: { name: 'Ольга Альпинистка', rating: 4.8 },
            description: 'Классический маршрут на западную вершину Кавказа. Ночевка в приюте, ледники и панорама на море.',
            photos: []
        },
        {
            id: 5,
            title: 'Веломаршрут по набережной Дона',
            type: 'bike',
            region: 'rostov',
            regionName: 'Ростовская область',
            location: 'Ростов-на-Дону',
            price: 149,
            duration: '2 часа',
            distance: '15 км',
            rating: 4.5,
            author: { name: 'Дмитрий Донской', rating: 4.5 },
            description: 'Приятная велопрогулка по набережной реки Дон. Вид на мост, парки и кафе.',
            photos: []
        },
        {
            id: 6,
            title: 'Пеший поход: Старочеркасская — Аксай',
            type: 'hike',
            region: 'rostov',
            regionName: 'Ростовская область',
            location: 'Старочеркасская',
            price: 299,
            duration: '6 часов',
            distance: '12 км',
            rating: 4.3,
            author: { name: 'Елена Казачка', rating: 4.3 },
            description: 'Исторический маршрут по казачьим местам. Старочеркасский собор, Аннинская крепость.',
            photos: []
        },
        {
            id: 7,
            title: 'Восхождение на Софийские водопады',
            type: 'hike',
            region: 'kch',
            regionName: 'Карачаево-Черкесия',
            location: 'Архыз',
            price: 499,
            duration: '1 день',
            distance: '10 км',
            rating: 4.9,
            author: { name: 'Аслан Горец', rating: 4.9 },
            description: 'Живописный маршрут к Софийским водопадам. Вид на Софийский ледник и горы.',
            photos: []
        },
        {
            id: 8,
            title: 'Автопутешествие: Домбай — Теберда',
            type: 'car',
            region: 'kch',
            regionName: 'Карачаево-Черкесия',
            location: 'Домбай',
            price: 799,
            duration: '2 дня',
            distance: '120 км',
            rating: 4.8,
            author: { name: 'Руслан Горный', rating: 4.8 },
            description: 'Автомаршрут по красивейшим местам Карачаево-Черкесии. Домбайская поляна, Тебердинский заповедник.',
            photos: []
        }
    ];

    // Объединяем статические и пользовательские маршруты
    var allRoutes = [...staticRoutes, ...userRoutes];

    // Удаляем дубликаты по id (если пользователь создал маршрут с таким же id)
    var uniqueRoutes = [];
    var ids = {};
    for (var i = 0; i < allRoutes.length; i++) {
        var route = allRoutes[i];
        if (!ids[route.id]) {
            ids[route.id] = true;
            uniqueRoutes.push(route);
        }
    }

    return uniqueRoutes;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {

    var currentTypeFilter = 'all';
    var currentRegionFilter = 'all';

    var filterButtons = document.querySelectorAll('.filter-btn');
    var regionButtons = document.querySelectorAll('.region-btn');
    var routesGrid = document.getElementById('routesGrid');

    function getTypeName(type) {
        var typeNames = { car: 'Авто', bike: 'Вело', hike: 'Пеший' };
        return typeNames[type] || type;
    }

    function renderRoutes() {
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

        var html = '';
        for (var j = 0; j < filtered.length; j++) {
            var r = filtered[j];

            html += '<div class="route-card" data-type="' + r.type + '" data-region="' + r.region + '">';
            html += '<div class="card-img">';
            html += createImagePlaceholder(r.type, r.title, r.photos || []);
            html += '<span class="card-badge ' + r.type + '">' + getTypeName(r.type) + '</span>';
            html += '<span class="card-region"><i class="fas fa-map-pin"></i> ' + (r.regionName || r.region) + '</span>';
            html += '</div>';
            html += '<div class="card-content">';
            html += '<div class="author-info">';
            html += '<div class="author-avatar" style="width: 36px; height: 36px; overflow: hidden; border-radius: 50%;">';
            html += createAvatarPlaceholder(r.author.name);
            html += '</div>';
            html += '<span class="author-name">' + r.author.name + '</span>';
            html += '<span class="author-rating"><i class="fas fa-star" style="color: #FFC107;"></i> ' + (r.author.rating || '5.0') + '</span>';
            html += '</div>';
            html += '<h3 class="card-title">' + r.title + '</h3>';
            html += '<p class="card-desc">' + (r.description || r.fullDescription || '').substring(0, 100) + '</p>';
            html += '<div class="card-meta">';
            html += '<span><i class="fas fa-clock"></i> ' + (r.duration || 'не указано') + '</span>';
            html += '<span><i class="fas fa-route"></i> ' + (r.distance || 'не указано') + '</span>';
            html += '</div>';
            html += '<div class="card-footer">';
            html += '<span class="card-price">' + r.price + ' ₽</span>';
            html += '<a href="route.html?id=' + r.id + '" class="btn btn-small btn-primary">Подробнее <i class="fas fa-arrow-right"></i></a>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }

        if (filtered.length === 0) {
            html = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px;">';
            html += '<i class="fas fa-search" style="font-size: 4rem; color: var(--primary-soft); margin-bottom: 16px;"></i>';
            html += '<h3 style="margin-bottom: 8px;">Маршрутов не найдено</h3>';
            html += '<p style="color: var(--gray);">Попробуйте изменить фильтры или создайте свой маршрут!</p>';
            html += '<a href="create-route.html" class="btn btn-primary" style="margin-top: 15px;">Создать маршрут</a>';
            html += '</div>';
        }

        routesGrid.innerHTML = html;

        // Обновляем счётчик маршрутов в герое
        var totalRoutesElem = document.getElementById('totalRoutes');
        if (totalRoutesElem) {
            totalRoutesElem.textContent = allRoutes.length;
        }
    }

    // Обработчики фильтров
    for (var i = 0; i < filterButtons.length; i++) {
        filterButtons[i].addEventListener('click', function() {
            var filter = this.getAttribute('data-filter');
            currentTypeFilter = filter;
            for (var j = 0; j < filterButtons.length; j++) {
                filterButtons[j].classList.remove('active');
            }
            this.classList.add('active');
            renderRoutes();
        });
    }

    for (var i = 0; i < regionButtons.length; i++) {
        regionButtons[i].addEventListener('click', function() {
            var region = this.getAttribute('data-region');
            currentRegionFilter = region;
            for (var j = 0; j < regionButtons.length; j++) {
                regionButtons[j].classList.remove('active');
            }
            this.classList.add('active');
            renderRoutes();
        });
    }

    // Кнопка "Показать ещё"
    var loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            alert('📋 Все доступные маршруты уже загружены!');
        });
    }

    // Первая отрисовка
    renderRoutes();
    console.log('✅ Фильтры загружены. Маршрутов в базе: ' + getAllRoutes().length);
});