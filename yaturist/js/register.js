/**
 * register.js
 * Логика для страницы регистрации и входа
 */

document.addEventListener('DOMContentLoaded', function() {

    // ===== ЧЕКБОКС "СТАТЬ АВТОРОМ" =====
    // Показываем дополнительную информацию при отметке
    var wantToBeAuthor = document.getElementById('wantToBeAuthor');
    var authorNote = document.getElementById('authorNote');

    if (wantToBeAuthor && authorNote) {
        wantToBeAuthor.addEventListener('change', function() {
            // Если чекбокс отмечен - показываем пояснение
            if (this.checked) {
                authorNote.style.display = 'flex';
            } else {
                authorNote.style.display = 'none';
            }
        });
    }

    // ===== ОБРАБОТКА ФОРМЫ ВХОДА =====
    var loginForm = document.getElementById('login');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Отменяем стандартную отправку

            // Получаем значения полей
            var emailElem = document.getElementById('loginEmail');
            var passwordElem = document.getElementById('loginPassword');

            var email = emailElem ? emailElem.value.trim() : '';
            var password = passwordElem ? passwordElem.value : '';

            // Валидация
            if (!email || !password) {
                alert('❌ Введите email и пароль');
                return;
            }

            // Вызываем функцию входа из auth.js
            var result = loginUser(email, password);

            if (result.success) {
                alert('✅ Добро пожаловать, ' + result.user.firstName + '!');

                // Проверяем, куда перенаправить
                var redirectUrl = localStorage.getItem('redirect_after_login');
                if (redirectUrl) {
                    localStorage.removeItem('redirect_after_login');
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert('❌ ' + result.error);
            }
        });
    }

    // ===== ОБРАБОТКА ФОРМЫ РЕГИСТРАЦИИ =====
    var registerForm = document.getElementById('register');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Получаем все поля
            var firstNameElem = document.getElementById('firstName');
            var lastNameElem = document.getElementById('lastName');
            var emailElem = document.getElementById('regEmail');
            var passwordElem = document.getElementById('regPassword');
            var cityElem = document.getElementById('city');
            var wantToBeAuthorElem = document.getElementById('wantToBeAuthor');

            var firstName = firstNameElem ? firstNameElem.value.trim() : '';
            var lastName = lastNameElem ? lastNameElem.value.trim() : '';
            var email = emailElem ? emailElem.value.trim() : '';
            var password = passwordElem ? passwordElem.value : '';
            var city = cityElem ? cityElem.value.trim() : '';
            var wantToBeAuthor = wantToBeAuthorElem ? wantToBeAuthorElem.checked : false;

            // Валидация
            if (!firstName || !lastName || !email || !password) {
                alert('❌ Заполните все обязательные поля (имя, фамилия, email, пароль)');
                return;
            }

            // Простая проверка email
            if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
                alert('❌ Введите корректный email');
                return;
            }

            // Проверка длины пароля
            if (password.length < 6) {
                alert('❌ Пароль должен содержать минимум 6 символов');
                return;
            }

            // Вызываем функцию регистрации из auth.js
            var result = registerUser({
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                city: city,
                wantToBeAuthor: wantToBeAuthor
            });

            if (result.success) {
                var message = '✅ Регистрация успешна! Добро пожаловать, ' + firstName + '!';
                if (wantToBeAuthor) {
                    message += '\n\nТеперь вы можете создавать и продавать свои маршруты!';
                }
                alert(message);

                // Редирект
                var redirectUrl = localStorage.getItem('redirect_after_login');
                if (redirectUrl) {
                    localStorage.removeItem('redirect_after_login');
                    window.location.href = redirectUrl;
                } else if (wantToBeAuthor) {
                    window.location.href = 'create-route.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert('❌ ' + result.error);
            }
        });
    }

    // ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ВХОД / РЕГИСТРАЦИЯ =====
    var tabs = document.querySelectorAll('.auth-tab');
    var loginFormEl = document.getElementById('loginForm');
    var registerFormEl = document.getElementById('registerForm');

    /**
     * Переключает видимую форму
     * @param {string} tab - 'login' или 'register'
     */
    function switchTab(tab) {
        // Обновляем активный класс у вкладок
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].getAttribute('data-tab') === tab) {
                tabs[i].classList.add('active');
            } else {
                tabs[i].classList.remove('active');
            }
        }

        // Показываем нужную форму
        if (loginFormEl && registerFormEl) {
            if (tab === 'login') {
                loginFormEl.style.display = 'block';
                registerFormEl.style.display = 'none';
            } else {
                loginFormEl.style.display = 'none';
                registerFormEl.style.display = 'block';
            }
        }
    }

    // Вешаем обработчики на вкладки
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    }

    // Обработчики для ссылок "Зарегистрируйтесь" и "Войдите"
    var switchToRegister = document.querySelector('.switch-to-register');
    var switchToLogin = document.querySelector('.switch-to-login');

    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('register');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('login');
        });
    }

    // ===== ОБРАБОТКА ПАРАМЕТРОВ URL =====
    // Например: register.html?mode=register&becomeAuthor=true
    var urlParams = new URLSearchParams(window.location.search);
    var mode = urlParams.get('mode');
    var becomeAuthor = urlParams.get('becomeAuthor');

    if (mode === 'register') {
        switchTab('register');

        // Если нужно стать автором, отмечаем чекбокс
        if (becomeAuthor === 'true') {
            var authorCheckbox = document.getElementById('wantToBeAuthor');
            if (authorCheckbox) {
                authorCheckbox.checked = true;
                var authorNoteElem = document.getElementById('authorNote');
                if (authorNoteElem) {
                    authorNoteElem.style.display = 'flex';
                }
            }
        }
    }

    console.log('✅ Register.js загружен');
});