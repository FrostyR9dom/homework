/**
 * main.js
 * Общая логика сайта
 */

document.addEventListener('DOMContentLoaded', function() {

    // Анимация счётчиков
    function animateNumbers() {
        var statNumbers = document.querySelectorAll('.stat-number');
        for (var i = 0; i < statNumbers.length; i++) {
            var el = statNumbers[i];
            var finalValue = parseInt(el.textContent) || 0;
            if (el.id === 'totalRoutes' || el.id === 'totalUsers') {
                // Не анимируем, так как значения динамические
            }
        }
    }

    // Плавный скролл
    var smoothLinks = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < smoothLinks.length; i++) {
        smoothLinks[i].addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href !== '#') {
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // Отображение комиссии
    var commissionElements = document.querySelectorAll('.commission-display');
    for (var i = 0; i < commissionElements.length; i++) {
        commissionElements[i].textContent = '30%';
    }

    console.log('✅ yatyrist загружен. Комиссия сервиса: 30%');
});

// Форматирование цены
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

// Расчёт дохода автора (с учётом комиссии 30%)
function calculateAuthorIncome(price) {
    return Math.round(price * 0.7);
}



// Выпадающий список регионов
document.addEventListener('DOMContentLoaded', function() {
    var regionBtn = document.getElementById('regionSelectorBtn');
    var regionDropdown = document.getElementById('regionDropdown');
    var selectedRegionText = document.getElementById('selectedRegionText');
    var regionOptions = document.querySelectorAll('.region-option');

    if (regionBtn && regionDropdown) {
        // Открытие/закрытие
        regionBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            regionDropdown.classList.toggle('show');
            regionBtn.classList.toggle('active');
        });

        // Закрытие при клике вне
        document.addEventListener('click', function() {
            regionDropdown.classList.remove('show');
            regionBtn.classList.remove('active');
        });

        regionDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Выбор региона
        for (var i = 0; i < regionOptions.length; i++) {
            regionOptions[i].addEventListener('click', function(e) {
                e.preventDefault();

                var region = this.getAttribute('data-region');
                var regionName = this.textContent.trim();

                // Обновляем текст кнопки
                selectedRegionText.textContent = regionName;

                // Обновляем активный класс
                for (var j = 0; j < regionOptions.length; j++) {
                    regionOptions[j].classList.remove('active');
                }
                this.classList.add('active');

                // Закрываем выпадашку
                regionDropdown.classList.remove('show');
                regionBtn.classList.remove('active');

                // Фильтруем маршруты (если есть функция)
                if (typeof filterByRegion === 'function') {
                    filterByRegion(region);
                }

                // Сохраняем выбор
                localStorage.setItem('selectedRegion', region);
            });
        }

        // Восстанавливаем выбор
        var savedRegion = localStorage.getItem('selectedRegion');
        if (savedRegion) {
            for (var i = 0; i < regionOptions.length; i++) {
                if (regionOptions[i].getAttribute('data-region') === savedRegion) {
                    regionOptions[i].click();
                    break;
                }
            }
        }
    }
});