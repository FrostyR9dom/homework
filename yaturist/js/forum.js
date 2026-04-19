/**
 * forum.js - Логика форума
 */

// Данные форума
let forumData = {
    sections: {
        general: { name: 'Общие темы', topics: [] },
        companions: { name: 'Поиск попутчиков', topics: [] },
        equipment: { name: 'Снаряжение', topics: [] },
        reports: { name: 'Отчёты о походах', topics: [] },
        beginners: { name: 'Вопросы новичков', topics: [] }
    }
};

// Загрузка данных из localStorage
function loadForumData() {
    const saved = localStorage.getItem('yaturist_forum_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Объединяем с дефолтными секциями
            for (let section in forumData.sections) {
                if (parsed.sections && parsed.sections[section]) {
                    forumData.sections[section].topics = parsed.sections[section].topics || [];
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки форума:', e);
        }
    }

    // Добавляем демо-темы, если форум пустой
    if (isForumEmpty()) {
        addDemoTopics();
    }
}

function saveForumData() {
    localStorage.setItem('yaturist_forum_data', JSON.stringify(forumData));
}

function isForumEmpty() {
    for (let section in forumData.sections) {
        if (forumData.sections[section].topics.length > 0) return false;
    }
    return true;
}

function addDemoTopics() {
    const demoTopic1 = {
        id: Date.now() - 100000,
        title: 'Ищу компанию для похода на Эльбрус',
        author: 'Алексей',
        authorId: 1,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        posts: [{
            id: Date.now() - 100000,
            author: 'Алексей',
            authorId: 1,
            message: 'Планирую поход на Эльбрус в августе. Ищу 2-3 попутчиков с опытом горных походов.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }],
        views: 156,
        lastPostDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastPostAuthor: 'Мария'
    };

    const demoTopic2 = {
        id: Date.now() - 50000,
        title: 'Как выбрать палатку для зимних походов?',
        author: 'Дмитрий',
        authorId: 2,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        posts: [{
            id: Date.now() - 50000,
            author: 'Дмитрий',
            authorId: 2,
            message: 'Посоветуйте хорошую палатку для зимних условий. Бюджет до 30000 руб.',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }],
        views: 89,
        lastPostDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        lastPostAuthor: 'Сергей'
    };

    forumData.sections.companions.topics.push(demoTopic1);
    forumData.sections.equipment.topics.push(demoTopic2);

    saveForumData();
}

// Рендеринг разделов
function renderSections() {
    for (let sectionId in forumData.sections) {
        const section = forumData.sections[sectionId];
        const container = document.getElementById(`section-${sectionId}`);
        if (!container) continue;

        if (section.topics.length === 0) {
            container.innerHTML = `
                <div class="empty-topics">
                    <i class="fas fa-comments"></i>
                    <p>В этом разделе пока нет тем</p>
                    <button class="btn btn-primary btn-small" onclick="openCreateTopicModal('${sectionId}')">
                        <i class="fas fa-plus"></i> Создать первую тему
                    </button>
                </div>
            `;
            continue;
        }

        let html = '';
        section.topics.sort((a, b) => new Date(b.lastPostDate) - new Date(a.lastPostDate));

        section.topics.forEach(topic => {
            const lastPostDate = new Date(topic.lastPostDate).toLocaleDateString('ru-RU');
            const createdDate = new Date(topic.createdAt).toLocaleDateString('ru-RU');

            html += `
                <div class="topic-item" onclick="viewTopic('${sectionId}', ${topic.id})">
                    <div class="topic-icon">
                        <i class="fas fa-comment"></i>
                    </div>
                    <div class="topic-content">
                        <div class="topic-title">${escapeHtml(topic.title)}</div>
                        <div class="topic-meta">
                            <span><i class="fas fa-user"></i> ${escapeHtml(topic.author)}</span>
                            <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <div class="topic-posts">${topic.posts.length}</div>
                        <div class="topic-views">${topic.views} просмотров</div>
                    </div>
                    <div class="topic-last-post">
                        <i class="fas fa-reply"></i> ${lastPostDate}<br>
                        <span class="author">${escapeHtml(topic.lastPostAuthor)}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateForumStats();
}

// Обновление статистики
function updateForumStats() {
    let totalTopics = 0;
    let totalPosts = 0;

    for (let sectionId in forumData.sections) {
        const section = forumData.sections[sectionId];
        totalTopics += section.topics.length;
        section.topics.forEach(topic => {
            totalPosts += topic.posts.length;
        });

        // Обновляем счётчики в заголовках секций
        const sectionCard = document.querySelector(`#section-${sectionId}`).closest('.forum-section-card');
        if (sectionCard) {
            sectionCard.querySelector('.topics-count').textContent = section.topics.length;
            let postsCount = 0;
            section.topics.forEach(t => postsCount += t.posts.length);
            sectionCard.querySelector('.posts-count').textContent = postsCount;
        }
    }

    document.getElementById('totalTopics').textContent = totalTopics;
    document.getElementById('totalPosts').textContent = totalPosts;
}

// Переключение секций
function toggleSection(header) {
    const topics = header.nextElementSibling;
    const toggle = header.querySelector('.section-toggle');

    if (topics.style.display === 'none') {
        topics.style.display = 'block';
        toggle.style.transform = 'rotate(0deg)';
    } else {
        topics.style.display = 'none';
        toggle.style.transform = 'rotate(-90deg)';
    }
}

// Просмотр темы
function viewTopic(sectionId, topicId) {
    const section = forumData.sections[sectionId];
    const topic = section.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.views++;
    saveForumData();

    document.getElementById('sectionsView').style.display = 'none';
    document.getElementById('topicView').style.display = 'block';

    // Обновляем хлебные крошки
    document.getElementById('breadcrumbs').innerHTML = `
        <a href="index.html">Главная</a> <i class="fas fa-chevron-right"></i>
        <a href="#" onclick="backToSections()">Форум</a> <i class="fas fa-chevron-right"></i>
        <span>${escapeHtml(topic.title)}</span>
    `;

    renderTopic(sectionId, topic);
}

// Рендеринг темы
function renderTopic(sectionId, topic) {
    const container = document.getElementById('topicContent');

    let postsHtml = '';
    topic.posts.forEach((post, index) => {
        const postDate = new Date(post.createdAt).toLocaleString('ru-RU');
        const avatarLetter = post.author.charAt(0).toUpperCase();

        postsHtml += `
            <div class="post-item" id="post-${post.id}">
                <div class="post-avatar">${avatarLetter}</div>
                <div class="post-content">
                    <div class="post-header">
                        <span class="post-author">${escapeHtml(post.author)}</span>
                        <span class="post-date"><i class="far fa-clock"></i> ${postDate}</span>
                        ${index === 0 ? '<span class="topic-badge">Автор темы</span>' : ''}
                    </div>
                    <div class="post-text">${escapeHtml(post.message).replace(/\n/g, '<br>')}</div>
                    <div class="post-actions">
                        <button onclick="quotePost('${sectionId}', ${topic.id}, ${post.id})">
                            <i class="fas fa-quote-right"></i> Цитировать
                        </button>
                        <button onclick="replyToPost('${sectionId}', ${topic.id}, '${escapeHtml(post.author)}')">
                            <i class="fas fa-reply"></i> Ответить
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="topic-detail">
            <div class="topic-detail-header">
                <h2>${escapeHtml(topic.title)}</h2>
                <div class="topic-meta">
                    <span><i class="fas fa-user"></i> Автор: ${escapeHtml(topic.author)}</span>
                    <span><i class="fas fa-calendar"></i> Создана: ${new Date(topic.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span><i class="fas fa-eye"></i> Просмотров: ${topic.views}</span>
                    <span><i class="fas fa-comments"></i> Ответов: ${topic.posts.length - 1}</span>
                </div>
            </div>
            <div class="topic-posts">
                ${postsHtml}
            </div>
            <div class="reply-form">
                <h3><i class="fas fa-reply"></i> Ответить в теме</h3>
                <form onsubmit="submitReply(event, '${sectionId}', ${topic.id})">
                    <div class="form-group">
                        <textarea id="replyMessage" rows="4" placeholder="Ваше сообщение..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Отправить
                    </button>
                </form>
            </div>
        </div>
    `;
}

// Ответ в теме
function submitReply(event, sectionId, topicId) {
    event.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        alert('❌ Чтобы ответить, необходимо войти в аккаунт!');
        window.location.href = 'register.html';
        return;
    }

    const message = document.getElementById('replyMessage').value.trim();
    if (!message) {
        alert('❌ Введите сообщение');
        return;
    }

    const section = forumData.sections[sectionId];
    const topic = section.topics.find(t => t.id === topicId);

    const newPost = {
        id: Date.now(),
        author: `${user.firstName} ${user.lastName}`,
        authorId: user.id,
        message: message,
        createdAt: new Date().toISOString()
    };

    topic.posts.push(newPost);
    topic.lastPostDate = newPost.createdAt;
    topic.lastPostAuthor = newPost.author;

    saveForumData();
    renderTopic(sectionId, topic);
    updateForumStats();
}

// Возврат к разделам
function backToSections() {
    document.getElementById('sectionsView').style.display = 'block';
    document.getElementById('topicView').style.display = 'none';

    document.getElementById('breadcrumbs').innerHTML = `
        <a href="index.html">Главная</a> <i class="fas fa-chevron-right"></i>
        <span>Форум</span>
    `;

    renderSections();
}

// Модальное окно создания темы
function openCreateTopicModal(presetSection = null) {
    const user = getCurrentUser();
    if (!user) {
        alert('❌ Чтобы создать тему, необходимо войти в аккаунт!');
        window.location.href = 'register.html';
        return;
    }

    const modal = document.getElementById('createTopicModal');
    modal.classList.add('active');

    if (presetSection) {
        document.getElementById('topicSection').value = presetSection;
    }

    document.getElementById('topicTitle').value = '';
    document.getElementById('topicMessage').value = '';
}

function closeModal() {
    document.getElementById('createTopicModal').classList.remove('active');
}

// Создание темы
document.addEventListener('DOMContentLoaded', function() {
    loadForumData();
    renderSections();

    // Обработчик создания темы
    document.getElementById('createTopicBtn').addEventListener('click', () => openCreateTopicModal());

    // Обработчик формы
    document.getElementById('createTopicForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const user = getCurrentUser();
        if (!user) {
            alert('❌ Необходимо войти в аккаунт');
            window.location.href = 'register.html';
            return;
        }

        const sectionId = document.getElementById('topicSection').value;
        const title = document.getElementById('topicTitle').value.trim();
        const message = document.getElementById('topicMessage').value.trim();

        if (!title || !message) {
            alert('❌ Заполните все поля');
            return;
        }

        const newTopic = {
            id: Date.now(),
            title: title,
            author: `${user.firstName} ${user.lastName}`,
            authorId: user.id,
            createdAt: new Date().toISOString(),
            posts: [{
                id: Date.now(),
                author: `${user.firstName} ${user.lastName}`,
                authorId: user.id,
                message: message,
                createdAt: new Date().toISOString()
            }],
            views: 1,
            lastPostDate: new Date().toISOString(),
            lastPostAuthor: `${user.firstName} ${user.lastName}`
        };

        forumData.sections[sectionId].topics.push(newTopic);
        saveForumData();

        closeModal();
        renderSections();

        // Открываем созданную тему
        setTimeout(() => viewTopic(sectionId, newTopic.id), 100);
    });

    // Закрытие модального окна
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Клик вне модального окна
    document.getElementById('createTopicModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Кнопка назад
    document.querySelector('.back-to-forum').addEventListener('click', backToSections);

    // Обновление UI авторизации
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

// Вспомогательные функции
function quotePost(sectionId, topicId, postId) {
    const section = forumData.sections[sectionId];
    const topic = section.topics.find(t => t.id === topicId);
    const post = topic.posts.find(p => p.id === postId);

    const textarea = document.getElementById('replyMessage');
    textarea.value = `> ${post.author} написал:\n> ${post.message.replace(/\n/g, '\n> ')}\n\n`;
    textarea.focus();
}

function replyToPost(sectionId, topicId, author) {
    const textarea = document.getElementById('replyMessage');
    textarea.value = `${author}, `;
    textarea.focus();
}