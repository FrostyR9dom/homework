/**
 * route.js
 * Логика для страницы маршрута
 */

document.addEventListener('DOMContentLoaded', function() {

    // ===== 1. СМЕНА ГЛАВНОГО ФОТО =====
    var thumbs = document.querySelectorAll('.thumb');
    var mainPhoto = document.getElementById('mainPhoto');

    for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].addEventListener('click', function() {
            if (mainPhoto) {
                mainPhoto.src = this.src;
            }

            // Обновляем активный класс
            for (var j = 0; j < thumbs.length; j++) {
                thumbs[j].classList.remove('active');
            }
            this.classList.add('active');
        });
    }

    // ===== 2. КНОПКА ПОКУПКИ =====
    var buyBtn = document.getElementById('buyRouteBtn');
    var downloadBlock = document.getElementById('downloadBlock');
    var addReviewBlock = document.getElementById('addReviewBlock');

    if (buyBtn) {
        buyBtn.addEventListener('click', function() {
            // Имитация покупки
            alert('✅ Демо-режим: Вы перенаправляетесь на оплату маршрута.\n\nВ реальном проекте здесь будет редирект на ЮKassa.');

            if (downloadBlock) {
                downloadBlock.style.display = 'block';
            }

            if (addReviewBlock) {
                addReviewBlock.style.display = 'block';
            }

            // Меняем кнопку
            this.innerHTML = '<i class="fas fa-check"></i> Маршрут куплен';
            this.classList.add('success');

            // Сохраняем в localStorage
            var routeId = getRouteId();
            if (routeId) {
                localStorage.setItem('purchased_' + routeId, 'true');
            }
        });
    }

    // ===== 3. ПРОВЕРКА СТАТУСА ПОКУПКИ =====
    function checkPurchaseStatus() {
        var routeId = getRouteId();
        if (routeId && localStorage.getItem('purchased_' + routeId) === 'true') {
            if (buyBtn) {
                buyBtn.innerHTML = '<i class="fas fa-check"></i> Маршрут куплен';
                buyBtn.classList.add('success');
            }
            if (downloadBlock) {
                downloadBlock.style.display = 'block';
            }
            if (addReviewBlock) {
                addReviewBlock.style.display = 'block';
            }
        }
    }

    // ===== 4. ПОЛУЧЕНИЕ ID МАРШРУТА ИЗ URL =====
    function getRouteId() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // ===== 5. ФОРМА ОТЗЫВА =====
    var reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var rating = document.querySelector('input[name="rating"]:checked');
            var ratingValue = rating ? rating.value : 'не выбрана';

            alert('⭐ Спасибо за отзыв! Ваша оценка: ' + ratingValue + ' звезд.');

            // Очищаем форму
            this.reset();
        });
    }

    // ===== 6. КНОПКА ЗАГРУЗКИ ОТЗЫВОВ =====
    var loadMoreReviews = document.getElementById('loadMoreReviews');
    if (loadMoreReviews) {
        loadMoreReviews.addEventListener('click', function() {
            alert('📝 В реальном проекте здесь загрузятся ещё отзывы из базы данных.');
        });
    }

    // ===== 7. ССЫЛКИ СКАЧИВАНИЯ =====
    var downloadLinks = document.querySelectorAll('.download-link');
    for (var k = 0; k < downloadLinks.length; k++) {
        downloadLinks[k].addEventListener('click', function(e) {
            e.preventDefault();
            var text = this.textContent.trim();
            alert('⬇️ Скачивание: ' + text);
        });
    }

    // Проверяем статус покупки при загрузке
    checkPurchaseStatus();

    console.log('✅ Страница маршрута загружена');
});