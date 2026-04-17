/**
 * create-route.js
 * Логика формы создания маршрута
 */

document.addEventListener('DOMContentLoaded', function() {

    // Проверка авторизации
    if (!canCreateRoute()) {
        alert('⚠️ Чтобы создавать маршруты, необходимо войти как автор.');
        window.location.href = 'register.html?mode=register&becomeAuthor=true';
        return;
    }

    // Счётчик символов
    var shortDesc = document.getElementById('shortDesc');
    var shortDescCount = document.getElementById('shortDescCount');
    if (shortDesc && shortDescCount) {
        shortDesc.addEventListener('input', function() {
            shortDescCount.textContent = this.value.length;
        });
        shortDescCount.textContent = shortDesc.value.length;
    }

    // Расчёт дохода
    var priceInput = document.getElementById('price');
    var priceExample = document.getElementById('priceExample');
    var incomeExample = document.getElementById('incomeExample');

    if (priceInput) {
        priceInput.addEventListener('input', function() {
            var price = parseInt(this.value) || 299;
            var income = Math.round(price * 0.7);
            if (priceExample) priceExample.textContent = price;
            if (incomeExample) incomeExample.textContent = income;
        });
    }

    // Добавление экипировки
    var equipmentList = document.getElementById('equipmentList');
    var addBtn = document.getElementById('addEquipmentBtn');

    if (addBtn && equipmentList) {
        addBtn.addEventListener('click', function() {
            var div = document.createElement('div');
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
    var removeBtns = document.querySelectorAll('.btn-remove-item');
    for (var i = 0; i < removeBtns.length; i++) {
        removeBtns[i].addEventListener('click', function() {
            this.closest('.equipment-item').remove();
        });
    }

    // Отправка формы
    var form = document.getElementById('createRouteForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var price = parseInt(document.getElementById('price').value) || 0;
            var authorIncome = Math.round(price * 0.7);

            alert('✅ Маршрут успешно создан!\n\n' +
                'Цена: ' + price + ' ₽\n' +
                'Ваш доход (с учётом комиссии 30%): ' + authorIncome + ' ₽\n\n' +
                'Маршрут отправлен на модерацию.');

            // window.location.href = 'profile.html';
        });
    }

    // Обновление UI
    updateAuthUI();

    function updateAuthUI() {
        var user = getCurrentUser();
        if (user) {
            var nameDisplay = document.querySelector('.user-name-display');
            if (nameDisplay) {
                nameDisplay.textContent = user.firstName + ' ' + user.lastName;
            }
        }
    }

    console.log('✅ Форма создания маршрута загружена');
});