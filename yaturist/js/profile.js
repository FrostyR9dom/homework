/**
 * profile.js
 * Логика для личного кабинета пользователя
 */

// Глобальные переменные
var currentUser = null;

document.addEventListener('DOMContentLoaded', function() {

    // ===== 1. ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
    function loadUserProfile() {
        currentUser = getCurrentUser();

        if (!currentUser) {
            // Если пользователь не авторизован - перенаправляем на вход
            window.location.href = 'register.html';
            return;
        }

        // Заполняем данные из localStorage
        document.getElementById('profileName').textContent = currentUser.firstName + ' ' + currentUser.lastName;

        var userNameSpans = document.querySelectorAll('#profileUserName');
        for (var i = 0; i < userNameSpans.length; i++) {
            userNameSpans[i].textContent = currentUser.firstName + ' ' + currentUser.lastName;
        }

        // Аватар
        var avatarImg = document.getElementById('profileAvatar');
        if (currentUser.avatar && currentUser.avatar !== 'undefined') {
            avatarImg.src = currentUser.avatar;
        } else {
            avatarImg.src = 'img/avatars/default-avatar.png';
        }

        // Биография
        var bioElement = document.getElementById('profileBio');
        if (currentUser.bio && currentUser.bio.trim() !== '') {
            bioElement.textContent = currentUser.bio;
        } else {
            bioElement.textContent = 'Путешественник. Люблю открывать новые места.';
        }

        // Город
        var locationElement = document.getElementById('profileLocation');
        if (currentUser.city && currentUser.city.trim() !== '') {
            locationElement.textContent = currentUser.city + ', Краснодарский край';
        } else {
            locationElement.textContent = 'Краснодарский край';
        }

        // Дата регистрации
        var sinceElement = document.getElementById('profileSince');
        if (currentUser.createdAt) {
            var date = new Date(currentUser.createdAt);
            sinceElement.textContent = 'На сайте с ' + date.getFullYear();
        } else {
            sinceElement.textContent = 'На сайте с 2024';
        }

        // Статус автора
        var authorStatusElement = document.getElementById('profileAuthorStatus');
        if (currentUser.isAuthor) {
            authorStatusElement.textContent = 'Верифицированный автор';
            authorStatusElement.style.color = 'var(--success)';
        } else {
            authorStatusElement.textContent = 'Путешественник';
            authorStatusElement.style.color = 'var(--gray)';
        }

        // Показываем/скрываем кнопку создания маршрута
        var createRouteBtn = document.getElementById('createRouteBtn');
        if (createRouteBtn) {
            if (currentUser.isAuthor) {
                createRouteBtn.style.display = 'inline-flex';
            } else {
                createRouteBtn.style.display = 'none';
            }
        }

        // Обновляем форму настроек
        document.getElementById('settingsFirstName').value = currentUser.firstName || '';
        document.getElementById('settingsLastName').value = currentUser.lastName || '';
        document.getElementById('settingsEmail').value = currentUser.email || '';
        document.getElementById('settingsCity').value = currentUser.city || '';
        document.getElementById('settingsBio').value = currentUser.bio || '';

        // Статистика (имитация)
        document.getElementById('routesCount').textContent = currentUser.isAuthor ? '3' : '0';
        document.getElementById('salesCount').textContent = currentUser.isAuthor ? '1,247' : '0';
        document.getElementById('avgRating').textContent = currentUser.isAuthor ? '4.9' : '0';
        document.getElementById('totalEarnings').textContent = currentUser.isAuthor ? '348,203 ₽' : '0 ₽';
        document.getElementById('allTimeEarnings').textContent = currentUser.isAuthor ? '348,203 ₽' : '0 ₽';
    }

    // ===== 2. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
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

        // Если переключились на вкладку настроек, обновляем форму
        if (tabId === 'settings' && currentUser) {
            document.getElementById('settingsFirstName').value = currentUser.firstName || '';
            document.getElementById('settingsLastName').value = currentUser.lastName || '';
            document.getElementById('settingsEmail').value = currentUser.email || '';
            document.getElementById('settingsCity').value = currentUser.city || '';
            document.getElementById('settingsBio').value = currentUser.bio || '';
        }
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
    if (savedTab && document.getElementById(savedTab)) {
        switchTab(savedTab);
    }

    // ===== 3. ЗАГРУЗКА МОИХ МАРШРУТОВ =====
    function loadMyRoutes() {
        var routesList = document.getElementById('myRoutesList');
        if (!routesList) return;

        if (!currentUser || !currentUser.isAuthor) {
            routesList.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><br>Вы не являетесь автором. Чтобы создавать маршруты, отметьте галочку "Хочу создавать маршруты" в настройках.</div>';
            return;
        }

        // Загружаем маршруты пользователя из localStorage
        var allRoutes = JSON.parse(localStorage.getItem('yatyrist_routes') || '[]');
        var myRoutes = allRoutes.filter(function(route) {
            return route.author && route.author.id === currentUser.id;
        });

        // Если нет своих маршрутов, показываем примеры
        if (myRoutes.length === 0) {
            myRoutes = [{
                    id: 1,
                    title: 'Агурские водопады и Орлиные скалы',
                    type: 'hike',
                    typeName: 'Пеший',
                    rating: 4.9,
                    sales: 1247,
                    views: 3892,
                    income: 348203
                },
                {
                    id: 2,
                    title: 'Восхождение на гору Фишт',
                    type: 'hike',
                    typeName: 'Пеший',
                    rating: 4.8,
                    sales: 156,
                    views: 2104,
                    income: 186444
                }
            ];
        }

        var html = '';
        for (var i = 0; i < myRoutes.length; i++) {
            var route = myRoutes[i];
            html += '<div class="route-item" data-route-id="' + route.id + '">';
            html += '<div class="route-item-img" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); display: flex; align-items: center; justify-content: center; color: white;"><i class="fas fa-route"></i></div>';
            html += '<div class="route-item-info">';
            html += '<h3>' + route.title + '</h3>';
            html += '<div class="route-item-meta">';
            html += '<span class="badge ' + route.type + '">' + (route.typeName || route.type) + '</span>';
            html += '<span><i class="fas fa-star"></i> ' + (route.rating || '4.5') + '</span>';
            html += '<span><i class="fas fa-shopping-cart"></i> ' + (route.sales || '0') + ' продаж</span>';
            html += '<span><i class="fas fa-eye"></i> ' + (route.views || '0') + ' просмотров</span>';
            html += '</div>';
            html += '<div class="route-item-stats">';
            html += '<span>Доход: ' + ((route.income || 0).toLocaleString()) + ' ₽</span>';
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

    // ===== 4. ЗАГРУЗКА КУПЛЕННЫХ МАРШРУТОВ =====
    function loadPurchasedRoutes() {
        var purchasedList = document.getElementById('purchasedList');
        if (!purchasedList) return;

        // Загружаем купленные маршруты
        var purchased = JSON.parse(localStorage.getItem('yatyrist_purchased') || '[]');

        // Если нет купленных, показываем пример
        if (purchased.length === 0 && currentUser) {
            purchased = [{
                    id: 3,
                    title: 'Автопутешествие на плато Лаго-Наки',
                    author: 'Марат Горный',
                    purchaseDate: new Date().toLocaleDateString(),
                    price: 999
                },
                {
                    id: 2,
                    title: 'Велопрогулка: Геленджик — Кабардинка',
                    author: 'Сергей Вело',
                    purchaseDate: new Date(Date.now() - 86400000).toLocaleDateString(),
                    price: 199
                }
            ];
        }

        var html = '';
        for (var i = 0; i < purchased.length; i++) {
            var item = purchased[i];
            html += '<div class="purchased-item">';
            html += '<div class="purchased-img" style="background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%); display: flex; align-items: center; justify-content: center; color: white;"><i class="fas fa-map"></i></div>';
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

    // ===== 5. ЗАГРУЗКА ТАБЛИЦЫ ФИНАНСОВ =====
    function loadEarnings() {
        var tbody = document.getElementById('earningsTableBody');
        if (!tbody) return;

        if (!currentUser || !currentUser.isAuthor) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Вы не являетесь автором. Создавайте маршруты и зарабатывайте!</td></tr>';
            return;
        }

        var transactions = [
            { date: new Date().toLocaleDateString(), route: 'Агурские водопады', amount: '279 ₽', status: 'success' },
            { date: new Date(Date.now() - 86400000).toLocaleDateString(), route: 'Восхождение на Фишт', amount: '1,199 ₽', status: 'success' },
            { date: new Date(Date.now() - 172800000).toLocaleDateString(), route: 'Агурские водопады', amount: '279 ₽', status: 'pending' },
            { date: new Date(Date.now() - 259200000).toLocaleDateString(), route: 'Агурские водопады', amount: '279 ₽', status: 'success' }
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

    // ===== 6. СОХРАНЕНИЕ НАСТРОЕК =====
    var settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!currentUser) return;

            // Получаем новые значения
            var newFirstName = document.getElementById('settingsFirstName').value;
            var newLastName = document.getElementById('settingsLastName').value;
            var newEmail = document.getElementById('settingsEmail').value;
            var newCity = document.getElementById('settingsCity').value;
            var newBio = document.getElementById('settingsBio').value;

            // Обновляем объект пользователя
            currentUser.firstName = newFirstName;
            currentUser.lastName = newLastName;
            currentUser.email = newEmail;
            currentUser.city = newCity;
            currentUser.bio = newBio;

            // Сохраняем
            if (updateUserData(currentUser)) {
                // Обновляем отображение
                loadUserProfile();
                alert('✅ Настройки сохранены!');
            } else {
                alert('❌ Ошибка при сохранении настроек');
            }
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

        avatarInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file && currentUser) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    var avatarUrl = ev.target.result;
                    profileAvatar.src = avatarUrl;
                    currentUser.avatar = avatarUrl;
                    updateUserData(currentUser);
                    updateAuthUI();
                    alert('✅ Фото профиля обновлено!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ===== 8. КНОПКА ВЫВОДА СРЕДСТВ =====
    var withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            alert('💰 Заявка на вывод средств создана. Деньги поступят в течение 3 рабочих дней.');
        });
    }

    // ===== 9. КНОПКА "ПОКАЗАТЬ ЕЩЁ" =====
    var loadMoreBtn = document.getElementById('loadMoreMyRoutes');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            alert('📋 В реальном проекте здесь загрузятся ещё маршруты.');
        });
    }

    // ===== 10. КНОПКА ВЫХОДА В ПРОФИЛЕ =====
    var logoutBtnProfile = document.getElementById('logoutBtn');
    if (logoutBtnProfile) {
        logoutBtnProfile.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                localStorage.removeItem('yatyrist_user');
                window.location.href = 'index.html';
            }
        });
    }

    // ===== 11. КНОПКА РЕДАКТИРОВАНИЯ =====
    var editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            switchTab('settings');
        });
    }

    // Загружаем все данные
    loadUserProfile();
    loadMyRoutes();
    loadPurchasedRoutes();
    loadEarnings();

    console.log('✅ Профиль загружен для пользователя:', currentUser ? currentUser.firstName : 'не найден');
});

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
function editRoute(id) {
    alert('✏️ Редактирование маршрута #' + id + '\n\nВ реальном проекте здесь будет форма редактирования.');
}

function viewStats(id) {
    alert('📊 Статистика маршрута #' + id + '\n\nПросмотров: 2,500\nПродаж: 150\nДоход: 45,000 ₽');
}

function deleteRoute(id) {
    if (confirm('Вы уверены, что хотите удалить этот маршрут?')) {
        alert('🗑️ Маршрут #' + id + ' удалён');
        var routeItem = document.querySelector('[data-route-id="' + id + '"]');
        if (routeItem) routeItem.remove();
    }
}

function downloadGPX(id) {
    alert('⬇️ Скачивание GPX трека для маршрута #' + id + '\n\nФайл будет загружен на ваше устройство.');
}

function leaveReview(id) {
    window.location.href = 'route.html?id=' + id;
}