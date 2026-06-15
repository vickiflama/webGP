function toggleFiltro(nombre) {
    const opciones = document.getElementById(`filtro-${nombre}`);
    const icon = document.getElementById(`icon-${nombre}`);
    opciones.classList.toggle('activo');
    icon.textContent = opciones.classList.contains('activo') ? '−' : '+';
}

function cambiarCantidad(btn, cambio) {
    const wrap = btn.parentElement;
    const span = wrap.querySelector('span');
    let cantidad = parseInt(span.textContent);
    cantidad += cambio;
    if (cantidad < 1) cantidad = 1;
    span.textContent = cantidad;
}