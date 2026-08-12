// ==================== ESTADOS ====================
const estadoClases = {
    'preparando': 'estado-preparacion',
    'despachado': 'estado-camino',
    'entregado': 'estado-entregado',
    'cancelado': 'estado-cancelado'
};

const estadoIconos = {
    'preparando': 'fa-gear',
    'despachado': 'fa-truck',
    'entregado': 'fa-circle-check',
    'cancelado': 'fa-ban'
};

let filtroActual = 'todos';

// ==================== FILTRO ====================
window.filtrarPorEstado = function (estado) {
    filtroActual = estado;
    document.querySelectorAll('.filtro-estado').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.estado === estado);
    });
    const lista = estado === 'todos'
        ? window.todosPedidosAdmin
        : window.todosPedidosAdmin.filter(p => (p.estado || 'preparando') === estado);
    window.renderizarPedidosAdmin(lista, false);
}

// ==================== RENDER ====================
window.renderizarPedidosAdmin = function (pedidos, guardarComoTotal = true) {
    if (guardarComoTotal) window.todosPedidosAdmin = pedidos;

    const lista = document.getElementById('admin-lista-pedidos');
    const sinPedidos = document.getElementById('admin-sin-pedidos');

    if (pedidos.length === 0) {
        lista.innerHTML = '';
        sinPedidos.style.display = 'block';
        return;
    }
    sinPedidos.style.display = 'none';

    lista.innerHTML = pedidos.map(pedido => {
        const fecha = new Date(pedido.fecha);
        const fechaStr = fecha.toLocaleDateString('es-AR');
        const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const estado = pedido.estado || 'preparando';
        const claseEstado = estadoClases[estado] || 'estado-preparacion';
        const iconoEstado = estadoIconos[estado] || 'fa-gear';
        const esRetiro = pedido.tipoEnvio === 'retiro';
        const cantProductos = pedido.productos?.reduce((sum, p) => sum + p.cantidad, 0) || 0;

        // Opciones de estado según tipo de envío
        const opciones = esRetiro
            ? ['preparando', 'entregado', 'cancelado']
            : ['preparando', 'despachado', 'entregado', 'cancelado'];

        return `
            <div class="admin-pedido-card">
                <div class="admin-pedido-header">
                    <div>
                        <div class="pedido-nro">${pedido.nroPedido || pedido.id}</div>
                        <div class="pedido-fecha">${fechaStr} ${horaStr}hs · ${esRetiro ? 'Retiro en local' : 'Envío a domicilio'}</div>
                        <div class="pedido-fecha">${pedido.direccion?.telefono || pedido.telefono || 'Sin teléfono'}</div>
                    </div>
                    <span class="pedido-estado ${claseEstado}">
                        <i class="fa-solid ${iconoEstado}"></i> ${estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </span>
                </div>
                <div class="admin-pedido-body">
                    <div class="pedido-info-item"><span>Productos</span><span>${cantProductos} unidades</span></div>
                    <div class="pedido-info-item"><span>Total</span><span class="precio">$${(pedido.total || 0).toLocaleString('es-AR')}</span></div>
                    <div class="admin-cambio-estado">
                        <label>Cambiar estado:</label>
                        <select onchange="cambiarEstadoPedido('${pedido.id}', this.value)">
                            <option value="">-- Elegir --</option>
                            ${opciones.map(o => `<option value="${o}" ${o === estado ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="admin-pedido-botones">
                        <button class="btn-ver-detalle" onclick="verDetalleAdmin('${pedido.id}')">
                            <i class="fa-solid fa-eye"></i> Ver detalle e historial
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== CAMBIAR ESTADO ====================
window.cambiarEstadoPedido = async function (pedidoId, nuevoEstado) {
    if (!nuevoEstado) return;
    window.mostrarLoading('Actualizando...');
    const ok = await window.actualizarEstadoPedido(pedidoId, nuevoEstado);
    window.ocultarLoading();

    if (ok) {
        const pedido = window.todosPedidosAdmin.find(p => p.id === pedidoId);
        if (pedido) {
            pedido.estado = nuevoEstado;
            pedido.historialEstados = pedido.historialEstados || [];
            pedido.historialEstados.push({
                estado: nuevoEstado,
                fecha: new Date().toISOString(),
                autor: document.getElementById('admin-usuario-mail').textContent
            });
        }
        window.filtrarPorEstado(filtroActual);
    } else {
        alert('No se pudo actualizar el estado. Probá de nuevo.');
    }
}

// ==================== DETALLE + HISTORIAL ====================
window.verDetalleAdmin = function (id) {
    const pedido = window.todosPedidosAdmin?.find(p => p.id === id);
    if (!pedido) return;

    document.getElementById('admin-detalle-nro').textContent = pedido.nroPedido || id;

    const historial = pedido.historialEstados || [];
    const historialHtml = historial.length
        ? historial.map(h => `
            <div class="historial-item">
                <i class="fa-solid fa-clock"></i>
                <span><b>${h.estado}</b> — ${new Date(h.fecha).toLocaleString('es-AR')} — por ${h.autor}</span>
            </div>
        `).join('')
        : '<p>Sin cambios de estado registrados todavía.</p>';

    document.getElementById('admin-detalle-contenido').innerHTML = `
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
            <h4>Envío</h4>
            <p>${pedido.tipoEnvio === 'retiro'
                ? 'Retiro en local.'
                : `${pedido.direccion?.calle || ''} ${pedido.direccion?.numero || ''}, ${pedido.direccion?.localidad || ''}<br>Tel: ${pedido.direccion?.telefono || ''}`
            }</p>
        </div>
        <div class="detalle-seccion">
            <h4>Historial de estados (interno)</h4>
            ${historialHtml}
        </div>
    `;

    document.getElementById('modal-admin-detalle').classList.add('activo');
    document.body.style.overflow = 'hidden';
}

window.cerrarDetalleAdmin = function () {
    document.getElementById('modal-admin-detalle').classList.remove('activo');
    document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
    const overlay = document.getElementById('modal-admin-detalle');
    if (e.target === overlay) window.cerrarDetalleAdmin();
});

function mostrarLoading(texto) {
    const el = document.getElementById('loading');
    if (el) {
        el.querySelector('.loading-texto').textContent = texto || 'Cargando...';
        el.style.display = 'flex';
    }
}
function ocultarLoading() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
}
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;