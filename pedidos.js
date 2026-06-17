// ==================== ESTADOS ====================
const estadoClases = {
    'pendiente': 'estado-pendiente',
    'en preparación': 'estado-preparacion',
    'listo para retirar': 'estado-listo',
    'en camino': 'estado-camino',
    'entregado': 'estado-entregado'
};

const estadoIconos = {
    'pendiente': 'fa-clock',
    'en preparación': 'fa-gear',
    'listo para retirar': 'fa-store',
    'en camino': 'fa-truck',
    'entregado': 'fa-circle-check'
};

// ==================== RENDERIZAR ====================
window.renderizarPedidos = function(pedidos) {
    const lista = document.getElementById('lista-pedidos');
    const sinPedidos = document.getElementById('sin-pedidos');

    if (pedidos.length === 0) {
        sinPedidos.style.display = 'block';
        return;
    }

    lista.innerHTML = '';

    pedidos.forEach(pedido => {
        const fecha = new Date(pedido.fecha);
        const fechaStr = fecha.toLocaleDateString('es-AR');
        const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const estado = pedido.estado || 'pendiente';
        const claseEstado = estadoClases[estado] || 'estado-pendiente';
        const iconoEstado = estadoIconos[estado] || 'fa-clock';
        const cantProductos = pedido.productos?.reduce((sum, p) => sum + p.cantidad, 0) || 0;

        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.innerHTML = `
            <div class="pedido-card-header">
                <div>
                    <div class="pedido-nro">${pedido.nroPedido || pedido.id}</div>
                    <div class="pedido-fecha">${fechaStr} ${horaStr}hs</div>
                </div>
                <span class="pedido-estado ${claseEstado}">
                    <i class="fa-solid ${iconoEstado}"></i> ${estado.charAt(0).toUpperCase() + estado.slice(1)}
                </span>
            </div>
            <div class="pedido-card-body">
                <div class="pedido-info">
                    <div class="pedido-info-item">
                        <span>Productos</span>
                        <span>${cantProductos} unidades</span>
                    </div>
                    <div class="pedido-info-item">
                        <span>Envío</span>
                        <span>${pedido.tipoEnvio === 'retiro' ? 'Retiro en local' : 'A domicilio'}</span>
                    </div>
                    <div class="pedido-info-item">
                        <span>Pago</span>
                        <span>${pedido.pago || '-'}</span>
                    </div>
                    <div class="pedido-info-item">
                        <span>Total</span>
                        <span class="precio">$${(pedido.total || 0).toLocaleString('es-AR')}</span>
                    </div>
                </div>
                <div class="pedido-botones">
                    <button class="btn-ver-detalle" onclick="verDetalle('${pedido.id}')">
                        <i class="fa-solid fa-eye"></i> Ver detalle
                    </button>
                    <button class="btn-pdf-pedido" onclick="descargarPDFPedido('${pedido.id}')">
                        <i class="fa-solid fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });

    // Guarda los pedidos globalmente para el modal
    window.pedidosData = pedidos;
}

// ==================== VER DETALLE ====================
window.verDetalle = function(id) {
    const pedido = window.pedidosData?.find(p => p.id === id);
    if (!pedido) return;

    document.getElementById('detalle-nro').textContent = pedido.nroPedido || id;

    const contenido = document.getElementById('detalle-contenido');
    contenido.innerHTML = `
        <div class="detalle-seccion">
            <h4>Productos</h4>
            ${pedido.productos?.map(p => `
                <div class="detalle-producto-row">
                    <span>${p.nombre} x${p.cantidad}</span>
                    <span>$${(p.precio * p.cantidad).toLocaleString('es-AR')}</span>
                </div>
            `).join('') || ''}
            <div class="detalle-total">
                <span>Total:</span>
                <span>$${(pedido.total || 0).toLocaleString('es-AR')}</span>
            </div>
        </div>

        <div class="detalle-seccion">
            <h4>Criterio de reemplazo</h4>
            <p>${pedido.reemplazo || '-'}</p>
        </div>

        <div class="detalle-seccion">
            <h4>Envío</h4>
            <p>${pedido.tipoEnvio === 'retiro'
                ? 'Retiro en Bv. Lovatto N° 1313, Reconquista, Santa Fe.'
                : `${pedido.direccion?.calle} ${pedido.direccion?.numero}, ${pedido.direccion?.localidad}<br>
                   Tel: ${pedido.direccion?.telefono}<br>
                   Turno: ${pedido.turno || ''}`
            }</p>
        </div>

        <div class="detalle-seccion">
            <h4>Pago</h4>
            <p>${pedido.pago || '-'}${pedido.factura ? ' + Factura' : ''}</p>
        </div>
    `;

    document.getElementById('modal-detalle').classList.add('activo');
    document.body.style.overflow = 'hidden';
}

window.cerrarDetalle = function() {
    document.getElementById('modal-detalle').classList.remove('activo');
    document.body.style.overflow = '';
}

// ==================== DESCARGAR PDF ====================
window.descargarPDFPedido = function(id) {
    const pedido = window.pedidosData?.find(p => p.id === id);
    if (!pedido) return;

    localStorage.setItem('ultimoPedido', JSON.stringify(pedido));
    localStorage.setItem('ultimoPedidoNro', pedido.nroPedido || id);
    window.open('pedido-pdf.html', '_blank');
}

// Cerrar modal clickeando fuera
document.addEventListener('click', function(e) {
    const overlay = document.getElementById('modal-detalle');
    if (e.target === overlay) {
        window.cerrarDetalle();
    }
});