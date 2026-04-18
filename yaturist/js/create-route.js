/**
 * create-route.js
 * Логика формы создания маршрута
 */

// Хранилище для фото
let selectedPhotos = [];

document.addEventListener('DOMContentLoaded', function() {

    // ===== ПРОВЕРКА АВТОРИЗАЦИИ =====
    function checkAuth() {
        // Проверяем что функция getCurrentUser существует
        if (typeof getCurrentUser === 'undefined') {
            console.error('auth.js не загружен!');
            alert('Ошибка: система авторизации не загружена. Обновите страницу.');
            return false;
        }

        let user = getCurrentUser();
        if (!user) {
            alert('⚠️ Чтобы создавать маршруты, необходимо войти в аккаунт!');
            window.location.href = 'register.html?mode=register&becomeAuthor=true';
            return false;
        }
        if (!user.isAuthor) {
            alert('⚠️ Чтобы создавать маршруты, нужно быть автором.\n\nОтметьте галочку "Хочу создавать маршруты" в настройках профиля.');
            window.location.href = 'profile.html#settings';
            return false;
        }
        return true;
    }

    if (!checkAuth()) return;

    // ===== ПРОВЕРКА РЕЖИМА РЕДАКТИРОВАНИЯ =====
    let editMode = false;
    let editRouteId = null;
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('edit')) {
        editMode = true;
        editRouteId = parseInt(urlParams.get('edit'));
        document.getElementById('pageTitle').innerHTML = '<i class="fas fa-edit"></i> Редактирование маршрута';
        document.getElementById('submitBtnText').textContent = 'Обновить маршрут';
        document.getElementById('gpxLabel').textContent = 'GPX трек (опционально)';
        document.getElementById('gpxNote').textContent = 'Загрузите новый файл трека, если хотите заменить существующий';
        document.getElementById('gpxFile').required = false;
        loadRouteForEditing(editRouteId);
    }

    function loadRouteForEditing(id) {
        let allRoutes = JSON.parse(localStorage.getItem('yatyrist_routes') || '[]');
        let route = allRoutes.find(r => r.id === id);
        if (!route) {
            alert('Маршрут не найден!');
            window.location.href = 'profile.html';
            return;
        }

        // Проверяем, что пользователь является автором
        let currentUser = getCurrentUser();
        if (!currentUser || route.author.id !== currentUser.id) {
            alert('❌ У вас нет прав на редактирование этого маршрута');
            window.location.href = 'profile.html';
            return;
        }

        // Заполняем форму данными маршрута
        document.getElementById('routeTitle').value = route.title || '';
        document.getElementById('shortDesc').value = route.description || '';
        document.getElementById('fullDesc').value = route.fullDescription || '';
        document.querySelector('input[name="routeType"][value="' + (route.type || 'hike') + '"]').checked = true;
        document.getElementById('region').value = route.region || '';
        document.getElementById('location').value = route.location || '';
        document.getElementById('startPoint').value = route.startPoint || '';
        document.getElementById('endPoint').value = route.endPoint || '';
        document.getElementById('distance').value = route.distance ? route.distance.replace(' км', '') : '';
        document.getElementById('duration').value = route.duration || '';
        document.getElementById('elevation').value = route.elevation ? route.elevation.replace(' м', '') : '';
        document.getElementById('bestStartTime').value = route.bestStartTime || '';
        document.querySelector('input[name="difficulty"][value="' + (route.difficulty || 'medium') + '"]').checked = true;
        document.getElementById('price').value = route.price || 299;

        // Экипировка
        if (route.equipment && route.equipment.length > 0) {
            let equipmentList = document.getElementById('equipmentList');
            equipmentList.innerHTML = '';
            route.equipment.forEach(item => {
                let div = document.createElement('div');
                div.className = 'equipment-item';
                div.innerHTML = '<input type="text" name="equipment[]" value="' + item + '">' +
                    '<button type="button" class="btn-remove-item"><i class="fas fa-times"></i></button>';
                equipmentList.appendChild(div);
                div.querySelector('.btn-remove-item').addEventListener('click', function() {
                    div.remove();
                });
            });
        }

        // Рекомендации
        if (route.recommendations) {
            document.getElementById('recommendations').value = route.recommendations;
        }

        // Фото (если есть)
        if (route.photos && route.photos.length > 0) {
            selectedPhotos = route.photos;
            displayPhotosPreview();
        }

        // Обновляем счётчик символов
        if (shortDesc) {
            shortDescCount.textContent = shortDesc.value.length;
        }
    }

    // ===== СЧЁТЧИК СИМВОЛОВ =====
    let shortDesc = document.getElementById('shortDesc');
    let shortDescCount = document.getElementById('shortDescCount');
    if (shortDesc && shortDescCount) {
        shortDesc.addEventListener('input', function() {
            shortDescCount.textContent = this.value.length;
        });
        shortDescCount.textContent = shortDesc.value.length;
    }

    // ===== РАСЧЁТ ДОХОДА =====
    let priceInput = document.getElementById('price');
    let priceExample = document.getElementById('priceExample');
    let incomeExample = document.getElementById('incomeExample');

    if (priceInput) {
        // Первоначальный расчёт
        let initialPrice = parseInt(priceInput.value) || 299;
        if (priceExample) priceExample.textContent = initialPrice;
        if (incomeExample) incomeExample.textContent = Math.round(initialPrice * 0.7);

        priceInput.addEventListener('input', function() {
            let price = parseInt(this.value) || 299;
            let income = Math.round(price * 0.7);
            if (priceExample) priceExample.textContent = price;
            if (incomeExample) incomeExample.textContent = income;
        });
    }

    // ===== ДОБАВЛЕНИЕ ЭКИПИРОВКИ =====
    let equipmentList = document.getElementById('equipmentList');
    let addBtn = document.getElementById('addEquipmentBtn');

    if (addBtn && equipmentList) {
        addBtn.addEventListener('click', function() {
            let div = document.createElement('div');
            div.className = 'equipment-item';
            div.innerHTML = '<input type="text" name="equipment[]" placeholder="Предмет экипировки">' +
                '<button type="button" class="btn-remove-item"><i class="fas fa-times"></i></button>';
            equipmentList.appendChild(div);

            div.querySelector('.btn-remove-item').addEventListener('click', function() {
                div.remove();
            });
        });
    }

    // Удаление существующих предметов
    let removeBtns = document.querySelectorAll('.btn-remove-item');
    for (let i = 0; i < removeBtns.length; i++) {
        removeBtns[i].addEventListener('click', function() {
            this.closest('.equipment-item').remove();
        });
    }

    // ===== ЗАГРУЗКА ФОТОГРАФИЙ =====
    let photoInput = document.getElementById('routePhotos');
    let photosPreview = document.getElementById('photosPreview');
    let photosData = document.getElementById('photosData');

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            let files = Array.from(e.target.files);

            if (selectedPhotos.length + files.length > 10) {
                alert('❌ Можно загрузить не более 10 фотографий');
                return;
            }

            files.forEach(file => {
                if (!file.type.startsWith('image/')) {
                    alert('❌ Файл ' + file.name + ' не является изображением');
                    return;
                }

                let reader = new FileReader();
                reader.onload = function(ev) {
                    selectedPhotos.push({
                        name: file.name,
                        data: ev.target.result,
                        type: file.type
                    });
                    displayPhotosPreview();
                    updatePhotosData();
                };
                reader.readAsDataURL(file);
            });

            // Очищаем input
            photoInput.value = '';
        });
    }

    // Отображение превью фото
    function displayPhotosPreview() {
        if (!photosPreview) return;

        photosPreview.innerHTML = '';
        selectedPhotos.forEach((photo, index) => {
            let div = document.createElement('div');
            div.style.cssText = 'position: relative; width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 2px solid #2E7D32;';
            div.innerHTML = `
                <img src="${photo.data}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" class="photo-remove-btn" data-index="${index}" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            photosPreview.appendChild(div);
        });

        // Добавляем обработчики удаления
        document.querySelectorAll('.photo-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                let index = parseInt(this.getAttribute('data-index'));
                selectedPhotos.splice(index, 1);
                displayPhotosPreview();
                updatePhotosData();
            });
        });
    }

    // Обновление скрытого поля с данными фото
    function updatePhotosData() {
        if (photosData) {
            photosData.value = JSON.stringify(selectedPhotos.map(p => ({ name: p.name, data: p.data, type: p.type })));
        }
    }

    // ===== ОТПРАВКА ФОРМЫ =====
    let form = document.getElementById('createRouteForm');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Проверка на минимум 3 фото
            if (selectedPhotos.length < 3) {
                alert('❌ Необходимо загрузить минимум 3 фотографии маршрута');
                return;
            }

            // Собираем все данные
            let title = document.getElementById('routeTitle').value;
            let routeType = document.querySelector('input[name="routeType"]:checked');
            let region = document.getElementById('region').value;
            let location = document.getElementById('location').value;
            let shortDesc = document.getElementById('shortDesc').value;
            let fullDesc = document.getElementById('fullDesc').value;
            let startPoint = document.getElementById('startPoint').value;
            let endPoint = document.getElementById('endPoint').value;
            let distance = document.getElementById('distance').value;
            let elevation = document.getElementById('elevation').value;
            let duration = document.getElementById('duration').value;
            let bestStartTime = document.getElementById('bestStartTime').value;
            let difficulty = document.querySelector('input[name="difficulty"]:checked');
            let recommendations = document.getElementById('recommendations').value;
            let price = parseInt(document.getElementById('price').value);

            // Сбор экипировки
            let equipment = [];
            document.querySelectorAll('input[name="equipment[]"]').forEach(input => {
                if (input.value.trim()) {
                    equipment.push(input.value.trim());
                }
            });

            // Валидация
            if (!title) { alert('❌ Введите название маршрута'); return; }
            if (!routeType) { alert('❌ Выберите тип маршрута'); return; }
            if (!region) { alert('❌ Выберите регион'); return; }
            if (!location) { alert('❌ Введите ближайший город'); return; }
            if (!shortDesc) { alert('❌ Введите краткое описание'); return; }
            if (!fullDesc) { alert('❌ Введите полное описание'); return; }
            if (!startPoint) { alert('❌ Введите точку старта'); return; }
            if (!endPoint) { alert('❌ Введите точку финиша'); return; }
            if (!distance) { alert('❌ Введите протяженность'); return; }
            if (!duration) { alert('❌ Введите время на маршрут'); return; }
            if (!bestStartTime) { alert('❌ Введите лучшее время выхода'); return; }
            if (!difficulty) { alert('❌ Выберите уровень сложности'); return; }
            if (!price || price < 99) { alert('❌ Цена должна быть не менее 99 ₽'); return; }

            // Проверка GPX файла (только для новых маршрутов)
            let gpxFile = document.getElementById('gpxFile').files[0];
            if (!editMode && !gpxFile) {
                alert('❌ Загрузите GPX трек');
                return;
            }

            let currentUser = getCurrentUser();
            if (!currentUser) {
                alert('❌ Ошибка: пользователь не найден');
                return;
            }

            // Получаем название региона
            let regionSelect = document.getElementById('region');
            let selectedRegionOption = regionSelect.options[regionSelect.selectedIndex] || null;
            let regionName = (selectedRegionOption && selectedRegionOption.text) ? selectedRegionOption.text : region;

            // Создаём или обновляем объект маршрута
            let routeData;
            if (editMode) {
                // Обновляем существующий маршрут
                let allRoutes = JSON.parse(localStorage.getItem('yatyrist_routes') || '[]');
                routeData = allRoutes.find(r => r.id === editRouteId);
                if (!routeData) {
                    alert('❌ Маршрут не найден для редактирования');
                    return;
                }
                // Обновляем поля
                routeData.title = title;
                routeData.type = routeType.value;
                routeData.region = region;
                routeData.regionName = regionName;
                routeData.location = location;
                routeData.price = price;
                routeData.duration = duration;
                routeData.distance = distance + ' км';
                routeData.elevation = elevation ? elevation + ' м' : 'не указан';
                routeData.description = shortDesc;
                routeData.fullDescription = fullDesc;
                routeData.startPoint = startPoint;
                routeData.endPoint = endPoint;
                routeData.bestStartTime = bestStartTime;
                routeData.difficulty = difficulty.value;
                routeData.equipment = equipment;
                routeData.recommendations = recommendations;
                routeData.photos = selectedPhotos;
                if (gpxFile) {
                    routeData.gpxFileName = gpxFile.name;
                }
                // Сохраняем обновлённый массив
                localStorage.setItem('yatyrist_routes', JSON.stringify(allRoutes));
            } else {
                // Создаём новый маршрут
                routeData = {
                    id: Date.now(),
                    title: title,
                    type: routeType.value,
                    region: region,
                    regionName: regionName,
                    location: location,
                    price: price,
                    duration: duration,
                    distance: distance + ' км',
                    elevation: elevation ? elevation + ' м' : 'не указан',
                    author: {
                        id: currentUser.id,
                        name: currentUser.firstName + ' ' + currentUser.lastName,
                        rating: 0
                    },
                    description: shortDesc,
                    fullDescription: fullDesc,
                    startPoint: startPoint,
                    endPoint: endPoint,
                    bestStartTime: bestStartTime,
                    difficulty: difficulty.value,
                    equipment: equipment,
                    recommendations: recommendations,
                    photos: selectedPhotos,
                    gpxFileName: gpxFile.name,
                    createdAt: new Date().toISOString(),
                    sales: 0,
                    views: 0
                };

                // Сохраняем в localStorage
                let routesFromStorage = localStorage.getItem('yatyrist_routes');
                let allRoutes = routesFromStorage ? JSON.parse(routesFromStorage) : [];
                allRoutes.push(routeData);
                localStorage.setItem('yatyrist_routes', JSON.stringify(allRoutes));
            }

            let authorIncome = Math.round(price * 0.7);

            let message = editMode ?
                `✅ Маршрут "${title}" успешно обновлён!` :
                `✅ Маршрут "${title}" успешно создан!\n\n` +
                `📊 Статистика:\n` +
                `💰 Цена: ${price} ₽\n` +
                `💵 Ваш доход (после комиссии 30%): ${authorIncome} ₽\n` +
                `📸 Загружено фото: ${selectedPhotos.length}\n\n` +
                `📋 Маршрут отправлен на модерацию. Обычно это занимает до 24 часов.`;

            alert(message);

            // Перенаправляем в профиль
            window.location.href = 'profile.html';
        });
    }

    // ===== ОБНОВЛЕНИЕ UI =====
    try {
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        } else {
            // Если функция не определена, обновляем вручную
            let user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (user) {
                let nameDisplay = document.querySelector('.user-name-display');
                if (nameDisplay) {
                    nameDisplay.textContent = user.firstName + ' ' + user.lastName;
                }
            }
        }
    } catch (e) {
        console.log('Ошибка обновления UI:', e);
    }

    console.log('✅ Форма создания маршрута загружена');
    console.log('Выбранные фото:', selectedPhotos.length);
});