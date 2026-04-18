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

// ===== ГАЛЕРЕЯ ФОТОГРАФИЙ =====
document.addEventListener('DOMContentLoaded', function() {
    var galleryGrid = document.getElementById('galleryGrid');
    var uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    var gallerySort = document.getElementById('gallerySort');
    var loadMorePhotos = document.getElementById('loadMorePhotos');

    if (galleryGrid) {
        // Загружаем фото из localStorage
        loadGallery();

        // Кнопка загрузки фото
        if (uploadPhotoBtn) {
            uploadPhotoBtn.addEventListener('click', function() {
                // Проверяем авторизацию
                if (typeof getCurrentUser === 'function' && !getCurrentUser()) {
                    alert('⚠️ Чтобы загрузить фото, необходимо войти в аккаунт!');
                    window.location.href = 'register.html';
                    return;
                }

                // Имитация загрузки
                var photoUrl = prompt('Введите URL фото:');
                if (photoUrl) {
                    var rating = prompt('Оцените фото (1-100):', '50');
                    rating = Math.max(1, Math.min(100, parseInt(rating) || 50));

                    addPhotoToGallery(photoUrl, rating);
                    saveGallery();
                    loadGallery();
                }
            });
        }

        // Сортировка
        if (gallerySort) {
            gallerySort.addEventListener('change', loadGallery);
        }

        // Загрузить ещё
        if (loadMorePhotos) {
            loadMorePhotos.addEventListener('click', function() {
                // Имитация загрузки
                alert('⬇️ Загружаем ещё фото...');
            });
        }
    }

    function loadGallery() {
        if (!galleryGrid) return;

        var photos = getGalleryPhotos();
        var sortBy = gallerySort ? gallerySort.value : 'rating';

        // Сортировка
        photos.sort(function(a, b) {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'newest') return b.date - a.date;
            if (sortBy === 'oldest') return a.date - b.date;
            return 0;
        });

        galleryGrid.innerHTML = '';

        photos.forEach(function(photo) {
            var item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${photo.url}" alt="Фото путешествия" class="gallery-image" onerror="this.src='img/placeholder.jpg'">
                <div class="gallery-info">
                    <div class="gallery-author">
                        <div class="author-avatar">${photo.author.charAt(0).toUpperCase()}</div>
                        <span>${photo.author}</span>
                    </div>
                    <div class="gallery-rating">
                        <i class="fas fa-star"></i>
                        <span>${photo.rating}/100</span>
                    </div>
                </div>
            `;
            galleryGrid.appendChild(item);
        });
    }

    function addPhotoToGallery(url, rating) {
        var photos = getGalleryPhotos();
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : { name: 'Аноним' };

        photos.push({
            url: url,
            rating: rating,
            author: user.name || 'Аноним',
            date: Date.now()
        });

        localStorage.setItem('yaturist_gallery', JSON.stringify(photos));
    }

    function getGalleryPhotos() {
        var photos = localStorage.getItem('yaturist_gallery');
        return photos ? JSON.parse(photos) : [];
    }

    function saveGallery() {
        // Уже сохраняется в addPhotoToGallery
    }
});

// ===== ФОРУМ =====
document.addEventListener('DOMContentLoaded', function() {
    var forumThreads = document.getElementById('forumThreads');
    var createTopicBtn = document.getElementById('createTopicBtn');
    var loadMoreTopics = document.getElementById('loadMoreTopics');

    if (forumThreads) {
        // Загружаем темы
        loadForum();

        // Создание темы
        if (createTopicBtn) {
            createTopicBtn.addEventListener('click', function() {
                // Проверяем авторизацию
                if (typeof getCurrentUser === 'function' && !getCurrentUser()) {
                    alert('⚠️ Чтобы создать тему, необходимо войти в аккаунт!');
                    window.location.href = 'register.html';
                    return;
                }

                var title = prompt('Название темы:');
                var content = prompt('Описание темы:');

                if (title && content) {
                    addForumTopic(title, content);
                    saveForum();
                    loadForum();
                }
            });
        }

        // Загрузить ещё
        if (loadMoreTopics) {
            loadMoreTopics.addEventListener('click', function() {
                alert('⬇️ Загружаем ещё темы...');
            });
        }
    }

    function loadForum() {
        if (!forumThreads) return;

        var topics = getForumTopics();
        forumThreads.innerHTML = '';

        topics.forEach(function(topic) {
            var thread = document.createElement('div');
            thread.className = 'forum-thread';
            thread.innerHTML = `
                <div class="forum-thread-header">
                    <h3 class="forum-thread-title">${topic.title}</h3>
                    <div class="forum-thread-meta">
                        <span>${topic.author}</span> • 
                        <span>${new Date(topic.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="forum-thread-content">${topic.content}</div>
                <div class="forum-thread-stats">
                    <span><i class="fas fa-eye"></i> ${topic.views || 0} просмотров</span>
                    <span><i class="fas fa-reply"></i> ${topic.replies || 0} ответов</span>
                </div>
            `;
            forumThreads.appendChild(thread);
        });
    }

    function addForumTopic(title, content) {
        var topics = getForumTopics();
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : { name: 'Аноним' };

        topics.push({
            title: title,
            content: content,
            author: user.name || 'Аноним',
            date: Date.now(),
            views: 0,
            replies: 0
        });

        localStorage.setItem('yaturist_forum', JSON.stringify(topics));
    }

    function getForumTopics() {
        var topics = localStorage.getItem('yaturist_forum');
        return topics ? JSON.parse(topics) : [];
    }

    function saveForum() {
        // Уже сохраняется в addForumTopic
    }
});