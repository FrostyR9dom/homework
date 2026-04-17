/**
 * filters.js
 * Фильтрация и отображение маршрутов на главной странице
 */

// ===== ФУНКЦИЯ СОЗДАНИЯ CSS-ЗАГЛУШКИ ВМЕСТО КАРТИНКИ =====
/**
 * Создаёт красивую цветную заглушку с иконкой вместо реального изображения
 * @param {string} type - тип маршрута (car, bike, hike)
 * @param {string} title - название маршрута
 * @returns {string} HTML-разметка с CSS-заглушкой
 */
function createImagePlaceholder(type, title) {
    // Выбираем цвет в зависимости от типа маршрута
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

    // Создаём HTML-заглушку с градиентом и иконкой
    var html = '<div style="width: 100%; height: 100%; background: ' + bgColor + '; ';
    html += 'display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">';
    html += icon;
    html += '<span style="margin-top: 10px; font-size: 0.9rem; opacity: 0.9; max-width: 80%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + title + '</span>';
    html += '</div>';

    return html;
}

/**
 * Создаёт заглушку для аватара
 * @param {string} name - имя автора
 * @returns {string} HTML с инициалами
 */
function createAvatarPlaceholder(name) {
    // Получаем первую букву имени
    var initial = name.charAt(0).toUpperCase();

    // Случайный цвет на основе имени
    var colors = ['#2E7D32', '#1976D2', '#FF8F00', '#E53935', '#8E24AA', '#00838F'];
    var colorIndex = name.length % colors.length;
    var bgColor = colors[colorIndex];

    var html = '<div style="width: 100%; height: 100%; background: ' + bgColor + '; ';
    html += 'display: flex; align-items: center; justify-content: center; color: white; ';
    html += 'font-weight: bold; font-size: 1rem; border-radius: 50%;">';
    html += initial;
    html += '</div>';

    return html;
}

// ===== БАЗА ДАННЫХ МАРШРУТОВ (БЕЗ РЕАЛЬНЫХ КАРТИНОК) =====
var routesData = [
    // КРАСНОДАРСКИЙ КРАЙ
    {
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
        author: {
            name: 'Анна Сочинская',
            rating: 4.9
        },
        description: 'Живописный маршрут по ущелью реки Агура. Три каскада водопадов, реликтовый лес и смотровая площадка на горе Ахун.'
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
        author: {
            name: 'Сергей Вело',
            rating: 4.7
        },
        description: 'Лучший веломаршрут по побережью. Ровная набережная, сосновый бор, виды на бухту.'
    },
    {
        id: 3,
        title: 'Автопутешествие на плато Лаго-Наки',
        type: 'car',
        region: 'krasnodar',
        regionName: 'Краснодарский край',
        location: 'Лаго-Наки',
        price: 999,
        duration: '2 дня',
        distance: '180 км',
        rating: 5.0,
        author: {
            name: 'Марат Горный',
            rating: 5.0
        },
        description: 'Маршрут для внедорожников по Кавказскому заповеднику. Альпийские луга, пещеры и вид на Оштен с Фиштом.'
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
        author: {
            name: 'Ольга Альпинистка',
            rating: 4.8
        },
        description: 'Классический маршрут на западную вершину Кавказа. Ночевка в приюте, ледники и панорама на море.'
    },
    // РОСТОВСКАЯ ОБЛАСТЬ
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
        author: {
            name: 'Дмитрий Донской',
            rating: 4.5
        },
        description: 'Приятная велопрогулка по набережной реки Дон. Вид на мост, парки и кафе.'
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
        author: {
            name: 'Елена Казачка',
            rating: 4.3
        },
        description: 'Исторический маршрут по казачьим местам. Старочеркасский собор, Аннинская крепость.'
    },
    // КАРАЧАЕВО-ЧЕРКЕСИЯ
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
        author: {
            name: 'Аслан Горец',
            rating: 4.9
        },
        description: 'Живописный маршрут к Софийским водопадам. Вид на Софийский ледник и горы.'
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
        author: {
            name: 'Руслан Горный',
            rating: 4.8
        },
        description: 'Автомаршрут по красивейшим местам Карачаево-Черкесии. Домбайская поляна, Тебердинский заповедник.'
    }
];

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {

    // Текущие фильтры
    var currentTypeFilter = 'all'; // all, car, bike, hike
    var currentRegionFilter = 'all'; // all, krasnodar, rostov, kch

    // DOM-элементы
    var filterButtons = document.querySelectorAll('.filter-btn');
    var regionButtons = document.querySelectorAll('.region-btn');
    var routesGrid = document.getElementById('routesGrid');

    /**
     * Возвращает читаемое название типа маршрута
     */
    function getTypeName(type) {
        var typeNames = { car: 'Авто', bike: 'Вело', hike: 'Пеший' };
        return typeNames[type] || type;
    }

    /**
     * Отрисовывает карточки маршрутов с учётом фильтров
     */
    function renderRoutes() {
        // Фильтруем маршруты
        var filtered = [];

        for (var i = 0; i < routesData.length; i++) {
            var route = routesData[i];

            // Проверяем соответствие фильтрам
            var typeMatch = (currentTypeFilter === 'all' || route.type === currentTypeFilter);
            var regionMatch = (currentRegionFilter === 'all' || route.region === currentRegionFilter);

            if (typeMatch && regionMatch) {
                filtered.push(route);
            }
        }

        // Формируем HTML
        var html = '';

        for (var j = 0; j < filtered.length; j++) {
            var r = filtered[j];

            html += '<div class="route-card" data-type="' + r.type + '" data-region="' + r.region + '">';

            // ИЗОБРАЖЕНИЕ (используем CSS-заглушку)
            html += '<div class="card-img">';
            html += createImagePlaceholder(r.type, r.title);
            html += '<span class="card-badge ' + r.type + '">' + getTypeName(r.type) + '</span>';
            html += '<span class="card-region"><i class="fas fa-map-pin"></i> ' + r.regionName + '</span>';
            html += '</div>';

            // КОНТЕНТ КАРТОЧКИ
            html += '<div class="card-content">';

            // ИНФОРМАЦИЯ ОБ АВТОРЕ
            html += '<div class="author-info">';
            html += '<div class="author-avatar" style="width: 36px; height: 36px; overflow: hidden;">';
            html += createAvatarPlaceholder(r.author.name);
            html += '</div>';
            html += '<span class="author-name">' + r.author.name + '</span>';
            html += '<span class="author-rating"><i class="fas fa-star" style="color: #FFC107;"></i> ' + r.author.rating + '</span>';
            html += '</div>';

            // ЗАГОЛОВОК И ОПИСАНИЕ
            html += '<h3 class="card-title">' + r.title + '</h3>';
            html += '<p class="card-desc">' + r.description + '</p>';

            // МЕТА-ИНФОРМАЦИЯ (ВРЕМЯ И РАССТОЯНИЕ)
            html += '<div class="card-meta">';
            html += '<span><i class="fas fa-clock"></i> ' + r.duration + '</span>';
            html += '<span><i class="fas fa-route"></i> ' + r.distance + '</span>';
            html += '</div>';

            // ЦЕНА И КНОПКА
            html += '<div class="card-footer">';
            html += '<span class="card-price">' + r.price + ' ₽</span>';
            html += '<a href="route.html?id=' + r.id + '" class="btn btn-small btn-primary">Подробнее <i class="fas fa-arrow-right"></i></a>';
            html += '</div>';

            html += '</div>'; // конец card-content
            html += '</div>'; // конец route-card
        }

        // Если ничего не найдено - показываем сообщение
        if (filtered.length === 0) {
            html = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px;">';
            html += '<i class="fas fa-search" style="font-size: 4rem; color: var(--primary-soft); margin-bottom: 16px;"></i>';
            html += '<h3 style="margin-bottom: 8px;">Маршрутов не найдено</h3>';
            html += '<p style="color: var(--gray);">Попробуйте изменить фильтры или выберите другой регион.</p>';
            html += '</div>';
        }

        routesGrid.innerHTML = html;

        // Обновляем счётчик маршрутов в герое
        var totalRoutesElem = document.getElementById('totalRoutes');
        if (totalRoutesElem) {
            totalRoutesElem.textContent = filtered.length;
        }
    }

    // ===== ОБРАБОТЧИКИ ФИЛЬТРОВ ПО ТИПУ =====
    for (var i = 0; i < filterButtons.length; i++) {
        filterButtons[i].addEventListener('click', function() {
            var filter = this.getAttribute('data-filter');
            currentTypeFilter = filter;

            // Обновляем активный класс
            for (var j = 0; j < filterButtons.length; j++) {
                filterButtons[j].classList.remove('active');
            }
            this.classList.add('active');

            renderRoutes();
        });
    }

    // ===== ОБРАБОТЧИКИ ФИЛЬТРОВ ПО РЕГИОНУ =====
    for (var i = 0; i < regionButtons.length; i++) {
        regionButtons[i].addEventListener('click', function() {
            var region = this.getAttribute('data-region');
            currentRegionFilter = region;

            // Обновляем активный класс
            for (var j = 0; j < regionButtons.length; j++) {
                regionButtons[j].classList.remove('active');
            }
            this.classList.add('active');

            renderRoutes();
        });
    }

    // ===== КНОПКА "ПОКАЗАТЬ ЕЩЁ" =====
    var loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            alert('📋 В реальном проекте здесь загрузятся ещё маршруты из базы данных.');
        });
    }

    // ===== ПЕРВАЯ ОТРИСОВКА =====
    renderRoutes();

    console.log('✅ Фильтры загружены. Используются CSS-заглушки вместо картинок.');
});