const modal = document.getElementById('modal');
const openBtn = document.querySelector('.modal__open-btn');
const closeBtn = modal.querySelector('.modal__close-btn');

openBtn.addEventListener('click', () => {
    modal.classList.add('modal--open');
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('modal--open');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
        modal.classList.remove('modal--open');
    }
});
