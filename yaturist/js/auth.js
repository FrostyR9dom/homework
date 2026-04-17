/**
 * auth.js
 * Система авторизации для сайта yatyrist
 * Хранит данные в localStorage (в реальном проекте - на сервере)
 */

/**
 * Получает текущего авторизованного пользователя из localStorage
 * @returns {Object|null} Объект пользователя или null
 */
function getCurrentUser() {
    var userJson = localStorage.getItem('yatyrist_user');
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Регистрирует нового пользователя
 * @param {Object} userData - Данные из формы регистрации
 * @returns {Object} Результат с полями success и user или error
 */
function registerUser(userData) {
    // Получаем список всех пользователей
    var usersJson = localStorage.getItem('yatyrist_users');
    var users = usersJson ? JSON.parse(usersJson) : [];

    // Проверяем, не занят ли email
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === userData.email) {
            return { success: false, error: 'Пользователь с таким email уже существует' };
        }
    }

    // Создаём нового пользователя
    var newUser = {
        id: Date.now(), // Временный ID на основе времени
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password, // В реальном проекте - хеш пароля!
        city: userData.city || '',
        isAuthor: userData.wantToBeAuthor || false, // Может ли создавать маршруты
        avatar: 'img/avatars/default-avatar.png',
        createdAt: new Date().toISOString()
    };

    // Сохраняем в общий список
    users.push(newUser);
    localStorage.setItem('yatyrist_users', JSON.stringify(users));

    // Создаём сессию (сохраняем в отдельный ключ)
    var sessionUser = {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        avatar: newUser.avatar,
        isLoggedIn: true,
        isAuthor: newUser.isAuthor
    };

    localStorage.setItem('yatyrist_user', JSON.stringify(sessionUser));

    return { success: true, user: sessionUser };
}

/**
 * Вход пользователя по email и паролю
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль
 * @returns {Object} Результат входа
 */
function loginUser(email, password) {
    var usersJson = localStorage.getItem('yatyrist_users');
    var users = usersJson ? JSON.parse(usersJson) : [];

    // Ищем пользователя
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password) {
            var user = users[i];

            // Создаём сессию
            var sessionUser = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar || 'img/avatars/default-avatar.png',
                isLoggedIn: true,
                isAuthor: user.isAuthor || false
            };

            localStorage.setItem('yatyrist_user', JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
        }
    }

    return { success: false, error: 'Неверный email или пароль' };
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem('yatyrist_user');
    window.location.href = 'index.html';
}

/**
 * Проверяет, авторизован ли пользователь
 * @returns {boolean}
 */
function isLoggedIn() {
    return getCurrentUser() !== null;
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
 * Обновляет интерфейс в зависимости от статуса авторизации
 * Показывает/скрывает элементы с классами guest-only и auth-only
 */
function updateAuthUI() {
    var user = getCurrentUser();
    var loggedIn = user !== null;

    // Элементы для гостей (неавторизованных)
    var guestElements = document.querySelectorAll('.guest-only');
    for (var i = 0; i < guestElements.length; i++) {
        guestElements[i].style.display = loggedIn ? 'none' : 'block';
    }

    // Элементы для авторизованных
    var authElements = document.querySelectorAll('.auth-only');
    for (var i = 0; i < authElements.length; i++) {
        authElements[i].style.display = loggedIn ? 'flex' : 'none';
    }

    // Обновляем имя пользователя
    if (loggedIn) {
        var nameDisplays = document.querySelectorAll('.user-name-display');
        var avatarDisplays = document.querySelectorAll('.user-avatar-display');

        for (var i = 0; i < nameDisplays.length; i++) {
            nameDisplays[i].textContent = user.firstName + ' ' + user.lastName;
        }

        for (var i = 0; i < avatarDisplays.length; i++) {
            avatarDisplays[i].src = user.avatar;
        }
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener('DOMContentLoaded', function() {

    // Обновляем интерфейс
    updateAuthUI();

    // Вешаем обработчики на кнопки выхода
    var logoutBtns = document.querySelectorAll('.logout-btn');
    for (var i = 0; i < logoutBtns.length; i++) {
        logoutBtns[i].addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти?')) {
                logout();
            }
        });
    }

    // Проверяем доступ к созданию маршрута
    var createLinks = document.querySelectorAll('.create-route-link');
    for (var i = 0; i < createLinks.length; i++) {
        createLinks[i].addEventListener('click', function(e) {
            // Если не авторизован - на страницу регистрации
            if (!isLoggedIn()) {
                e.preventDefault();
                // Сохраняем URL для возврата после входа
                localStorage.setItem('redirect_after_login', 'create-route.html');
                window.location.href = 'register.html?mode=register&becomeAuthor=true';
            }
            // Если авторизован, но не автор - показываем сообщение
            else if (!canCreateRoute()) {
                e.preventDefault();
                alert('⚠️ Чтобы создавать маршруты, нужно быть автором.\n\nОтметьте галочку "Хочу создавать маршруты" при регистрации или в настройках профиля.');
                window.location.href = 'profile.html#settings';
            }
        });
    }
});

console.log('✅ Auth.js загружен');