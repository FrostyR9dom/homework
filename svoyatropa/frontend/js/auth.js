/**
 * auth.js
 * 
 * НАЗНАЧЕНИЕ: Система авторизации для сайта "СвояТропа".
 * 
 * Хранит данные в localStorage.
 * В будущем заменить на API запросы к бэкенду.
 * 
 * ОСНОВНЫЕ ФУНКЦИИ:
 * - getCurrentUser() — получить текущего пользователя
 * - isLoggedIn() — проверка авторизации
 * - logout() — выход из системы
 * - updateAuthUI() — обновление интерфейса (шапка, кнопки)
 * - updateUserData() — обновление данных пользователя
 */

/**
 * Безопасное чтение JSON из localStorage
 * Защищает от ошибок если данные повреждены
 */
function safeParseJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
        return fallback;
    }
}

/**
 * Получает текущего авторизованного пользователя
 * @returns {Object|null} — объект пользователя или null
 */
function getCurrentUser() {
    var userJson = localStorage.getItem('svoyatropa_user') || localStorage.getItem('yaturist_user');
    return safeParseJson(userJson, null);
}

/**
 * Проверяет, авторизован ли пользователь
 * @returns {boolean}
 */
function isLoggedIn() {
    var user = getCurrentUser();
    return user !== null && user.isLoggedIn === true;
}

/**
 * Проверяет, может ли пользователь создавать маршруты
 * @returns {boolean}
 */
function canCreateRoute() {
    var user = getCurrentUser();
    return user !== null && user.isAuthor === true;
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem('svoyatropa_user');
    localStorage.removeItem('yaturist_user');
    // Не очищаем pending_purchase — он пригодится при следующем входе
    window.location.href = 'index.html';
}

/**
 * Обновляет интерфейс в зависимости от статуса авторизации
 * 
 * ГОСТЬ видит: кнопку "Войти"
 * АВТОРИЗОВАН видит: аватар, имя, кнопку "Выйти"
 * АВТОР видит дополнительно: кнопку "Создать маршрут"
 */
function updateAuthUI() {
    var user = getCurrentUser();
    var loggedIn = isLoggedIn();

    // Элементы для гостей (показываем только если НЕ авторизован)
    var guestElements = document.querySelectorAll('.guest-only');
    for (var i = 0; i < guestElements.length; i++) {
        guestElements[i].style.display = loggedIn ? 'none' : '';
    }

    // Элементы для авторизованных (показываем только если авторизован)
    var authElements = document.querySelectorAll('.auth-only');
    for (var i = 0; i < authElements.length; i++) {
        authElements[i].style.display = loggedIn ? '' : 'none';
    }

    // Обновляем имя пользователя в шапке
    if (loggedIn && user) {
        var nameDisplays = document.querySelectorAll('.user-name-display');
        var displayName = (user.firstName || 'Путешественник') + ' ' + (user.lastName || '');

        for (var i = 0; i < nameDisplays.length; i++) {
            nameDisplays[i].textContent = displayName.trim();
        }

        // Обновляем аватар
        var avatarDisplays = document.querySelectorAll('.user-avatar-display');
        for (var i = 0; i < avatarDisplays.length; i++) {
            avatarDisplays[i].src = user.avatar || 'img/avatars/default-avatar.png';
        }

        // Показываем/скрываем кнопку "Создать маршрут" в зависимости от статуса автора
        var createRouteLinks = document.querySelectorAll('.auth-only .nav-link[href="create-route.html"]');
        for (var i = 0; i < createRouteLinks.length; i++) {
            createRouteLinks[i].style.display = user.isAuthor ? '' : 'none';
        }
    }
}

/**
 * Сохраняет обновлённые данные пользователя
 * @param {Object} updatedUser — обновлённые данные
 * @returns {boolean} — успешно ли сохранение
 */
function updateUserData(updatedUser) {
    try {
        // Обновляем сессию
        localStorage.setItem('svoyatropa_user', JSON.stringify(updatedUser));
        localStorage.setItem('yaturist_user', JSON.stringify(updatedUser));

        // Обновляем в общем списке пользователей
        var usersJson = localStorage.getItem('svoyatropa_users') || localStorage.getItem('yatyrist_users');
        var users = safeParseJson(usersJson, []);

        for (var i = 0; i < users.length; i++) {
            if (users[i].id === updatedUser.id || users[i].phone === updatedUser.phone) {
                // Обновляем все поля кроме пароля (если был)
                var password = users[i].password;
                users[i] = Object.assign({}, users[i], updatedUser);
                if (password) users[i].password = password;
                break;
            }
        }

        localStorage.setItem('svoyatropa_users', JSON.stringify(users));
        localStorage.setItem('yatyrist_users', JSON.stringify(users));
        return true;
    } catch (e) {
        console.error('Ошибка обновления пользователя:', e);
        return false;
    }
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем интерфейс
    updateAuthUI();

    // Обработчики кнопок выхода
    var logoutBtns = document.querySelectorAll('.logout-btn');
    for (var i = 0; i < logoutBtns.length; i++) {
        logoutBtns[i].addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти?')) {
                logout();
            }
        });
    }

    /**
     * Проверка доступа к созданию маршрута
     * Если пользователь не автор — показываем сообщение
     */
    var createLinks = document.querySelectorAll('a[href="create-route.html"]');
    for (var i = 0; i < createLinks.length; i++) {
        createLinks[i].addEventListener('click', function(e) {
            if (!isLoggedIn()) {
                e.preventDefault();
                localStorage.setItem('redirect_after_login', 'create-route.html');
                window.location.href = 'register.html';
            } else if (!canCreateRoute()) {
                e.preventDefault();
                alert('⚠️ Чтобы создавать маршруты, нужно быть автором.\n\nВключите статус автора в настройках профиля.');
                window.location.href = 'profile.html#settings';
            }
        });
    }

    // Мобильное меню
    var mobileToggle = document.querySelector('.mobile-menu-toggle');
    var navElement = document.querySelector('.nav');
    if (mobileToggle && navElement) {
        mobileToggle.addEventListener('click', function() {
            navElement.classList.toggle('active');
        });
    }

    console.log('✅ auth.js загружен (СвояТропа)');
});