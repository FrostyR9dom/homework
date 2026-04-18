/**
 * profile.js - Логика личного кабинета
 */

// Функция для экранирования HTML (защита от XSS)
function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {

    console.log('profile.js загружен');

    // ===== 1. ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
    function loadUserProfile() {
        // Проверяем, что функция getCurrentUser существует
        if (typeof getCurrentUser === 'undefined') {
            console.error('getCurrentUser не определена! auth.js не загружен?');
            setTimeout(loadUserProfile, 100); // Пробуем ещё раз через 100мс
            return;
        }

        var currentUser = getCurrentUser();
        console.log('currentUser:', currentUser);

        if (!currentUser) {
            window.location.href = 'register.html';
            return;
        }

        // Заполняем данные
        document.getElementById('profileName').textContent = currentUser.firstName + ' ' + currentUser.lastName;

        var userNameSpans = document.querySelectorAll('#profileUserName');
        for (var i = 0; i < userNameSpans.length; i++) {
            userNameSpans[i].textContent = currentUser.firstName + ' ' + currentUser.lastName;
        }

        var avatarImg = document.getElementById('profileAvatar');
        if (currentUser.avatar && currentUser.avatar !== 'undefined') {
            avatarImg.src = currentUser.avatar;
        } else {
            avatarImg.src = 'img/avatars/default-avatar.png';
        }

        document.getElementById('profileBio').textContent = currentUser.bio || 'Путешественник. Люблю открывать новые места.';
        document.getElementById('profileLocation').textContent = currentUser.city ? currentUser.city + ', Краснодарский край' : 'Краснодарский край';

        if (currentUser.createdAt) {
            var date = new Date(currentUser.createdAt);
            document.getElementById('profileSince').textContent = 'На сайте с ' + date.getFullYear();
        } else {
            document.getElementById('profileSince').textContent = 'На сайте с 2024';
        }

        var authorStatusElement = document.getElementById('profileAuthorStatus');
        if (currentUser.isAuthor) {
            authorStatusElement.textContent = 'Верифицированный автор';
            authorStatusElement.style.color = '#43A047';
        } else {
            authorStatusElement.textContent = 'Путешественник';
            authorStatusElement.style.color = '#78909C';
        }

        var createRouteBtn = document.getElementById('createRouteBtn');
        if (createRouteBtn) {
            createRouteBtn.style.display = currentUser.isAuthor ? 'inline-flex' : 'none';
        }

        // Заполняем форму настроек
        document.getElementById('settingsFirstName').value = currentUser.firstName || '';
        document.getElementById('settingsLastName').value = currentUser.lastName || '';
        document.getElementById('settingsEmail').value = currentUser.email || '';
        document.getElementById('settingsCity').value = currentUser.city || '';
        document.getElementById('settingsBio').value = currentUser.bio || '';
        if (document.getElementById('settingsIsAuthor')) {
            document.getElementById('settingsIsAuthor').checked = currentUser.isAuthor || false;
        }

        // Загружаем маршруты и статистику
        loadUserRoutes(currentUser);
        loadPurchasedRoutes(currentUser);
        updateStatistics(currentUser);
    }

    // ===== 2. ЗАГРУЗКА МАРШРУТОВ ПОЛЬЗОВАТЕЛЯ =====
    function loadUserRoutes(currentUser) {
        var container = document.getElementById('myRoutesList');
        if (!container) return;

        var allRoutes = JSON.parse(localStorage.getItem('yatyrist_routes') || '[]');
        var myRoutes = allRoutes.filter(function(route) {
            return route.author && route.author.id === currentUser.id;
        });

        if (myRoutes.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-map-signs" style="font-size: 3rem; opacity: 0.3;"></i><br>У вас пока нет созданных маршрутов<br><a href="create-route.html" class="btn btn-primary btn-small" style="margin-top: 15px;">Создать маршрут</a></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < myRoutes.length; i++) {
            var route = myRoutes[i];
            var typeName = route.type === 'car' ? 'Авто' : (route.type === 'bike' ? 'Вело' : 'Пеший');
            var sales = route.sales || 0;
            var views = route.views || 0;
            var income = Math.round((route.price || 0) * sales * 0.7);

            html += '<div class="route-item" data-route-id="' + route.id + '">' +
                '<div class="route-item-img"><i class="fas fa-route"></i></div>' +
                '<div class="route-item-info">' +
                '<h3>' + escapeHtml(route.title) + '</h3>' +
                '<div class="route-item-meta">' +
                '<span class="badge ' + route.type + '">' + typeName + '</span>' +
                '<span><i class="fas fa-shopping-cart"></i> ' + sales + ' продаж</span>' +
                '<span><i class="fas fa-eye"></i> ' + views + ' просмотров</span>' +
                '</div>' +
                '<div class="route-item-stats">💰 Доход: ' + income.toLocaleString() + ' ₽</div>' +
                '</div>' +
                '<div class="route-item-actions">' +
                '<button class="btn-icon" onclick="editRoute(' + route.id + ')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn-icon" onclick="viewStats(' + route.id + ')"><i class="fas fa-chart-bar"></i></button>' +
                '<button class="btn-icon danger" onclick="deleteRoute(' + route.id + ')"><i class="fas fa-trash"></i></button>' +
                '</div></div>';
        }
        container.innerHTML = html;
    }

    // ===== 3. ЗАГРУЗКА КУПЛЕННЫХ МАРШРУТОВ =====
    function loadPurchasedRoutes(currentUser) {
        var container = document.getElementById('purchasedList');
        if (!container) return;

        var purchased = JSON.parse(localStorage.getItem('yatyrist_purchased_' + currentUser.id) || '[]');

        if (purchased.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag" style="font-size: 3rem; opacity: 0.3;"></i><br>У вас пока нет купленных маршрутов<br><a href="index.html" class="btn btn-primary btn-small" style="margin-top: 15px;">Купить маршрут</a></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < purchased.length; i++) {
            var item = purchased[i];
            html += '<div class="purchased-item">' +
                '<div class="purchased-img" style="background: linear-gradient(135deg, #66BB6A, #2E7D32); width: 80px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;"><i class="fas fa-map"></i></div>' +
                '<div class="purchased-info" style="flex: 1;">' +
                '<h3>' + item.title + '</h3>' +
                '<span class="author">Автор: ' + item.author + '</span>' +
                '<span class="purchase-date" style="display: block; color: #888; font-size: 12px;">Куплено: ' + item.purchaseDate + '</span>' +
                '</div>' +
                '<div class="purchased-actions">' +
                '<button class="btn btn-primary btn-small" onclick="downloadGPX(' + item.routeId + ')"><i class="fas fa-download"></i> Скачать GPX</button>' +
                '<button class="btn btn-outline btn-small" onclick="leaveReview(' + item.routeId + ')"><i class="fas fa-star"></i> Оставить отзыв</button>' +
                '</div></div>';
        }
        container.innerHTML = html;
    }

    // ===== 4. ОБНОВЛЕНИЕ СТАТИСТИКИ =====
    function updateStatistics(currentUser) {
        var allRoutes = JSON.parse(localStorage.getItem('yatyrist_routes') || '[]');
        var myRoutes = allRoutes.filter(function(route) {
            return route.author && route.author.id === currentUser.id;
        });

        var routesCount = myRoutes.length;
        var totalSales = 0;
        var totalIncome = 0;
        var totalRating = 0;
        var ratingCount = 0;

        for (var i = 0; i < myRoutes.length; i++) {
            var route = myRoutes[i];
            totalSales += route.sales || 0;
            totalIncome += Math.round((route.price || 0) * (route.sales || 0) * 0.7);

            var reviews = JSON.parse(localStorage.getItem('reviews_' + route.id) || '[]');
            for (var r = 0; r < reviews.length; r++) {
                totalRating += reviews[r].rating;
                ratingCount++;
            }
        }

        var avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

        document.getElementById('routesCount').textContent = routesCount;
        document.getElementById('salesCount').textContent = totalSales.toLocaleString();
        document.getElementById('avgRating').textContent = avgRating;
        document.getElementById('totalEarnings').textContent = totalIncome.toLocaleString() + ' ₽';
        document.getElementById('allTimeEarnings').textContent = totalIncome.toLocaleString() + ' ₽';

        var monthIncome = Math.round(totalIncome * 0.3);
        document.getElementById('monthEarnings').textContent = monthIncome.toLocaleString() + ' ₽';
        document.getElementById('availableEarnings').textContent = (totalIncome - monthIncome).toLocaleString() + ' ₽';

        // История операций
        updateEarningsHistory(myRoutes);
    }

    function updateEarningsHistory(myRoutes) {
        var tbody = document.getElementById('earningsTableBody');
        if (!tbody) return;

        var allTransactions = [];
        for (var i = 0; i < myRoutes.length; i++) {
            var route = myRoutes[i];
            var routePurchases = JSON.parse(localStorage.getItem('route_purchases_' + route.id) || '[]');
            for (var p = 0; p < routePurchases.length; p++) {
                var purchase = routePurchases[p];
                allTransactions.push({
                    date: purchase.date,
                    route: route.title,
                    amount: Math.round((route.price || 0) * 0.7),
                    status: 'success'
                });
            }
        }

        allTransactions.sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        if (allTransactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Нет операций</td></tr>';
            return;
        }

        var html = '';
        for (var t = 0; t < Math.min(allTransactions.length, 10); t++) {
            var trans = allTransactions[t];
            html += '<tr><td>' + trans.date + '</td><td>' + trans.route + '</td><td>' + trans.amount.toLocaleString() + ' ₽</td><td><span class="status success">Выплачено</span></td></tr>';
        }
        tbody.innerHTML = html;
    }

    // ===== 5. СОХРАНЕНИЕ НАСТРОЕК =====
    var settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var currentUser = getCurrentUser();
            if (!currentUser) return;

            currentUser.firstName = document.getElementById('settingsFirstName').value;
            currentUser.lastName = document.getElementById('settingsLastName').value;
            currentUser.email = document.getElementById('settingsEmail').value;
            currentUser.city = document.getElementById('settingsCity').value;
            currentUser.bio = document.getElementById('settingsBio').value;
            if (document.getElementById('settingsIsAuthor')) {
                currentUser.isAuthor = document.getElementById('settingsIsAuthor').checked;
            }

            if (typeof updateUserData === 'function') {
                updateUserData(currentUser);
            } else {
                localStorage.setItem('yatyrist_user', JSON.stringify(currentUser));
                var users = JSON.parse(localStorage.getItem('yatyrist_users') || '[]');
                var index = users.findIndex(function(u) { return u.id === currentUser.id; });
                if (index !== -1) {
                    users[index] = {...users[index], ...currentUser };
                    localStorage.setItem('yatyrist_users', JSON.stringify(users));
                }
            }

            loadUserProfile();
            alert('✅ Настройки сохранены!');
        });
    }

    // ===== 6. СМЕНА АВАТАРА =====
    var changeAvatarBtn = document.getElementById('changeAvatarBtn');
    var avatarInput = document.getElementById('avatarInput');
    var profileAvatar = document.getElementById('profileAvatar');

    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    var currentUser = getCurrentUser();
                    if (currentUser) {
                        currentUser.avatar = ev.target.result;
                        localStorage.setItem('yatyrist_user', JSON.stringify(currentUser));
                        profileAvatar.src = ev.target.result;
                        alert('✅ Аватар обновлён!');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ===== 7. КНОПКИ =====
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Выйти?')) {
                localStorage.removeItem('yatyrist_user');
                window.location.href = 'index.html';
            }
        });
    }

    var editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            document.querySelector('[data-tab="settings"]').click();
        });
    }

    var withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            alert('💰 Заявка на вывод средств создана!');
        });
    }

    // ===== 8. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
    var tabs = document.querySelectorAll('.profile-tab');
    var contents = document.querySelectorAll('.profile-tab-content');

    function switchTab(tabId) {
        for (var i = 0; i < contents.length; i++) {
            contents[i].classList.remove('active');
        }
        for (var j = 0; j < tabs.length; j++) {
            tabs[j].classList.remove('active');
        }
        var activeContent = document.getElementById(tabId);
        if (activeContent) activeContent.classList.add('active');
        var activeTab = document.querySelector('[data-tab="' + tabId + '"]');
        if (activeTab) activeTab.classList.add('active');
        localStorage.setItem('activeProfileTab', tabId);
    }

    for (var k = 0; k < tabs.length; k++) {
        tabs[k].addEventListener('click', function() {
            var tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    }

    var savedTab = localStorage.getItem('activeProfileTab');
    if (savedTab && document.getElementById(savedTab)) {
        switchTab(savedTab);
    }

    // ===== ГАЛЕРЕЯ ФОТО =====
    function initGallery() {
        let uploadBtn = document.getElementById('uploadGalleryPhotoBtn');
        let photoInput = document.getElementById('galleryPhotoInput');

        if (uploadBtn && photoInput) {
            uploadBtn.addEventListener('click', function() {
                let file = photoInput.files[0];
                if (!file) {
                    alert('Выбери фотографию');
                    return;
                }

                let reader = new FileReader();
                reader.onload = function(e) {
                    let gallery = JSON.parse(localStorage.getItem('yaturist_gallery') || '[]');
                    let currentUser = getCurrentUser();

                    gallery.push({
                        id: Date.now(),
                        photoData: e.target.result,
                        author: currentUser.firstName + ' ' + currentUser.lastName,
                        uploadedAt: new Date().toISOString(),
                        rating: 0,
                        votes: 0
                    });

                    localStorage.setItem('yaturist_gallery', JSON.stringify(gallery));
                    photoInput.value = '';
                    renderGallery();
                    alert('✅ Фото загружено!');
                };
                reader.readAsDataURL(file);
            });
        }

        renderGallery();
    }

    function renderGallery() {
        let gallery = JSON.parse(localStorage.getItem('yaturist_gallery') || '[]');
        let container = document.getElementById('galleryGrid');
        if (!container) return;

        // Сортируем по рейтингу (топ 10)
        gallery.sort((a, b) => (b.rating / Math.max(b.votes, 1)) - (a.rating / Math.max(a.votes, 1)));
        gallery = gallery.slice(0, 10);

        if (gallery.length === 0) {
            container.innerHTML = '<p class="empty-state">Фотографий ещё нет. Загрузи первой!</p>';
            return;
        }

        container.innerHTML = gallery.map((photo, idx) => {
            let avgRating = photo.votes > 0 ? (photo.rating / photo.votes).toFixed(1) : 0;
            return `
                <div style="border: 1px solid #ddd; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <img src="${photo.photoData}" style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 12px; color: #666;">${idx + 1}. ${photo.author}</span>
                            <span style="font-weight: bold; color: #2E7D32;">⭐ ${avgRating}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <input type="range" min="1" max="100" style="flex: 1;" id="rating-${photo.id}" data-photo-id="${photo.id}">
                            <button class="btn btn-primary btn-small" onclick="votePhoto(${photo.id})">Оценить</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.votePhoto = function(photoId) {
        let ratingInput = document.getElementById('rating-' + photoId);
        if (!ratingInput) return;

        let rating = parseInt(ratingInput.value);
        let gallery = JSON.parse(localStorage.getItem('yaturist_gallery') || '[]');
        let photo = gallery.find(p => p.id === photoId);

        if (photo) {
            photo.rating += rating;
            photo.votes += 1;
            localStorage.setItem('yaturist_gallery', JSON.stringify(gallery));
            renderGallery();
            alert(`✅ Ты оценил на ${rating} баллов!`);
        }
    };

    // ===== ФОРУМ ТУРИСТОВ =====
    function initForum() {
        let createBtn = document.getElementById('createForumTopicBtn');
        let titleInput = document.getElementById('forumTopicTitle');
        let messageInput = document.getElementById('forumTopicMessage');

        if (createBtn) {
            createBtn.addEventListener('click', function() {
                let title = titleInput.value.trim();
                let message = messageInput.value.trim();

                if (!title || !message) {
                    alert('Заполни название и сообщение');
                    return;
                }

                let threads = JSON.parse(localStorage.getItem('yaturist_forum') || '[]');
                let currentUser = getCurrentUser();

                let newThread = {
                    id: Date.now(),
                    title: title,
                    author: currentUser.firstName + ' ' + currentUser.lastName,
                    createdAt: new Date().toISOString(),
                    comments: [{
                        id: Date.now() + 1,
                        author: currentUser.firstName + ' ' + currentUser.lastName,
                        message: message,
                        createdAt: new Date().toISOString()
                    }]
                };

                threads.push(newThread);
                localStorage.setItem('yaturist_forum', JSON.stringify(threads));
                titleInput.value = '';
                messageInput.value = '';
                renderForum();
                alert('✅ Тема создана!');
            });
        }

        renderForum();
    }

    function renderForum() {
        let threads = JSON.parse(localStorage.getItem('yaturist_forum') || '[]');
        let container = document.getElementById('forumThreads');
        if (!container) return;

        // Сортируем по времени создания (новые первыми)
        threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (threads.length === 0) {
            container.innerHTML = '<p class="empty-state">Тем ещё нет. Будь первым!</p>';
            return;
        }

        container.innerHTML = threads.map(thread => {
            let createdDate = new Date(thread.createdAt).toLocaleDateString('ru-RU');
            return `
                <div style="border: 1px solid #ddd; border-radius: 12px; padding: 16px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <h4 style="margin: 0 0 4px; color: #333;">${escapeHtml(thread.title)}</h4>
                            <span style="font-size: 12px; color: #999;">${thread.author} • ${createdDate}</span>
                        </div>
                        <span style="background: #2E7D32; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                            ${thread.comments.length} ${thread.comments.length === 1 ? 'ответ' : 'ответов'}
                        </span>
                    </div>
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; max-height: 100px; overflow-y: auto;">
                        ${escapeHtml(thread.comments[thread.comments.length - 1].message)}
                    </div>
                    <button class="btn btn-small btn-outline" onclick="openThreadDetail(${thread.id})">
                        <i class="fas fa-reply"></i> Ответить
                    </button>
                </div>
            `;
        }).join('');
    }

    window.openThreadDetail = function(threadId) {
        let threads = JSON.parse(localStorage.getItem('yaturist_forum') || '[]');
        let thread = threads.find(t => t.id === threadId);
        if (!thread) return;

        let currentUser = getCurrentUser();
        let response = prompt('Твой ответ:');
        if (!response || !response.trim()) return;

        thread.comments.push({
            id: Date.now(),
            author: currentUser.firstName + ' ' + currentUser.lastName,
            message: response.trim(),
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('yaturist_forum', JSON.stringify(threads));
        renderForum();
        alert('✅ Ответ добавлен!');
    };

    // ЗАПУСКАЕМ ЗАГРУЗКУ
    loadUserProfile();
    console.log('✅ profile.js завершил загрузку');
});

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
function editRoute(id) {
    window.location.href = 'create-route.html?edit=' + id;
}

function viewStats(id) {
    alert('📊 Статистика маршрута #' + id);
}

function deleteRoute(id) {
    if (confirm('Удалить маршрут?')) {
        var allRoutes = JSON.parse(localStorage.getItem('yatyrist_routes') || '[]');
        var newRoutes = [];
        for (var i = 0; i < allRoutes.length; i++) {
            if (allRoutes[i].id !== id) {
                newRoutes.push(allRoutes[i]);
            }
        }
        localStorage.setItem('yatyrist_routes', JSON.stringify(newRoutes));
        alert('🗑️ Маршрут удалён');
        location.reload();
    }
}

function downloadGPX(id) {
    alert('⬇️ Скачивание GPX трека');
}

function leaveReview(id) {
    window.location.href = 'route.html?id=' + id;
}