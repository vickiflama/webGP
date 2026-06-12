// ==================== SLIDER ====================
if (document.querySelector('.slides')) {
    let actual = 0;
    const slides = document.querySelector('.slides');
    const dots = document.querySelectorAll('.dot');
    const total = document.querySelectorAll('.slide').length;

    function irASlide(index) {
        actual = index;
        if (actual < 0) actual = total - 1;
        if (actual >= total) actual = 0;
        slides.style.transform = `translateX(-${actual * 100}%)`;
        dots.forEach(d => d.classList.remove('active'));
        dots[actual].classList.add('active');
    }

    document.querySelector('.arrow-prev').addEventListener('click', () => irASlide(actual - 1));
    document.querySelector('.arrow-next').addEventListener('click', () => irASlide(actual + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => irASlide(i)));
    setInterval(() => irASlide(actual + 1), 4000);
}

// ==================== MODALES ====================
let provinciasYaCargadas = false;

function abrirModal(id) {
    document.getElementById(id).classList.add('activo');
    document.body.style.overflow = 'hidden';
    if (id === 'modal-registro' && !provinciasYaCargadas) {
        cargarProvincias();
        provinciasYaCargadas = true;
    }
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('activo');
    document.body.style.overflow = '';
}

// Cerrar clickeando el overlay
if (document.querySelectorAll('.modal-overlay').length > 0) {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                if (this.id === 'modal-registro') {
                    abrirConfirmarSalir();
                } else {
                    this.classList.remove('activo');
                    document.body.style.overflow = '';
                }
            }
        });
    });
}

// ==================== PROVINCIAS Y LOCALIDADES ====================