// ==================== SLIDER ====================
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

// ==================== PROVINCIAS Y LOCALIDADES ====================
async function cargarProvincias() {
    const select = document.getElementById('select-provincia');
    try {
        const res = await fetch('https://apis.datos.gob.ar/georef/api/provincias?orden=nombre&max=100');
        const data = await res.json();
        data.provincias.forEach(provincia => {
            const option = document.createElement('option');
            option.value = provincia.id;
            option.textContent = provincia.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando provincias:', error);
    }
}

async function cargarLocalidades() {
    const provinciaId = document.getElementById('select-provincia').value;
    const selectLocalidad = document.getElementById('select-localidad');
    selectLocalidad.innerHTML = '<option value="">Localidad*</option>';
    if (!provinciaId) return;
    try {
        const res = await fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provinciaId}&orden=nombre&max=1000`);
        const data = await res.json();
        data.municipios.forEach(municipio => {
            const option = document.createElement('option');
            option.value = municipio.id;
            option.textContent = municipio.nombre;
            selectLocalidad.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando localidades:', error);
    }
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

    if (valido) {
        console.log('Formulario válido, enviando...');
    }
    if (valido) {
        // Toma el email ingresado y lo muestra en el modal
        const email = document.querySelector('input[placeholder="Correo electrónico*"]').value;
        document.getElementById('exito-email').textContent = email;

        // Cierra el registro y abre el modal de éxito
        cerrarModal('modal-registro');
        abrirModal('modal-exito');
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


///////////////////LOGIN////////////////////
function validarLogin() {
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    let valido = true;

    // Limpia errores anteriores
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.msg-error').forEach(el => el.remove());

    if (email && email.value.trim() === '') {
        marcarError(email, 'El correo es obligatorio');
        valido = false;
    }

    if (password && password.value.trim() === '') {
        marcarError(password, 'La contraseña es obligatoria');
        valido = false;
    }

    if (valido) {
        console.log('Login válido, ingresando...');
    }
}

