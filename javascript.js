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

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => irASlide(i));
});

setInterval(() => irASlide(actual + 1), 4000);

function abrirModal(id) {
    document.getElementById(id).classList.add('activo');
    document.body.style.overflow = 'hidden'; // evita scroll del fondo
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('activo');
    document.body.style.overflow = '';
}

// Cerrar clickeando fuera del modal
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('activo');
            document.body.style.overflow = '';
        }
    });
});

// Carga provincias al abrir el modal
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

// Carga localidades según la provincia elegida
async function cargarLocalidades() {
    const provinciaId = document.getElementById('select-provincia').value;
    const selectLocalidad = document.getElementById('select-localidad');
    
    // Limpia las opciones anteriores
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

// Modificá tu función abrirModal para que cargue las provincias
function abrirModal(id) {
    document.getElementById(id).classList.add('activo');
    document.body.style.overflow = 'hidden';
    cargarProvincias(); // ← agregás esto
}