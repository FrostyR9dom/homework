/**
 * route.js
 * 
 * НАЗНАЧЕНИЕ: Логика страницы маршрута.
 * 
 * ВАЖНО: Гость видит ВЕСЬ контент!
 * Только при нажатии "Купить" — переход на вход по телефону.
 * После входа автоматически возвращается обратно на маршрут.
 */

document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================

    /**
     * Получает ID маршрута из URL
     * Пример: route.html?id=123 → "123"
     * @returns {string|null}
     */
    function getRouteId() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    /**
     * Получает данные маршрута из localStorage
     * @param {string} id - ID маршрута
     * @returns {Object|null}
     */
    function getRouteById(id) {
        var routes = JSON.parse(localStorage.getItem('svoyatropa_routes') || localStorage.getItem('yatyrist_routes') || '[]');
        for (var i = 0; i < routes.length; i++) {
            if (routes[i].id == id) return routes[i];
        }
        return null;
    }

    /**
     * Получает отзывы на маршрут из localStorage
     * @param {string} routeId
     * @returns {Array}
     */
    function getReviews(routeId) {
        var r = localStorage.getItem('reviews_' + routeId);
        return r ? JSON.parse(r) : [];
    }

    /**
     * Сохраняет новый отзыв в localStorage
     * @param {string} routeId
     * @param {Object} review
     */
    function saveReview(routeId, review) {
        var reviews = getReviews(routeId);
        reviews.push(review);
        localStorage.setItem('reviews_' + routeId, JSON.stringify(reviews));
    }

    // ============================================================
    // ЗАПОЛНЕНИЕ ДАННЫХ МАРШРУТА
    // ============================================================

    /**
     * Заполняет все поля страницы данными маршрута
     * @param {Object} route - объект маршрута
     */
    function fillRouteData(route) {
        // Заголовок страницы и хлебные крошки
        document.title = route.title + ' | СвояТропа';
        document.getElementById('breadcrumbTitle').textContent = route.title;
        document.getElementById('routeTitle').textContent = route.title;

        // Тип маршрута (бейдж)
        var typeIcon = route.type === 'car' ? 'car' : (route.type === 'bike' ? 'bicycle' : 'hiking');
        var typeName = route.type === 'car' ? 'Авто' : (route.type === 'bike' ? 'Вело' : 'Пеший');
        var tb = document.getElementById('routeType');
        tb.className = 'route-badge ' + (route.type || 'hike');
        tb.innerHTML = '<i class="fas fa-' + typeIcon + '"></i> ' + typeName;

        // Сложность
        var diffNames = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
        var diffName = diffNames[route.difficulty] || 'Средний';
        var ds = document.getElementById('routeDifficulty');
        ds.className = 'route-difficulty ' + (route.difficulty || 'medium');
        ds.innerHTML = '<i class="fas fa-signal"></i> ' + diffName;

        // Локация
        document.getElementById('routeLocation').innerHTML = '<i class="fas fa-map-pin"></i> ' + (route.location || route.regionName || 'Не указано');

        // Автор
        if (route.author) {
            var initial = route.author.name ? route.author.name.charAt(0).toUpperCase() : 'А';
            document.getElementById('authorName').textContent = route.author.name || 'Автор';
            document.getElementById('authorRating').innerHTML = '<i class="fas fa-star"></i> ' + (route.author.rating || '5.0');
            document.getElementById('authorBio').textContent = route.author.bio || 'Путешественник';
            document.querySelector('#authorCard .author-avatar-large').textContent = initial;
        }

        // Описание
        document.getElementById('routeDescription').textContent = route.fullDescription || route.description || 'Описание отсутствует';

        // Параметры
        document.getElementById('paramDistance').textContent = route.distance || '—';
        document.getElementById('paramDuration').textContent = route.duration || '—';
        document.getElementById('paramElevation').textContent = route.elevation || '—';
        document.getElementById('paramBestTime').textContent = route.bestStartTime || '—';

        // Точки
        document.getElementById('startPoint').textContent = route.startPoint || 'Не указана';
        document.getElementById('endPoint').textContent = route.endPoint || 'Не указана';
        document.getElementById('bestStartTime').innerHTML = '<strong>Рекомендуемое время старта:</strong> ' + (route.bestStartTime || 'Утро');

        // Экипировка
        var eg = document.getElementById('equipmentGrid');
        if (route.equipment && route.equipment.length > 0) {
            var eh = '';
            for (var i = 0; i < route.equipment.length; i++) {
                eh += '<div class="equipment-card"><i class="fas fa-check-circle"></i> ' + route.equipment[i] + '</div>';
            }
            eg.innerHTML = eh;
        } else {
            eg.innerHTML = '<div class="equipment-card"><i class="fas fa-check-circle"></i> Базовая экипировка</div>';
        }

        // Рекомендации
        var tl = document.getElementById('recommendationsList');
        if (route.recommendations) {
            var tips = route.recommendations.split('\n');
            var th = '';
            for (var j = 0; j < tips.length; j++) {
                if (tips[j].trim()) th += '<li>✓ ' + tips[j].trim() + '</li>';
            }
            tl.innerHTML = th || '<li>✓ Следуйте по маршруту</li>';
        } else {
            tl.innerHTML = '<li>✓ Следуйте по размеченной тропе</li><li>✓ Возьмите с собой воду</li>';
        }

        // Цена и статистика
        document.getElementById('routePrice').textContent = (route.price || 0) + ' ₽';
        document.getElementById('statSales').textContent = (route.sales || 0).toLocaleString();
        document.getElementById('statRating').textContent = route.rating || '5.0';
        document.getElementById('statReviews').textContent = route.reviews || 0;

        // Фото
        loadPhotos(route);
    }

    /**
     * Загружает фото маршрута в галерею
     */
    function loadPhotos(route) {
        var galleryMain = document.getElementById('galleryMain');
        var galleryThumbs = document.getElementById('galleryThumbs');

        if (route.photos && route.photos.length > 0 && route.photos[0].data) {
            // Показываем первое фото
            galleryMain.innerHTML = '<img src="' + route.photos[0].data + '" alt="' + route.title + '" id="mainPhoto">';

            // Строим миниатюры
            var html = '';
            for (var i = 0; i < route.photos.length; i++) {
                html += '<img src="' + route.photos[i].data + '" class="thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '" alt="Фото ' + (i + 1) + '">';
            }
            galleryThumbs.innerHTML = html;

            // Обработчик клика по миниатюрам
            var thumbs = document.querySelectorAll('.gallery-thumbs .thumb');
            var mainPhoto = document.getElementById('mainPhoto');
            for (var j = 0; j < thumbs.length; j++) {
                thumbs[j].addEventListener('click', function() {
                    var idx = parseInt(this.getAttribute('data-index'));
                    if (mainPhoto && route.photos[idx]) {
                        mainPhoto.src = route.photos[idx].data;
                    }
                    for (var t = 0; t < thumbs.length; t++) {
                        thumbs[t].classList.remove('active');
                    }
                    this.classList.add('active');
                });
            }
        } else {
            // Заглушка если нет фото
            galleryMain.innerHTML = '<i class="fas fa-mountain" style="font-size: 4rem; color: white;"></i><p style="color: white;">Фото отсутствуют</p>';
            galleryThumbs.innerHTML = '';
        }
    }

    // ============================================================
    // ДОСТУП К КОНТЕНТУ МАРШРУТА
    // ============================================================

    function isRoutePurchased(routeId) {
        var user = getCurrentUser();
        if (!user) return false;
        return localStorage.getItem('purchased_' + routeId + '_' + user.id) === 'true';
    }

    function updateRouteAccessState(route) {
        var unlocked = isRoutePurchased(route.id);
        var lockedArea = document.getElementById('routeLockedArea');
        if (lockedArea) {
            lockedArea.classList.toggle('locked', !unlocked);
        }
    }

    // ============================================================
    // ОТЗЫВЫ
    // ============================================================

    /**
     * Загружает и отображает отзывы
     */
    function loadReviews(routeId) {
        var revs = getReviews(routeId);
        var grid = document.getElementById('reviewsGrid');
        var countSpan = document.getElementById('reviewsCount');
        var ratingSpan = document.getElementById('reviewsSummaryRating');
        var starsDiv = document.getElementById('reviewsStars');

        if (revs.length === 0) {
            grid.innerHTML = '<div class="review-card" style="text-align: center; padding: 40px;"><i class="fas fa-comment" style="font-size: 2rem; color: #ccc;"></i><p>Будьте первым, кто оставит отзыв!</p></div>';
            if (countSpan) countSpan.textContent = '0 отзывов';
            if (ratingSpan) ratingSpan.textContent = '0';
            if (starsDiv) starsDiv.innerHTML = '☆☆☆☆☆';
            return;
        }

        // Считаем средний рейтинг
        var total = 0;
        for (var r = 0; r < revs.length; r++) total += revs[r].rating;
        var avg = (total / revs.length).toFixed(1);

        if (countSpan) countSpan.textContent = revs.length + ' отзывов';
        if (ratingSpan) ratingSpan.textContent = avg;

        // Рисуем звёзды
        var stars = '';
        for (var s = 1; s <= 5; s++) {
            stars += s <= Math.floor(avg) ? '★' : (s === Math.floor(avg) + 1 && avg % 1 >= 0.5 ? '½' : '☆');
        }
        if (starsDiv) starsDiv.innerHTML = stars;

        // Строим список отзывов
        var html = '';
        for (var i = 0; i < revs.length; i++) {
            var rev = revs[i];
            var revStars = '';
            for (var rs = 1; rs <= 5; rs++) revStars += rs <= rev.rating ? '★' : '☆';
            var avatarChar = rev.author ? rev.author.charAt(0).toUpperCase() : '?';
            html += '<div class="review-card">' +
                '<div class="review-header">' +
                '<div class="review-avatar" style="background: #1976D2;">' + avatarChar + '</div>' +
                '<div>' +
                '<span class="review-author">' + rev.author + '</span>' +
                '<div class="review-rating">' + revStars + '</div>' +
                '</div>' +
                '<span class="review-date">' + (rev.date || '') + '</span>' +
                '</div>' +
                '<p class="review-text">' + rev.text + '</p>' +
                '</div>';
        }
        grid.innerHTML = html;
    }

    // ============================================================
    // КНОПКА ПОКУПКИ
    // ============================================================

    /**
     * Настраивает логику кнопки "Купить"
     * 
     * ГОСТЬ → переход на вход, потом авто-возврат
     * АВТОРИЗОВАН → подтверждение → покупка → скачивание
     */
    function setupBuyButton(route) {
        var btn = document.getElementById('buyRouteBtn');
        var downloadBlock = document.getElementById('downloadBlock');
        var addReviewBlock = document.getElementById('addReviewBlock');
        var routeId = route.id;

        if (!btn) return;

        /**
         * Проверяем, куплен ли уже маршрут
         * Используем localStorage с ключом: purchased_МАРШРУТ_ID_USER_ID
         */
        function isAlreadyBought() {
            var user = getCurrentUser();
            if (!user) return false;
            return localStorage.getItem('purchased_' + routeId + '_' + user.id) === 'true';
        }

        // Если уже куплен — показываем кнопку скачивания
        if (isAlreadyBought()) {
            btn.innerHTML = '<i class="fas fa-check"></i> Маршрут куплен';
            btn.classList.add('btn-success');
            if (downloadBlock) downloadBlock.style.display = 'block';
            if (addReviewBlock) addReviewBlock.style.display = 'block';

            if (downloadBlock) {
                downloadBlock.style.display = 'block';
            }

            // При клике скроллим к скачиванию
            btn.addEventListener('click', function() {
                if (downloadBlock) {
                    downloadBlock.scrollIntoView({ behavior: 'smooth' });
                }
            });
            return;
        }

        /**
         * Основная логика: нажатие на "Купить"
         */
        btn.addEventListener('click', function() {
            var currentUser = getCurrentUser();

            // === ГОСТЬ — НЕ АВТОРИЗОВАН ===
            if (!currentUser) {
                // Сохраняем что хотели купить и куда вернуться
                localStorage.setItem('redirect_after_login', 'route.html?id=' + routeId);
                localStorage.setItem('pending_purchase_route_id', routeId);

                // Понятное сообщение
                alert('🔐 Чтобы купить маршрут, нужно войти.\n\nВведите номер телефона — это быстро!');

                // Перенаправляем на вход
                window.location.href = 'register.html';
                return;
            }

            // === АВТОРИЗОВАН — ПОКАЗЫВАЕМ ПОДТВЕРЖДЕНИЕ ===
            var price = route.price || 299;
            var confirmMsg = '🛒 Вы покупаете маршрут:\n\n' +
                '"' + route.title + '"\n' +
                '💰 Цена: ' + price + ' ₽\n\n' +
                'После покупки вы получите:\n' +
                '• GPX трек для навигатора\n' +
                '• Офлайн-карту маршрута\n' +
                '• Рекомендации автора\n\n' +
                'Подтвердить покупку?';

            if (confirm(confirmMsg)) {
                // Сохраняем покупку в localStorage
                localStorage.setItem('purchased_' + routeId + '_' + currentUser.id, 'true');

                // Показываем закрытый контент маршрута
                updateRouteAccessState(route);

                // Показываем блок скачивания и отзыва
                if (downloadBlock) downloadBlock.style.display = 'block';
                if (addReviewBlock) addReviewBlock.style.display = 'block';

                // Меняем кнопку
                btn.innerHTML = '<i class="fas fa-check"></i> Маршрут куплен';
                btn.classList.add('btn-success');

                alert('✅ Маршрут "' + route.title + '" куплен!\n\nТеперь вы можете скачать GPX трек и PDF-гайд.');

                // Скроллим к скачиванию
                if (downloadBlock) {
                    downloadBlock.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // ============================================================
    // ФОРМА ОТЗЫВА
    // ============================================================

    function setupReviewForm(routeId) {
        var form = document.getElementById('reviewForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Проверяем авторизацию
            var user = getCurrentUser();
            if (!user) {
                alert('❌ Чтобы оставить отзыв, войдите в аккаунт');
                window.location.href = 'register.html';
                return;
            }

            // Получаем оценку
            var ratingInput = document.querySelector('input[name="rating"]:checked');
            if (!ratingInput) {
                alert('❌ Поставьте оценку (звёзды)');
                return;
            }

            // Получаем текст
            var text = document.getElementById('reviewText').value.trim();
            if (!text) {
                alert('❌ Напишите текст отзыва');
                return;
            }

            // Создаём отзыв
            var review = {
                id: Date.now(),
                author: (user.firstName || 'П') + ' ' + (user.lastName || ''),
                rating: parseInt(ratingInput.value),
                text: text,
                date: new Date().toLocaleDateString('ru-RU')
            };

            // Сохраняем
            saveReview(routeId, review);

            // Обновляем отображение
            loadReviews(routeId);

            // Очищаем форму
            form.reset();

            alert('⭐ Спасибо за отзыв!');
        });
    }

    // ============================================================
    // СКАЧИВАНИЕ ФАЙЛОВ
    // ============================================================

    function setupDownloadLinks() {
        var gpxLink = document.getElementById('downloadGpxLink');
        if (gpxLink) {
            gpxLink.addEventListener('click', function(e) {
                e.preventDefault();
                alert('⬇️ Скачивание GPX трека...\n\nВ реальном проекте здесь будет загрузка файла.');
            });
        }

        var pdfLink = document.getElementById('downloadPdfLink');
        if (pdfLink) {
            pdfLink.addEventListener('click', function(e) {
                e.preventDefault();
                alert('⬇️ Скачивание PDF гайда...\n\nВ реальном проекте здесь будет загрузка файла.');
            });
        }
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
    // ============================================================

    var id = getRouteId();

    if (!id) {
        // Если нет ID в URL
        document.querySelector('.container').innerHTML =
            '<div style="text-align: center; padding: 100px;">' +
            '<h1>Маршрут не найден</h1>' +
            '<p>Не указан ID маршрута в ссылке</p>' +
            '<a href="index.html" class="btn btn-primary" style="margin-top: 20px;">На главную</a>' +
            '</div>';
        return;
    }

    var route = getRouteById(id);

    if (!route) {
        // Если маршрут с таким ID не существует
        document.querySelector('.container').innerHTML =
            '<div style="text-align: center; padding: 100px;">' +
            '<h1>Маршрут не найден</h1>' +
            '<p>Маршрут с ID ' + id + ' не существует или был удалён</p>' +
            '<a href="index.html" class="btn btn-primary" style="margin-top: 20px;">На главную</a>' +
            '</div>';
        return;
    }

    // Заполняем страницу данными
    fillRouteData(route);
    updateRouteAccessState(route);
    loadReviews(id);
    setupBuyButton(route);
    setupReviewForm(id);
    setupDownloadLinks();

    // Обновляем UI авторизации
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

    console.log('✅ Страница маршрута загружена: ' + route.title);
});