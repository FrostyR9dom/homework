/**
 * auth.js
 * Система авторизации для сайта yatyrist
 * Хранит данные в localStorage (в реальном проекте - на сервере)
 */

// Простое хэширование паролей (для демонстрации, в продакшене использовать bcrypt)
function hashPassword(password) {
    // Простой хэш для демонстрации (в реальности использовать crypto API или серверное хэширование)
    var hash = 0;
    for (var i = 0; i < password.length; i++) {
        var char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Преобразовать в 32-битное число
    }
    return hash.toString();
}

// Валидация данных пользователя
function validateUserData(userData) {
    var errors = [];

    if (!userData.firstName || userData.firstName.trim().length < 2) {
        errors.push('Имя должно содержать минимум 2 символа');
    }

    if (!userData.lastName || userData.lastName.trim().length < 2) {
        errors.push('Фамилия должна содержать минимум 2 символа');
    }

    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.push('Введите корректный email');
    }

    if (!userData.password || userData.password.length < 6) {
        errors.push('Пароль должен содержать минимум 6 символов');
    }

    return errors;
}

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
    // Валидация данных
    var validationErrors = validateUserData(userData);
    if (validationErrors.length > 0) {
        return { success: false, error: validationErrors.join(', ') };
    }

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
        id: Date.now(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashPassword(userData.password),
        city: userData.city || '',
        bio: userData.bio || '',
        isAuthor: userData.wantToBeAuthor || false,
        avatar: userData.avatar || 'img/avatars/default-avatar.png',
        createdAt: new Date().toISOString()
    };

    // Сохраняем в общий список
    users.push(newUser);
    localStorage.setItem('yatyrist_users', JSON.stringify(users));

    // Создаём сессию
    var sessionUser = {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        city: newUser.city,
        bio: newUser.bio,
        avatar: newUser.avatar,
        isLoggedIn: true,
        isAuthor: newUser.isAuthor,
        createdAt: newUser.createdAt
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
        if (users[i].email === email && users[i].password === hashPassword(password)) {
            var user = users[i];

            // Создаём сессию
            var sessionUser = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                city: user.city || '',
                bio: user.bio || '',
                avatar: user.avatar || 'img/avatars/default-avatar.png',
                isLoggedIn: true,
                isAuthor: user.isAuthor || false,
                createdAt: user.createdAt
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
 */
function updateAuthUI() {
    var user = getCurrentUser();
    var loggedIn = user !== null;

    // Элементы для гостей
    var guestElements = document.querySelectorAll('.guest-only');
    for (var i = 0; i < guestElements.length; i++) {
        guestElements[i].style.display = loggedIn ? 'none' : 'block';
    }

    // Элементы для авторизованных
    var authElements = document.querySelectorAll('.auth-only');
    for (var i = 0; i < authElements.length; i++) {
        authElements[i].style.display = loggedIn ? 'flex' : 'none';
    }

    // Обновляем имя и аватар пользователя
    if (loggedIn) {
        var nameDisplays = document.querySelectorAll('.user-name-display');
        var avatarDisplays = document.querySelectorAll('.user-avatar-display');

        for (var i = 0; i < nameDisplays.length; i++) {
            nameDisplays[i].textContent = user.firstName + ' ' + user.lastName;
        }

        for (var i = 0; i < avatarDisplays.length; i++) {
            if (user.avatar) {
                avatarDisplays[i].src = user.avatar;
            }
        }

        // Обновляем ссылку на профиль
        var profileLinks = document.querySelectorAll('.user-profile-link');
        for (var i = 0; i < profileLinks.length; i++) {
            if (profileLinks[i].style) {
                profileLinks[i].style.display = 'flex';
            }
        }
    }
}

/**
 * Сохраняет обновлённые данные пользователя
 * @param {Object} updatedUser - Обновлённые данные
 * @returns {boolean}
 */
function updateUserData(updatedUser) {
    try {
        // Обновляем сессию
        localStorage.setItem('yatyrist_user', JSON.stringify(updatedUser));

        // Обновляем в общем списке
        var usersJson = localStorage.getItem('yatyrist_users');
        var users = usersJson ? JSON.parse(usersJson) : [];

        var userIndex = -1;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === updatedUser.id) {
                userIndex = i;
                break;
            }
        }

        if (userIndex !== -1) {
            users[userIndex] = {...users[userIndex], ...updatedUser };
            localStorage.setItem('yatyrist_users', JSON.stringify(users));
        }

        return true;
    } catch (e) {
        console.error('Ошибка обновления пользователя:', e);
        return false;
    }
}

}
}

// Демо-пользователи убраны - сайт для реального наполнения
var existingUsers = localStorage.getItem('yatyrist_users');
var users = existingUsers ? JSON.parse(existingUsers) : [];

// Добавляем демо только если меньше 4 пользователей
if (users.length >= 4) {
    return;
}

id: 1,
    firstName: 'Анна',
    lastName: 'Сочинская',
    email: 'anna@example.com',
    password: '123456',
    city: 'Сочи',
    bio: 'Люблю горы и водопады',
    isAuthor: true,
    avatar: 'img/avatars/default-avatar.png',
    createdAt: '2024-01-15T10:00:00Z'
}, {
    id: 2,
    firstName: 'Сергей',
    lastName: 'Вело',
    email: 'sergey@example.com',
    password: '123456',
    city: 'Геленджик',
    bio: 'Велосипедист и путешественник',
    isAuthor: true,
    avatar: 'img/avatars/default-avatar.png',
    createdAt: '2024-02-20T14:30:00Z'
}, {
    id: 3,
    firstName: 'Марат',
    lastName: 'Горный',
    email: 'marat@example.com',
    password: '123456',
    city: 'Майкоп',
    bio: 'Профессиональный гид по Кавказу',
    isAuthor: true,
    avatar: 'img/avatars/default-avatar.png',
    createdAt: '2024-03-10T09:15:00Z'
}, {
    id: 4,
    firstName: 'Руслан',
    lastName: 'Мото',
    email: 'ruslan@example.com',
    password: '123456',
    city: 'Черкесск',
    bio: 'Мотоциклист и экстремал',
    isAuthor: true,
    avatar: 'img/avatars/default-avatar.png',
    createdAt: '2024-04-05T16:45:00Z'
}
];

// Добавляем демо-пользователей к существующим
if (!exists) {}
}

localStorage.setItem('yatyrist_users', JSON.stringify(users));
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
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

    // Проверка доступа к созданию маршрута
    var createLinks = document.querySelectorAll('.create-route-link');
    for (var i = 0; i < createLinks.length; i++) {
        createLinks[i].addEventListener('click', function(e) {
            if (!isLoggedIn()) {
                e.preventDefault();
                localStorage.setItem('redirect_after_login', 'create-route.html');
                window.location.href = 'register.html?mode=register&becomeAuthor=true';
            } else if (!canCreateRoute()) {
                e.preventDefault();
                alert('⚠️ Чтобы создавать маршруты, нужно быть автором.\n\nОтметьте галочку "Хочу создавать маршруты" при регистрации или в настройках профиля.');
                window.location.href = 'profile.html#settings';
            }
        });
    }
});

console.log('✅ Auth.js загружен');