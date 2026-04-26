/**
 * register.js
 * 
 * НАЗНАЧЕНИЕ: Вход по номеру телефона без пароля.
 * Шаг 1: Ввод телефона → получение кода
 * Шаг 2: Ввод кода → вход (аккаунт создаётся автоматически)
 * 
 * ДЕМО: код всегда 1111
 */

document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // DOM ЭЛЕМЕНТЫ
    // ============================================================
    var stepPhone = document.getElementById('stepPhone');
    var stepCode = document.getElementById('stepCode');
    var phoneInput = document.getElementById('phoneInput');
    var codeInput = document.getElementById('codeInput');
    var sendCodeBtn = document.getElementById('sendCodeBtn');
    var verifyCodeBtn = document.getElementById('verifyCodeBtn');
    var displayPhone = document.getElementById('displayPhone');
    var errorMessage = document.getElementById('errorMessage');
    var successMessage = document.getElementById('successMessage');
    var timerText = document.getElementById('timerText');
    var resendBtn = document.getElementById('resendBtn');
    var changePhoneBtn = document.getElementById('changePhoneBtn');

    var countdownInterval = null;
    var currentPhone = '';

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================

    function showError(msg) {
        if (!errorMessage) return;
        errorMessage.textContent = msg;
        errorMessage.classList.add('show');
        if (successMessage) successMessage.classList.remove('show');
        setTimeout(function() { errorMessage.classList.remove('show'); }, 5000);
    }

    function showSuccess(msg) {
        if (!successMessage) return;
        successMessage.textContent = msg;
        successMessage.classList.add('show');
        if (errorMessage) errorMessage.classList.remove('show');
        setTimeout(function() { successMessage.classList.remove('show'); }, 5000);
    }

    function hideMessages() {
        if (errorMessage) errorMessage.classList.remove('show');
        if (successMessage) successMessage.classList.remove('show');
    }

    function startCountdown(seconds) {
        if (countdownInterval) clearInterval(countdownInterval);
        if (resendBtn) resendBtn.disabled = true;
        var remaining = seconds;

        countdownInterval = setInterval(function() {
            var m = Math.floor(remaining / 60);
            var s = remaining % 60;
            if (timerText) {
                timerText.textContent = 'Отправить код повторно через ' + m + ':' + (s < 10 ? '0' : '') + s;
            }
            remaining--;
            if (remaining < 0) {
                clearInterval(countdownInterval);
                if (timerText) timerText.textContent = 'Можно отправить код повторно';
                if (resendBtn) resendBtn.disabled = false;
            }
        }, 1000);
    }

    // ============================================================
    // МАСКА ВВОДА ТЕЛЕФОНА (ИСПРАВЛЕННАЯ)
    // ============================================================
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Получаем ВСЁ значение поля
            var val = this.value;

            // Убираем ВООБЩЕ ВСЁ кроме цифр
            var digits = val.replace(/\D/g, '');

            // Убираем 7 или 8 в начале (код страны)
            if (digits.startsWith('7')) {
                digits = digits.substring(1);
            }
            if (digits.startsWith('8')) {
                digits = digits.substring(1);
            }

            // Максимум 10 цифр
            digits = digits.substring(0, 10);

            // Форматируем номер без кода страны, потому что префикс +7 уже в HTML
            var formatted = '';
            if (digits.length > 0) {
                formatted = '(' + digits.substring(0, Math.min(3, digits.length));
                if (digits.length >= 4) formatted += ') ' + digits.substring(3, Math.min(6, digits.length));
                if (digits.length >= 7) formatted += '-' + digits.substring(6, Math.min(8, digits.length));
                if (digits.length >= 9) formatted += '-' + digits.substring(8, 10);
            }

            // Записываем обратно в поле
            this.value = formatted;
        });

        // При фокусе если пусто - показываем плейсхолдер
        phoneInput.addEventListener('focus', function() {
            if (this.value === '') {
                this.placeholder = '(900) 123-45-67';
            }
        });

        // При потере фокуса если поле пустое - очищаем
        phoneInput.addEventListener('blur', function() {
            if (this.value === '' || this.value === '(') {
                this.value = '';
            }
        });
    }

    // ============================================================
    // КНОПКА "ПОЛУЧИТЬ КОД"
    // ============================================================
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', function() {
            var rawPhone = phoneInput ? phoneInput.value : '';
            // Получаем только цифры
            var digits = rawPhone.replace(/\D/g, '');

            if (digits.length < 10) {
                showError('Введите номер телефона полностью (10 цифр)');
                if (phoneInput) phoneInput.focus();
                return;
            }

            // Формируем чистый номер: +7 + 10 цифр
            currentPhone = '+7' + digits.substring(digits.length - 10);

            // Блокируем кнопку
            sendCodeBtn.disabled = true;
            sendCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';

            // Имитация отправки SMS
            setTimeout(function() {
                var code = '1111'; // Демо-код

                // Сохраняем в localStorage
                localStorage.setItem('sms_code_' + currentPhone, code);
                localStorage.setItem('sms_code_time_' + currentPhone, Date.now().toString());

                // Переключаем на шаг 2
                if (stepPhone) stepPhone.classList.add('hidden');
                if (stepCode) stepCode.classList.remove('hidden');

                // Показываем номер красиво
                var formattedPhone = '+7 (' + currentPhone.substring(2, 5) + ') ' +
                    currentPhone.substring(5, 8) + '-' +
                    currentPhone.substring(8, 10) + '-' +
                    currentPhone.substring(10, 12);
                if (displayPhone) displayPhone.textContent = formattedPhone;

                // Показываем код (только для демо!)
                showSuccess('📱 Демо-режим: ваш код ' + code);

                // Таймер
                startCountdown(59);

                // Возвращаем кнопку
                sendCodeBtn.disabled = false;
                sendCodeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Получить код в SMS';

                // Фокус на код
                if (codeInput) codeInput.focus();

                console.log('📱 Код ' + code + ' на номер ' + currentPhone);
            }, 800);
        });
    }

    // ============================================================
    // КНОПКА "ПОДТВЕРДИТЬ"
    // ============================================================
    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', function() {
            var code = codeInput ? codeInput.value.replace(/\D/g, '') : '';

            if (code.length !== 4) {
                showError('Введите 4-значный код из SMS');
                if (codeInput) codeInput.focus();
                return;
            }

            // Проверяем код
            var savedCode = localStorage.getItem('sms_code_' + currentPhone);

            if (code === savedCode || code === '1111') {
                // === УСПЕШНЫЙ ВХОД ===

                // Ищем или создаём пользователя
                var users = JSON.parse(localStorage.getItem('svoyatropa_users') || localStorage.getItem('yatyrist_users') || '[]');
                var user = null;

                for (var i = 0; i < users.length; i++) {
                    if (users[i].phone === currentPhone) {
                        user = users[i];
                        break;
                    }
                }

                // Создаём нового если не нашли
                if (!user) {
                    user = {
                        id: Date.now(),
                        phone: currentPhone,
                        firstName: '',
                        lastName: '',
                        email: '',
                        city: '',
                        bio: '',
                        isAuthor: false,
                        avatar: 'img/avatars/default-avatar.png',
                        createdAt: new Date().toISOString()
                    };
                    users.push(user);
                    localStorage.setItem('svoyatropa_users', JSON.stringify(users));
                    localStorage.setItem('yatyrist_users', JSON.stringify(users));
                    console.log('👤 Новый пользователь: ' + currentPhone);
                }

                // Создаём сессию
                var sessionUser = {
                    id: user.id,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    city: user.city,
                    bio: user.bio,
                    isAuthor: user.isAuthor,
                    avatar: user.avatar,
                    isLoggedIn: true,
                    createdAt: user.createdAt
                };
                localStorage.setItem('svoyatropa_user', JSON.stringify(sessionUser));
                localStorage.setItem('yaturist_user', JSON.stringify(sessionUser));

                // Очищаем код
                localStorage.removeItem('sms_code_' + currentPhone);
                localStorage.removeItem('sms_code_time_' + currentPhone);

                showSuccess('✅ Добро пожаловать' + (user.firstName ? ', ' + user.firstName : '') + '!');

                // Редирект через секунду
                setTimeout(function() {
                    var redirectUrl = localStorage.getItem('redirect_after_login');
                    localStorage.removeItem('redirect_after_login');

                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);

            } else {
                showError('❌ Неверный код. Попробуйте ещё раз.');
                if (codeInput) {
                    codeInput.value = '';
                    codeInput.focus();
                }
            }
        });
    }

    // ============================================================
    // АВТО-ОТПРАВКА ПРИ ВВОДЕ 4 ЦИФР
    // ============================================================
    if (codeInput) {
        codeInput.addEventListener('input', function() {
            var digits = this.value.replace(/\D/g, '');
            if (digits.length === 4 && verifyCodeBtn) {
                setTimeout(function() { verifyCodeBtn.click(); }, 200);
            }
        });
    }

    // ============================================================
    // КНОПКИ НАВИГАЦИИ
    // ============================================================
    if (resendBtn) {
        resendBtn.addEventListener('click', function() {
            if (stepCode) stepCode.classList.add('hidden');
            if (stepPhone) stepPhone.classList.remove('hidden');
            hideMessages();
            if (countdownInterval) clearInterval(countdownInterval);
        });
    }

    if (changePhoneBtn) {
        changePhoneBtn.addEventListener('click', function() {
            if (stepCode) stepCode.classList.add('hidden');
            if (stepPhone) stepPhone.classList.remove('hidden');
            hideMessages();
            if (countdownInterval) clearInterval(countdownInterval);
            if (phoneInput) {
                phoneInput.value = '';
                phoneInput.focus();
            }
        });
    }

    // ============================================================
    // ENTER НА ПОЛЕ ТЕЛЕФОНА
    // ============================================================
    if (phoneInput) {
        phoneInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (sendCodeBtn) sendCodeBtn.click();
            }
        });
    }

    console.log('✅ register.js загружен (СвояТропа)');
});