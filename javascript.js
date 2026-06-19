// ==================== CARRITO ====================
let carritoIndex = JSON.parse(localStorage.getItem('carritoGP') || '[]');

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
let localidadesPorProvincia = {};

async function precargarTodo() {
    try {
        const res = await fetch('https://apis.datos.gob.ar/georef/api/municipios?max=5000&campos=nombre,provincia.nombre');
        const data = await res.json();
        data.municipios.forEach(municipio => {
            const provincia = municipio.provincia.nombre;
            if (!localidadesPorProvincia[provincia]) {
                localidadesPorProvincia[provincia] = [];
            }
            localidadesPorProvincia[provincia].push(municipio.nombre);
        });
        Object.keys(localidadesPorProvincia).forEach(key => {
            localidadesPorProvincia[key].sort();
        });
        console.log('Localidades precargadas ✅');
    } catch (error) {
        console.error('Error precargando localidades:', error);
    }
}

precargarTodo();

function cargarProvincias() {
    const select = document.getElementById('select-provincia');
    if (!select || select.options.length > 1) return;
    const provincias = [
        "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
        "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
        "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
        "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
        "Santiago del Estero", "Tierra del Fuego", "Tucumán",
        "Ciudad Autónoma de Buenos Aires"
    ];
    provincias.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

function cargarLocalidades() {
    const provincia = document.getElementById('select-provincia').value;
    const selectLocalidad = document.getElementById('select-localidad');
    selectLocalidad.innerHTML = '<option value="">Localidad*</option>';
    if (!provincia) return;
    const ciudades = localidadesPorProvincia[provincia] || [];
    ciudades.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        selectLocalidad.appendChild(option);
    });
}

// ==================== VALIDACIÓN ====================
function validarFormulario() {
    let valido = true;
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.msg-error').forEach(el => el.remove());

    const campos = [
        { selector: 'input[placeholder="Nombre*"]', msg: 'El nombre es obligatorio' },
        { selector: 'input[placeholder="Apellido*"]', msg: 'El apellido es obligatorio' },
        { selector: 'input[placeholder="Contraseña*"]', msg: 'La contraseña es obligatoria' },
        { selector: 'input[placeholder="Correo electrónico*"]', msg: 'El correo es obligatorio' },
        { selector: 'input[placeholder="DNI o CUIT*"]', msg: 'El DNI o CUIT es obligatorio' },
        { selector: 'input[type="date"]', msg: 'La fecha de nacimiento es obligatoria' },
        { selector: 'input[placeholder="Celular*"]', msg: 'El celular es obligatorio' },
    ];

    campos.forEach(({ selector, msg }) => {
        const campo = document.querySelector(selector);
        if (campo && campo.value.trim() === '') {
            marcarError(campo, msg);
            valido = false;
        }
    });

    const provincia = document.getElementById('select-provincia');
    if (provincia && provincia.value === '') {
        marcarError(provincia, 'Seleccioná una provincia');
        valido = false;
    }

    const localidad = document.getElementById('select-localidad');
    if (localidad && localidad.value === '') {
        marcarError(localidad, 'Seleccioná una localidad');
        valido = false;
    }

    const terminos = document.querySelector('.form-checks input[type="checkbox"]');
    if (terminos && !terminos.checked) {
        mostrarMensaje(terminos.parentElement, 'Debes ACEPTAR los términos y condiciones para registrarse');
        valido = false;
    }

    return valido;
}

function marcarError(campo, mensaje) {
    campo.classList.add('input-error');
    mostrarMensaje(campo, mensaje);
}

function mostrarMensaje(elemento, mensaje) {
    const msg = document.createElement('span');
    msg.className = 'msg-error';
    msg.textContent = mensaje;
    elemento.parentElement.appendChild(msg);
}

// ==================== MODAL SALIR ====================
function abrirConfirmarSalir() {
    document.getElementById('modal-registro').classList.remove('activo');
    document.getElementById('modal-salir').classList.add('activo');
}

function confirmarSalir() {
    document.getElementById('modal-salir').classList.remove('activo');
    document.getElementById('modal-registro').classList.remove('activo');
    document.body.style.overflow = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverAlRegistro() {
    document.getElementById('modal-salir').classList.remove('activo');
    document.getElementById('modal-registro').classList.add('activo');
}

// ==================== TOGGLE MENU ====================
window.toggleMenu = function() {
    const nombre = localStorage.getItem('usuarioNombre');
    if (!nombre) {
        const modal = document.getElementById('modal-registro');
        if (modal) {
            abrirModal('modal-registro');
        } else {
            window.location.href = 'login.html';
        }
        return;
    }
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('activo');
};

window.cerrarSesion = function() {
    localStorage.removeItem('usuarioNombre');
    if (window._cerrarSesionFirebase) {
        window._cerrarSesionFirebase();
    } else {
        window.location.href = 'index.html';
    }
};

// ==================== SLIDER MÁS VENDIDOS ====================
let mvActual = 0;
const mvVisibles = 4;

function iniciarSliderProductos() {
    const slider = document.getElementById('mv-slider');
    const dotsEl = document.getElementById('mv-dots');
    if (!slider || !dotsEl) return;

    const cards = slider.querySelectorAll('.mv-card');
    const totalSlides = Math.ceil(cards.length / mvVisibles);

    dotsEl.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = `mv-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => irASlideProductos(i);
        dotsEl.appendChild(dot);
    }
}

function moverSliderProductos(direccion) {
    const slider = document.getElementById('mv-slider');
    const dots = document.querySelectorAll('.mv-dot');
    const cards = slider.querySelectorAll('.mv-card');
    const totalSlides = Math.ceil(cards.length / mvVisibles);

    mvActual += direccion;
    if (mvActual < 0) mvActual = totalSlides - 1;
    if (mvActual >= totalSlides) mvActual = 0;

    const cardWidth = slider.querySelector('.mv-card').offsetWidth + 20;
    slider.style.transform = `translateX(-${mvActual * mvVisibles * cardWidth}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === mvActual));
}

function irASlideProductos(index) {
    const slider = document.getElementById('mv-slider');
    const dots = document.querySelectorAll('.mv-dot');
    mvActual = index;

    const cardWidth = slider.querySelector('.mv-card').offsetWidth + 20;
    slider.style.transform = `translateX(-${mvActual * mvVisibles * cardWidth}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === mvActual));
}

// ==================== CARRITO PANEL ====================
function actualizarPanelCarrito() {
    carritoIndex = JSON.parse(localStorage.getItem('carritoGP') || '[]');

    const itemsEl = document.getElementById('carrito-items');
    const contadorEl = document.getElementById('carrito-contador');
    const subtotalEl = document.getElementById('carrito-subtotal');
    const badgeEl = document.getElementById('cart-badge');

    if (!itemsEl) return;

    const totalProductos = carritoIndex.reduce((sum, p) => sum + p.cantidad, 0);
    const subtotal = carritoIndex.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

    if (badgeEl) badgeEl.textContent = totalProductos;
    if (contadorEl) contadorEl.textContent = `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`;

    itemsEl.innerHTML = '';
    carritoIndex.forEach((producto, index) => {
        const item = document.createElement('div');
        item.className = 'carrito-item';
        item.innerHTML = `
            <div class="carrito-item-nombre">${producto.nombre}</div>
            <span class="carrito-item-cantidad">${producto.cantidad} U.</span>
            <span class="carrito-item-precio">$${(producto.precio * producto.cantidad).toLocaleString('es-AR')}</span>
            <button class="carrito-item-eliminar" onclick="eliminarDelCarritoIndex(${index})">
                <i class="fa-solid fa-circle-xmark"></i>
            </button>
        `;
        itemsEl.appendChild(item);
    });

    if (subtotalEl) subtotalEl.textContent = `SUBTOTAL: $${subtotal.toLocaleString('es-AR')}`;
}

function eliminarDelCarritoIndex(index) {
    carritoIndex.splice(index, 1);
    localStorage.setItem('carritoGP', JSON.stringify(carritoIndex));
    actualizarPanelCarrito();
    if (carritoIndex.length === 0) {
        const panel = document.getElementById('carrito-panel');
        if (panel) panel.classList.remove('activo');
    }
}

function cambiarCantidad(btn, cambio) {
    const wrap = btn.parentElement;
    const span = wrap.querySelector('span');
    let cantidad = parseInt(span.textContent);
    cantidad += cambio;
    if (cantidad < 1) cantidad = 1;
    span.textContent = cantidad;
}

function agregarAlCarrito(nombre, precio, btn) {
    const wrap = btn.closest('.mv-acciones, .producto-acciones')?.querySelector('.cantidad-wrap span');
    const cantidad = wrap ? parseInt(wrap.textContent) : 1;

    const existe = carritoIndex.find(p => p.nombre === nombre);
    if (existe) {
        existe.cantidad += cantidad;
    } else {
        carritoIndex.push({ nombre, precio, cantidad });
    }

    localStorage.setItem('carritoGP', JSON.stringify(carritoIndex));
    actualizarPanelCarrito();

    const panel = document.getElementById('carrito-panel');
    if (panel) panel.classList.add('activo');

    btn.textContent = '✓ Agregado';
    btn.style.background = '#3DB549';
    setTimeout(() => {
        btn.textContent = 'COMPRAR';
        btn.style.background = '';
    }, 1500);
}

// ==================== DOM CONTENT LOADED ====================
document.addEventListener('DOMContentLoaded', function() {
    iniciarSliderProductos();
    actualizarPanelCarrito();

    const cartWrap = document.querySelector('.cart-wrap');
    const panel = document.getElementById('carrito-panel');

    if (cartWrap && panel) {
        cartWrap.addEventListener('click', function() {
            if (carritoIndex.length > 0) {
                panel.classList.toggle('activo');
            }
        });

        document.addEventListener('click', function(e) {
            if (!cartWrap.contains(e.target) && !panel.contains(e.target)) {
                panel.classList.remove('activo');
            }
        });
    }
});

// ==================== EXPONER GLOBALMENTE ====================
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.abrirConfirmarSalir = abrirConfirmarSalir;
window.confirmarSalir = confirmarSalir;
window.volverAlRegistro = volverAlRegistro;
window.cargarLocalidades = cargarLocalidades;
window.cargarProvincias = cargarProvincias;
window.validarFormulario = validarFormulario;
window.moverSliderProductos = moverSliderProductos;
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarritoIndex = eliminarDelCarritoIndex;