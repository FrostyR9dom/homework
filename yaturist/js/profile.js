/**
 * profile.js
 * Логика для личного кабинета пользователя
 * Вкладки, загрузка данных, редактирование профиля
 */

document.addEventListener('DOMContentLoaded', function() {

    // ===== 1. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
    var tabs = document.querySelectorAll('.profile-tab');
    var contents = document.querySelectorAll('.profile-tab-content');

    function switchTab(tabId) {
        // Скрываем все вкладки
        for (var i = 0; i < contents.length; i++) {
            contents[i].classList.remove('active');
        }

        // Убираем активный класс со всех кнопок
        for (var j = 0; j < tabs.length; j++) {
            tabs[j].classList.remove('active');
        }

        // Показываем выбранную вкладку
        var activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Активируем кнопку
        var activeTab = document.querySelector('[data-tab="' + tabId + '"]');
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Сохраняем в localStorage
        localStorage.setItem('activeProfileTab', tabId);
    }

    // Вешаем обработчики на вкладки
    for (var k = 0; k < tabs.length; k++) {
        tabs[k].addEventListener('click', function() {
            var tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    }

    // Восстанавливаем последнюю активную вкладку
    var savedTab = localStorage.getItem('activeProfileTab');
    if (savedTab) {
        switchTab(savedTab);
    }

    // ===== 2. ЗАГРУЗКА МОИХ МАРШРУТОВ =====
    function loadMyRoutes() {
        var routesList = document.getElementById('myRoutesList');
        if (!routesList) return;

        // Имитация данных (в реальном проекте - запрос к API)
        var routes = [{
                id: 1,
                title: 'Агурские водопады и Орлиные скалы',
                type: 'hike',
                typeName: 'Пеший',
                rating: 4.9,
                sales: 1247,
                views: 3892,
                income: 348203,
                image: 'img/routes/agur-waterfalls.jpg'
            },
            {
                id: 2,
                title: 'Восхождение на гору Фишт',
                type: 'hike',
                typeName: 'Пеший',
                rating: 4.8,
                sales: 156,
                views: 2104,
                income: 186444,
                image: 'img/routes/fisht-hike.jpg'
            }
        ];

        var html = '';
        for (var i = 0; i < routes.length; i++) {
            var route = routes[i];
            html += '<div class="route-item" data-route-id="' + route.id + '">';
            html += '<img src="' + route.image + '" alt="' + route.title + '" class="route-item-img">';
            html += '<div class="route-item-info">';
            html += '<h3>' + route.title + '</h3>';
            html += '<div class="route-item-meta">';
            html += '<span class="badge ' + route.type + '">' + route.typeName + '</span>';
            html += '<span><i class="fas fa-star"></i> ' + route.rating + '</span>';
            html += '<span><i class="fas fa-shopping-cart"></i> ' + route.sales + ' продаж</span>';
            html += '<span><i class="fas fa-eye"></i> ' + route.views + ' просмотра</span>';
            html += '</div>';
            html += '<div class="route-item-stats">';
            html += '<span>Доход: ' + route.income.toLocaleString() + ' ₽</span>';
            html += '</div>';
            html += '</div>';
            html += '<div class="route-item-actions">';
            html += '<button class="btn-icon" title="Редактировать" onclick="editRoute(' + route.id + ')">';
            html += '<i class="fas fa-edit"></i></button>';
            html += '<button class="btn-icon" title="Статистика" onclick="viewStats(' + route.id + ')">';
            html += '<i class="fas fa-chart-bar"></i></button>';
            html += '<button class="btn-icon danger" title="Удалить" onclick="deleteRoute(' + route.id + ')">';
            html += '<i class="fas fa-trash"></i></button>';
            html += '</div>';
            html += '</div>';
        }

        routesList.innerHTML = html;
    }

    // ===== 3. ЗАГРУЗКА КУПЛЕННЫХ МАРШРУТОВ =====
    function loadPurchasedRoutes() {
        var purchasedList = document.getElementById('purchasedList');
        if (!purchasedList) return;

        var purchased = [{
                id: 3,
                title: 'Автопутешествие на плато Лаго-Наки',
                author: 'Марат Горный',
                purchaseDate: '15.04.2026',
                image: 'img/routes/lago-naki.jpg'
            },
            {
                id: 2,
                title: 'Велопрогулка: Геленджик — Кабардинка',
                author: 'Сергей Велопутешественник',
                purchaseDate: '03.04.2026',
                image: 'img/routes/gelendjik-bike.jpg'
            }
        ];

        var html = '';
        for (var i = 0; i < purchased.length; i++) {
            var item = purchased[i];
            html += '<div class="purchased-item">';
            html += '<img src="' + item.image + '" alt="' + item.title + '" class="purchased-img">';
            html += '<div class="purchased-info">';
            html += '<h3>' + item.title + '</h3>';
            html += '<span class="author">Автор: ' + item.author + '</span>';
            html += '<span class="purchase-date">Куплено: ' + item.purchaseDate + '</span>';
            html += '</div>';
            html += '<div class="purchased-actions">';
            html += '<button class="btn btn-primary btn-small" onclick="downloadGPX(' + item.id + ')">';
            html += '<i class="fas fa-download"></i> Скачать GPX</button>';
            html += '<button class="btn btn-outline btn-small" onclick="leaveReview(' + item.id + ')">';
            html += '<i class="fas fa-star"></i> Оставить отзыв</button>';
            html += '</div>';
            html += '</div>';
        }

        purchasedList.innerHTML = html;
    }

    // ===== 4. ЗАГРУЗКА ТАБЛИЦЫ ФИНАНСОВ =====
    function loadEarnings() {
        var tbody = document.getElementById('earningsTableBody');
        if (!tbody) return;

        var transactions = [
            { date: '15.04.2026', route: 'Агурские водопады', amount: '279 ₽', status: 'success' },
            { date: '14.04.2026', route: 'Восхождение на Фишт', amount: '1,199 ₽', status: 'success' },
            { date: '13.04.2026', route: 'Агурские водопады', amount: '279 ₽', status: 'pending' },
            { date: '12.04.2026', route: 'Агурские водопады', amount: '279 ₽', status: 'success' }
        ];

        var html = '';
        for (var i = 0; i < transactions.length; i++) {
            var t = transactions[i];
            var statusClass = t.status === 'success' ? 'success' : 'pending';
            var statusText = t.status === 'success' ? 'Выплачено' : 'Ожидает';

            html += '<tr>';
            html += '<td>' + t.date + '</td>';
            html += '<td>' + t.route + '</td>';
            html += '<td>' + t.amount + '</td>';
            html += '<td><span class="status ' + statusClass + '">' + statusText + '</span></td>';
            html += '</tr>';
        }

        tbody.innerHTML = html;
    }

    // ===== 5. РЕДАКТИРОВАНИЕ ПРОФИЛЯ =====
    var editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            switchTab('settings');
        });
    }

    // ===== 6. СОХРАНЕНИЕ НАСТРОЕК =====
    var settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var firstName = document.getElementById('settingsFirstName').value;
            var lastName = document.getElementById('settingsLastName').value;
            var city = document.getElementById('settingsCity').value;
            var bio = document.getElementById('settingsBio').value;

            // Обновляем отображаемые данные
            document.getElementById('profileName').textContent = firstName + ' ' + lastName;
            document.getElementById('profileBio').textContent = bio;
            document.getElementById('profileLocation').textContent = city + ', Краснодарский край';
            document.getElementById('profileUserName').textContent = firstName + ' ' + lastName;

            alert('✅ Настройки сохранены!');

            // В реальном проекте - отправка на сервер
        });
    }

    // ===== 7. СМЕНА АВАТАРА =====
    var changeAvatarBtn = document.getElementById('changeAvatarBtn');
    var avatarInput = document.getElementById('avatarInput');
    var profileAvatar = document.getElementById('profileAvatar');

    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', function() {
            var file = this.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    profileAvatar.src = e.target.result;
                    alert('✅ Фото профиля обновлено!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ===== 8. ВЫХОД =====
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('userName');
                window.location.href = 'index.html';
            }
        });
    }

    // ===== 9. КНОПКА ВЫВОДА СРЕДСТВ =====
    var withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            alert('💰 Заявка на вывод средств создана. Деньги поступят в течение 3 рабочих дней.');
        });
    }

    // ===== 10. КНОПКА "ПОКАЗАТЬ ЕЩЁ" =====
    var loadMoreBtn = document.getElementById('loadMoreMyRoutes');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            alert('📋 В реальном проекте здесь загрузятся ещё маршруты.');
        });
    }

    // Загружаем все данные
    loadMyRoutes();
    loadPurchasedRoutes();
    loadEarnings();

    console.log('✅ Профиль загружен');
});

// Глобальные функции для кнопок
function editRoute(id) {
    alert('✏️ Редактирование маршрута #' + id);
    // window.location.href = 'edit-route.html?id=' + id;
}

function viewStats(id) {
    alert('📊 Статистика маршрута #' + id);
}

function deleteRoute(id) {
    if (confirm('Вы уверены, что хотите удалить этот маршрут?')) {
        alert('🗑️ Маршрут #' + id + ' удалён');
        // Удаляем элемент из DOM
        var routeItem = document.querySelector('[data-route-id="' + id + '"]');
        if (routeItem) routeItem.remove();
    }
}

function downloadGPX(id) {
    alert('⬇️ Скачивание GPX трека для маршрута #' + id);
}

function leaveReview(id) {
    window.location.href = 'route.html?id=' + id + '#review';
}