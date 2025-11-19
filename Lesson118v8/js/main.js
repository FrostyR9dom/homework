(function () {

    document.addEventListener('click', burgerInit)

    function burgerInit(e) {

        const burgerIcon = e.target.closest('.burger-icon')
        const burgerNavLink = e.target.closest('.nav__link')

        if (!burgerIcon && !burgerNavLink) return
        if (document.documentElement.clientWidth > 900) return

        if (!document.body.classList.contains('body--opened-menu')) {
            document.body.classList.add('body--opened-menu')
        } else {
            document.body.classList.remove('body--opened-menu')
        }

    }

    const modal = document.querySelector('.modal')
    const modalButton = document.querySelector('.about__img-button')

    modalButton.addEventListener('click', openModal)
    modal.addEventListener('click', closeModal)

    function openModal(e) {
        e.preventDefault()
        document.body.classList.toggle('body--opened-modal')
    }

    function closeModal(e) {
        e.preventDefault()

        const target = e.target

        if (target.closest('.modal__cancel') || target.classList.contains('modal')) {
            document.body.classList.remove('body--opened-modal')
        }

    }
    // ТАБЫ!!!

    const tabControls = document.querySelector('.tab-controls')

    tabControls.addEventListener('click', toggleTab)

    function toggleTab(e) {

        const tabControl = e.target.closest('.tab-controls__link')
        if (!tabControl) return
        e.preventDefault()

        if (tabControl.classList.contains('tab-controls__link--active')) return

        e.preventDefault()

        const tabContentID = tabControl.getAttribute('href')

        const tabContent = document.querySelector(tabContentID)

        // const activeContol
        // const activeContent


        document.querySelectorAll('.tab-controls__link--active').forEach(link => {
            link.classList.remove('tab-controls__link--active')
        })


        document.querySelectorAll('.tab-content--show').forEach(tab => {
            tab.classList.remove('tab-content--show')
        })


        tabControl.classList.add('tab-controls__link--active')
        document.querySelector(tabContentID).classList.add('tab-content--show')
    }
})()