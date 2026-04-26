/**
 * gallery.js - Логика галереи с проверкой авторизации
 * Только авторизованные пользователи могут загружать фото и голосовать
 */

let galleryPhotos = [];
let currentPage = 1;
const PHOTOS_PER_PAGE = 12;
let currentPhotoId = null;

// ============================================================
// ПРОВЕРКА АВТОРИЗАЦИИ
// ============================================================

/**
 * Проверяет, авторизован ли пользователь
 * @param {string} action - Действие, для которого требуется авторизация
 * @returns {boolean} - true если авторизован
 */
function requireAuth(action) {
    // Проверяем, что функция getCurrentUser существует (из auth.js)
    if (typeof getCurrentUser !== 'function') {
        console.error('auth.js не загружен!');
        alert('Ошибка: система авторизации не загружена');
        return false;
    }

    const user = getCurrentUser();
    if (!user) {
        alert(`❌ Чтобы ${action}, необходимо войти в аккаунт!`);
        // Сохраняем текущую страницу для редиректа после входа
        localStorage.setItem('redirect_after_login', window.location.href);
        window.location.href = 'register.html';
        return false;
    }
    return true;
}

// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ ДАННЫХ
// ============================================================

/**
 * Загружает фотографии из localStorage
 */
function loadGallery() {
    const saved = localStorage.getItem('svoyatropa_gallery') || localStorage.getItem('yaturist_gallery');
    if (saved) {
        try {
            galleryPhotos = JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка загрузки галереи:', e);
            galleryPhotos = [];
        }
    }

    // Добавляем демо-фото если галерея пуста
    if (galleryPhotos.length === 0) {
        addDemoPhotos();
    }
}

/**
 * Добавляет демонстрационные фотографии
 */
function addDemoPhotos() {
    const demoPhotos = [{
            id: 1,
            author: 'Анна',
            rating: 95,
            votes: 24,
            date: Date.now() - 7 * 24 * 60 * 60 * 1000,
            photoData: 'https://picsum.photos/400/300?random=1'
        },
        {
            id: 2,
            author: 'Сергей',
            rating: 88,
            votes: 18,
            date: Date.now() - 5 * 24 * 60 * 60 * 1000,
            photoData: 'https://picsum.photos/400/300?random=2'
        },
        {
            id: 3,
            author: 'Мария',
            rating: 92,
            votes: 21,
            date: Date.now() - 3 * 24 * 60 * 60 * 1000,
            photoData: 'https://picsum.photos/400/300?random=3'
        },
        {
            id: 4,
            author: 'Дмитрий',
            rating: 78,
            votes: 15,
            date: Date.now() - 10 * 24 * 60 * 60 * 1000,
            photoData: 'https://picsum.photos/400/300?random=4'
        },
        {
            id: 5,
            author: 'Елена',
            rating: 98,
            votes: 30,
            date: Date.now() - 2 * 24 * 60 * 60 * 1000,
            photoData: 'https://picsum.photos/400/300?random=5'
        }
    ];

    galleryPhotos = demoPhotos;
    saveGallery();
}

/**
 * Сохраняет фотографии в localStorage
 */
function saveGallery() {
    localStorage.setItem('svoyatropa_gallery', JSON.stringify(galleryPhotos));
    localStorage.setItem('yaturist_gallery', JSON.stringify(galleryPhotos));
}

// ============================================================
// РЕНДЕРИНГ ГАЛЕРЕИ
// ============================================================

/**
 * Отображает фотографии в галерее
 * @param {string} sortBy - Критерий сортировки ('rating', 'newest', 'oldest')
 * @param {number} page - Номер страницы для пагинации
 */
function renderGallery(sortBy = 'rating', page = 1) {
    const container = document.getElementById('fullGalleryGrid');
    if (!container) return;

    // Сортировка
    let sortedPhotos = [...galleryPhotos];
    if (sortBy === 'rating') {
        sortedPhotos.sort((a, b) => (b.rating / Math.max(b.votes, 1)) - (a.rating / Math.max(a.votes, 1)));
    } else if (sortBy === 'newest') {
        sortedPhotos.sort((a, b) => b.date - a.date);
    } else if (sortBy === 'oldest') {
        sortedPhotos.sort((a, b) => a.date - b.date);
    }

    // Пагинация
    const startIndex = (page - 1) * PHOTOS_PER_PAGE;
    const endIndex = startIndex + PHOTOS_PER_PAGE;
    const pagePhotos = sortedPhotos.slice(startIndex, endIndex);

    if (pagePhotos.length === 0) {
        if (page === 1) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h3>Галерея пуста</h3>
                    <p>Будьте первым, кто загрузит фотографию!</p>
                </div>
            `;
        }
        document.getElementById('loadMorePhotos').style.display = 'none';
        return;
    }

    let html = '';
    pagePhotos.forEach(photo => {
        const avgRating = photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : '0.0';
        const date = new Date(photo.date).toLocaleDateString('ru-RU');
        const avatarLetter = photo.author ? photo.author.charAt(0).toUpperCase() : '?';

        html += `
            <div class="gallery-item" onclick="openPhotoModal(${photo.id})">
                <img src="${photo.photoData}" alt="Фото от ${escapeHtml(photo.author)}" class="gallery-image" onerror="this.src='https://picsum.photos/400/300?random=${photo.id}'">
                <div class="gallery-info">
                    <div class="gallery-author">
                        <div class="author-avatar-small">${avatarLetter}</div>
                        <span>${escapeHtml(photo.author)}</span>
                    </div>
                    <div class="gallery-rating">
                        <i class="fas fa-star"></i>
                        <span>${avgRating}</span>
                        <span style="color: var(--gray); font-size: 0.8rem;">(${photo.votes})</span>
                    </div>
                    <div class="gallery-date">
                        <i class="far fa-calendar"></i> ${date}
                    </div>
                </div>
            </div>
        `;
    });

    if (page === 1) {
        container.innerHTML = html;
    } else {
        container.insertAdjacentHTML('beforeend', html);
    }

    // Показываем/скрываем кнопку "Загрузить ещё"
    const loadMoreBtn = document.getElementById('loadMorePhotos');
    if (loadMoreBtn) {
        if (endIndex >= sortedPhotos.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

// ============================================================
// ЗАГРУЗКА ФОТО (ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ)
// ============================================================

/**
 * Загружает новое фото в галерею
 * @param {File} file - Файл изображения
 */
function uploadPhoto(file) {
    // ПРОВЕРКА АВТОРИЗАЦИИ
    if (!requireAuth('загрузить фото')) return;

    const user = getCurrentUser();

    const reader = new FileReader();
    reader.onload = function(e) {
        const newPhoto = {
            id: Date.now(),
            photoData: e.target.result,
            author: `${user.firstName} ${user.lastName}`,
            authorId: user.id,
            rating: 50, // Начальный рейтинг
            votes: 1,
            date: Date.now()
        };

        galleryPhotos.push(newPhoto);
        saveGallery();

        currentPage = 1;
        const sortSelect = document.getElementById('gallerySort');
        renderGallery(sortSelect ? sortSelect.value : 'rating', currentPage);
        alert('✅ Фото успешно загружено!');
    };
    reader.readAsDataURL(file);
}

// ============================================================
// МОДАЛЬНОЕ ОКНО ПРОСМОТРА ФОТО
// ============================================================

/**
 * Открывает модальное окно с фотографией
 * @param {number} photoId - ID фотографии
 */
function openPhotoModal(photoId) {
    const photo = galleryPhotos.find(p => p.id === photoId);
    if (!photo) return;

    currentPhotoId = photoId;

    const modal = document.getElementById('photoModal');
    const modalPhoto = document.getElementById('modalPhoto');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalRating = document.getElementById('modalRating');

    if (!modal || !modalPhoto || !modalAuthor || !modalRating) return;

    modalPhoto.src = photo.photoData;
    modalAuthor.textContent = `${photo.author} • ${new Date(photo.date).toLocaleDateString('ru-RU')}`;

    const avgRating = photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : '0.0';
    modalRating.innerHTML = `<i class="fas fa-star" style="color: #FFC107;"></i> ${avgRating} (${photo.votes} голосов)`;

    modal.classList.add('active');
}

/**
 * Закрывает модальное окно
 */
function closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentPhotoId = null;
}

// ============================================================
// ГОЛОСОВАНИЕ ЗА ФОТО (ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ)
// ============================================================

/**
 * Голосование за фотографию
 * @param {number} rating - Оценка от 1 до 100
 */
function voteForPhoto(rating) {
    // ПРОВЕРКА АВТОРИЗАЦИИ
    if (!requireAuth('голосовать за фото')) return;

    if (!currentPhotoId) return;

    const user = getCurrentUser();
    const photo = galleryPhotos.find(p => p.id === currentPhotoId);

    if (photo) {
        // Проверяем, голосовал ли уже пользователь
        const voteKey = `vote_${currentPhotoId}_${user.id}`;
        if (localStorage.getItem(voteKey)) {
            alert('❌ Вы уже голосовали за это фото!');
            return;
        }

        photo.rating += rating;
        photo.votes += 1;
        localStorage.setItem(voteKey, 'true');
        saveGallery();

        closeModal();
        const sortSelect = document.getElementById('gallerySort');
        renderGallery(sortSelect ? sortSelect.value : 'rating', currentPage);
        alert(`✅ Вы оценили фото на ${rating} баллов!`);
    }
}

// ============================================================
// ТОП-10 ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
// ============================================================

/**
 * Отображает топ-10 фотографий на главной странице
 */
function renderHomeGallery() {
    const container = document.getElementById('homeGalleryGrid');
    if (!container) return;

    loadGallery();

    // Сортируем по рейтингу и берём топ-10
    const topPhotos = [...galleryPhotos]
        .sort((a, b) => (b.rating / Math.max(b.votes, 1)) - (a.rating / Math.max(a.votes, 1)))
        .slice(0, 10);

    if (topPhotos.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-images"></i><br>Фотографий пока нет</p>';
        return;
    }

    let html = '';
    topPhotos.forEach(photo => {
        const avgRating = photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : '0.0';
        const avatarLetter = photo.author ? photo.author.charAt(0).toUpperCase() : '?';

        html += `
            <div class="gallery-item">
                <img src="${photo.photoData}" alt="Фото от ${escapeHtml(photo.author)}" class="gallery-image" onerror="this.src='https://picsum.photos/400/300?random=${photo.id}'">
                <div class="gallery-info">
                    <div class="gallery-author">
                        <div class="author-avatar-small">${avatarLetter}</div>
                        <span>${escapeHtml(photo.author)}</span>
                    </div>
                    <div class="gallery-rating">
                        <i class="fas fa-star"></i>
                        <span>${avgRating}</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Экранирует HTML для защиты от XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // Для страницы галереи (gallery.html)
    if (document.getElementById('fullGalleryGrid')) {
        loadGallery();
        renderGallery('rating', 1);

        // Кнопка загрузки фото
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const fileInput = document.getElementById('photoFileInput');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', function() {
                fileInput.click();
            });

            fileInput.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    uploadPhoto(this.files[0]);
                    this.value = ''; // Очищаем input
                }
            });
        }

        // Сортировка
        const sortSelect = document.getElementById('gallerySort');
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                currentPage = 1;
                renderGallery(this.value, currentPage);
            });
        }

        // Кнопка "Загрузить ещё"
        const loadMoreBtn = document.getElementById('loadMorePhotos');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
                currentPage++;
                renderGallery(sortSelect ? sortSelect.value : 'rating', currentPage);
            });
        }

        // Кнопка голосования
        const submitRatingBtn = document.getElementById('submitRating');
        if (submitRatingBtn) {
            submitRatingBtn.addEventListener('click', function() {
                const slider = document.getElementById('ratingSlider');
                if (slider) {
                    voteForPhoto(parseInt(slider.value));
                }
            });
        }

        // Закрытие модального окна
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) closeModal();
            });
        }
    }

    // Для главной страницы (index.html)
    if (document.getElementById('homeGalleryGrid')) {
        renderHomeGallery();
    }

    // Обновление UI авторизации
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

    console.log('✅ gallery.js загружен');
});