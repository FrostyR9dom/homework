/**
 * gallery.js - Логика галереи
 */

let galleryPhotos = [];
let currentPage = 1;
const PHOTOS_PER_PAGE = 12;
let currentPhotoId = null;

// Загрузка галереи
function loadGallery() {
    const saved = localStorage.getItem('yaturist_gallery');
    if (saved) {
        try {
            galleryPhotos = JSON.parse(saved);
        } catch (e) {
            galleryPhotos = [];
        }
    }

    // Добавляем демо-фото если галерея пуста
    if (galleryPhotos.length === 0) {
        addDemoPhotos();
    }
}

function addDemoPhotos() {
    const demoPhotos = [
        { id: 1, author: 'Анна', rating: 95, votes: 24, date: Date.now() - 7 * 24 * 60 * 60 * 1000 },
        { id: 2, author: 'Сергей', rating: 88, votes: 18, date: Date.now() - 5 * 24 * 60 * 60 * 1000 },
        { id: 3, author: 'Мария', rating: 92, votes: 21, date: Date.now() - 3 * 24 * 60 * 60 * 1000 }
    ];

    demoPhotos.forEach(photo => {
        photo.photoData = `https://picsum.photos/400/300?random=${photo.id}`;
    });

    galleryPhotos = demoPhotos;
    saveGallery();
}

function saveGallery() {
    localStorage.setItem('yaturist_gallery', JSON.stringify(galleryPhotos));
}

// Рендеринг галереи
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
                <div class="empty-gallery">
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
        const avatarLetter = photo.author.charAt(0).toUpperCase();

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
                        <span style="color: var(--gray);">(${photo.votes} голосов)</span>
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
    if (endIndex >= sortedPhotos.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Загрузка фото
function uploadPhoto(file) {
    const user = getCurrentUser();
    if (!user) {
        alert('❌ Чтобы загрузить фото, необходимо войти в аккаунт!');
        window.location.href = 'register.html';
        return;
    }

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
        renderGallery(document.getElementById('gallerySort').value, currentPage);
        alert('✅ Фото успешно загружено!');
    };
    reader.readAsDataURL(file);
}

// Модальное окно просмотра фото
function openPhotoModal(photoId) {
    const photo = galleryPhotos.find(p => p.id === photoId);
    if (!photo) return;

    currentPhotoId = photoId;

    const modal = document.getElementById('photoModal');
    const modalPhoto = document.getElementById('modalPhoto');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalRating = document.getElementById('modalRating');

    modalPhoto.src = photo.photoData;
    modalAuthor.textContent = `${photo.author} • ${new Date(photo.date).toLocaleDateString('ru-RU')}`;

    const avgRating = photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : '0.0';
    modalRating.innerHTML = `<i class="fas fa-star" style="color: #FFC107;"></i> ${avgRating} (${photo.votes} голосов)`;

    modal.classList.add('active');
}

// Голосование за фото
function voteForPhoto(rating) {
    if (!currentPhotoId) return;

    const user = getCurrentUser();
    if (!user) {
        alert('❌ Чтобы голосовать, необходимо войти в аккаунт!');
        return;
    }

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
        renderGallery(document.getElementById('gallerySort').value, currentPage);
        alert(`✅ Вы оценили фото на ${rating} баллов!`);
    }
}

function closeModal() {
    document.getElementById('photoModal').classList.remove('active');
    currentPhotoId = null;
}

// Топ-10 для главной страницы
function renderHomeGallery() {
    const container = document.getElementById('homeGalleryGrid');
    if (!container) return;

    loadGallery();

    // Сортируем по рейтингу и берём топ-10
    const topPhotos = [...galleryPhotos]
        .sort((a, b) => (b.rating / Math.max(b.votes, 1)) - (a.rating / Math.max(a.votes, 1)))
        .slice(0, 10);

    if (topPhotos.length === 0) {
        container.innerHTML = '<p class="empty-state">Фотографий пока нет</p>';
        return;
    }

    let html = '';
    topPhotos.forEach(photo => {
        const avgRating = photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : '0.0';
        const avatarLetter = photo.author.charAt(0).toUpperCase();

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

// Превью форума для главной
function renderForumPreview() {
    const container = document.getElementById('forumPreview');
    if (!container) return;

    const saved = localStorage.getItem('yaturist_forum_data');
    if (!saved) {
        container.innerHTML = '<p class="empty-state">Тем пока нет</p>';
        return;
    }

    try {
        const forumData = JSON.parse(saved);
        let allTopics = [];

        for (let section in forumData.sections) {
            allTopics = allTopics.concat(forumData.sections[section].topics);
        }

        // Последние 5 тем
        const recentTopics = allTopics
            .sort((a, b) => new Date(b.lastPostDate) - new Date(a.lastPostDate))
            .slice(0, 5);

        if (recentTopics.length === 0) {
            container.innerHTML = '<p class="empty-state">Тем пока нет</p>';
            return;
        }

        let html = '<div class="forum-preview-list">';
        recentTopics.forEach(topic => {
            html += `
                <div class="forum-preview-item">
                    <i class="fas fa-comment"></i>
                    <div class="preview-content">
                        <h4>${escapeHtml(topic.title)}</h4>
                        <span>${escapeHtml(topic.author)} • ${topic.posts.length} ответов</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p class="empty-state">Ошибка загрузки форума</p>';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Для страницы галереи
    if (document.getElementById('fullGalleryGrid')) {
        loadGallery();
        renderGallery('rating', 1);

        // Загрузка фото
        document.getElementById('uploadPhotoBtn').addEventListener('click', function() {
            document.getElementById('photoFileInput').click();
        });

        document.getElementById('photoFileInput').addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                uploadPhoto(this.files[0]);
                this.value = '';
            }
        });

        // Сортировка
        document.getElementById('gallerySort').addEventListener('change', function() {
            currentPage = 1;
            renderGallery(this.value, currentPage);
        });

        // Загрузить ещё
        document.getElementById('loadMorePhotos').addEventListener('click', function() {
            currentPage++;
            renderGallery(document.getElementById('gallerySort').value, currentPage);
        });

        // Голосование
        document.getElementById('submitRating').addEventListener('click', function() {
            const rating = parseInt(document.getElementById('ratingSlider').value);
            voteForPhoto(rating);
        });

        // Закрытие модального окна
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        document.getElementById('photoModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }

    // Для главной страницы
    if (document.getElementById('homeGalleryGrid')) {
        renderHomeGallery();
    }

    if (document.getElementById('forumPreview')) {
        renderForumPreview();
    }

    // Обновление UI
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
});

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}