// ==================== ESTADOS ====================
const estadoClases = {
    'pendiente': 'estado-pendiente',
    'preparando': 'estado-preparacion',
    'despachado': 'estado-camino',
    'entregado': 'estado-entregado',
    'cancelado': 'estado-cancelado'
};

const estadoIconos = {
    'pendiente': 'fa-clock',
    'preparando': 'fa-gear',
    'despachado': 'fa-truck',
    'entregado': 'fa-circle-check',
    'cancelado': 'fa-ban'
};

// Orden en la lista: lo que hay que atender arriba, lo terminado abajo
const estadoOrden = {
    'pendiente': 0,
    'preparando': 1,
    'despachado': 2,
    'entregado': 3,
    'cancelado': 4
};

let filtroActual = 'todos';

// ==================== UTILIDADES ====================
// Escapa texto que viene de los clientes antes de mostrarlo en el panel
function esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// Muestra solo el usuario (sin @admin.granprix.local)
function nombreAutor(autor) {
    return String(autor || '').split('@')[0];
}

function estadoDe(pedido) {
    return String(pedido.estado || 'pendiente').toLowerCase();
}

// Minúsculas y sin tildes, para buscar
function normalizar(texto) {
    return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function telefonoDe(pedido) {
    return pedido.direccion?.telefono || pedido.telefono || '';
}

// Estado primero (según estadoOrden) y, dentro de cada estado, el más nuevo arriba
function ordenarPedidos(lista) {
    return [...lista].sort((a, b) => {
        const oa = estadoOrden[estadoDe(a)] ?? 0;
        const ob = estadoOrden[estadoDe(b)] ?? 0;
        if (oa !== ob) return oa - ob;
        return new Date(b.fecha) - new Date(a.fecha);
    });
}

// ==================== FILTROS ====================
window.aplicarFiltros = function () {
    const todos = window.todosPedidosAdmin || [];

    const texto = normalizar(document.getElementById('filtro-texto')?.value.trim());
    const desdeVal = document.getElementById('filtro-desde')?.value;
    const hastaVal = document.getElementById('filtro-hasta')?.value;
    const desde = desdeVal ? new Date(desdeVal + 'T00:00:00') : null;
    const hasta = hastaVal ? new Date(hastaVal + 'T23:59:59.999') : null;

    const filtrados = todos.filter(p => {
        if (filtroActual !== 'todos' && estadoDe(p) !== filtroActual) return false;

        if (texto) {
            const campos = normalizar([p.nroPedido, p.id, p.usuario, telefonoDe(p)].join(' '));
            if (!campos.includes(texto)) return false;
        }

        if (desde || hasta) {
            const f = new Date(p.fecha);
            if (isNaN(f)) return false;
            if (desde && f < desde) return false;
            if (hasta && f > hasta) return false;
        }
        return true;
    });

    window.renderizarPedidosAdmin(ordenarPedidos(filtrados), false);

    const contador = document.getElementById('admin-contador');
    if (contador) {
        contador.textContent = `Mostrando ${filtrados.length} de ${todos.length} pedidos`;
    }
}

window.filtrarPorEstado = function (estado) {
    filtroActual = estado;
    document.querySelectorAll('.filtro-estado').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.estado === estado);
    });
    window.aplicarFiltros();
}

window.limpiarFiltros = function () {
    ['filtro-texto', 'filtro-desde', 'filtro-hasta'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    window.filtrarPorEstado('todos');
}

// ==================== RENDER ====================
window.renderizarPedidosAdmin = function (pedidos, guardarComoTotal = true) {
    if (guardarComoTotal) {
        // Carga inicial: se guarda el total y se aplican orden y filtros
        window.todosPedidosAdmin = pedidos;
        window.aplicarFiltros();
        return;
    }

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
        const estado = estadoDe(pedido);
        const claseEstado = estadoClases[estado] || 'estado-pendiente';
        const iconoEstado = estadoIconos[estado] || 'fa-clock';
        const esRetiro = pedido.tipoEnvio === 'retiro';
        const cantProductos = pedido.productos?.reduce((sum, p) => sum + p.cantidad, 0) || 0;
        const clienteNombre = pedido.usuario || 'Cliente sin nombre';

        // Opciones de estado según tipo de envío
        const opciones = esRetiro
            ? ['preparando', 'entregado', 'cancelado']
            : ['preparando', 'despachado', 'entregado', 'cancelado'];

        const botonEliminar = estado === 'cancelado'
            ? `<button class="btn-eliminar" onclick="eliminarPedidoAdmin('${esc(pedido.id)}')">
                   <i class="fa-solid fa-trash"></i> Eliminar
               </button>`
            : '';

        return `
            <div class="admin-pedido-card">
                <div class="admin-pedido-header">
                    <div>
                        <div class="pedido-nro">${esc(pedido.nroPedido || pedido.id)}</div>
                        <div class="pedido-fecha">${fechaStr} ${horaStr}hs · ${esRetiro ? 'Retiro en local' : 'Envío a domicilio'}</div>
                        <div class="pedido-fecha">${esc(clienteNombre)}</div>
                        <div class="pedido-fecha">${esc(telefonoDe(pedido) || 'Sin teléfono')}</div>
                    </div>
                    <span class="pedido-estado ${claseEstado}">
                        <i class="fa-solid ${iconoEstado}"></i> ${esc(estado.charAt(0).toUpperCase() + estado.slice(1))}
                    </span>
                </div>
                <div class="admin-pedido-body">
                    <div class="pedido-info-item"><span>Productos</span><span> ${cantProductos} unidades</span></div>
                    <div class="pedido-info-item"><span>Total</span><span class="precio"> $${(Math.round((pedido.total || 0) * 100) / 100).toLocaleString('es-AR')}</span></div>
                    <div class="admin-cambio-estado">
                        <label>Cambiar estado:</label>
                        <select onchange="cambiarEstadoPedido('${esc(pedido.id)}', this.value)">
                            <option value="">-- Elegir --</option>
                            ${opciones.map(o => `<option value="${o}" ${o === estado ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="admin-pedido-botones">
                        <button class="btn-ver-detalle" onclick="verDetalleAdmin('${esc(pedido.id)}')">
                            <i class="fa-solid fa-eye"></i> Ver detalle e historial
                        </button>
                        ${botonEliminar}
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
        window.aplicarFiltros();
    } else {
        alert('No se pudo actualizar el estado. Probá de nuevo.');
    }
}

// ==================== ELIMINAR (PAPELERA) ====================
window.eliminarPedidoAdmin = async function (pedidoId) {
    const pedido = window.todosPedidosAdmin?.find(p => p.id === pedidoId);
    if (!pedido) return;

    const nro = pedido.nroPedido || pedidoId;
    const seguro = confirm(
        `¿Eliminar el pedido ${nro}?\n\n` +
        'Se mueve a la Papelera y el cliente deja de verlo. ' +
        'Podés restaurarlo desde el botón "Papelera".'
    );
    if (!seguro) return;

    window.mostrarLoading('Eliminando...');
    const ok = await window.moverPedidoAPapelera(pedidoId);
    window.ocultarLoading();

    if (ok) {
        window.todosPedidosAdmin = window.todosPedidosAdmin.filter(p => p.id !== pedidoId);
        window.aplicarFiltros();
    } else {
        alert('No se pudo eliminar el pedido. Probá de nuevo.');
    }
}

window.abrirPapelera = async function () {
    const contenido = document.getElementById('papelera-contenido');
    contenido.innerHTML = '<p>Cargando...</p>';
    document.getElementById('modal-papelera').classList.add('activo');
    document.body.style.overflow = 'hidden';

    const lista = await window.cargarPapelera();
    if (lista === null) {
        contenido.innerHTML = '<p>No se pudo cargar la papelera. Probá de nuevo.</p>';
        return;
    }
    if (lista.length === 0) {
        contenido.innerHTML = '<p>La papelera está vacía.</p>';
        return;
    }

    contenido.innerHTML = lista.map(item => {
        const p = item.pedido || {};
        return `
            <div class="papelera-item">
                <div>
                    <b>${esc(p.nroPedido || item.pedidoId)}</b> — ${esc(p.usuario || 'Cliente sin nombre')}<br>
                    <span class="pedido-fecha">
                        Pedido del ${new Date(p.fecha).toLocaleDateString('es-AR')} ·
                        eliminado por ${esc(nombreAutor(item.eliminadoPor))}
                        el ${new Date(item.eliminadoEn).toLocaleString('es-AR')}
                    </span>
                </div>
                <button class="btn-ver-detalle" onclick="restaurarPedidoAdmin('${esc(item.id)}')">
                    <i class="fa-solid fa-rotate-left"></i> Restaurar
                </button>
            </div>
        `;
    }).join('');
}

window.restaurarPedidoAdmin = async function (papeleraId) {
    window.mostrarLoading('Restaurando...');
    const pedido = await window.restaurarPedidoDePapelera(papeleraId);
    window.ocultarLoading();

    if (pedido) {
        window.todosPedidosAdmin = [...(window.todosPedidosAdmin || []), pedido];
        window.aplicarFiltros();
        window.abrirPapelera();
    } else {
        alert('No se pudo restaurar el pedido. Probá de nuevo.');
    }
}

window.cerrarPapelera = function () {
    document.getElementById('modal-papelera').classList.remove('activo');
    document.body.style.overflow = '';
}

// ==================== DETALLE + HISTORIAL ====================
window.verDetalleAdmin = async function (id) {
    const pedido = window.todosPedidosAdmin?.find(p => p.id === id);
    if (!pedido) return;

    // Deja anotado (interno) que este usuario abrió el pedido
    window.registrarVistaPedido?.(pedido);

    document.getElementById('admin-detalle-nro').textContent = pedido.nroPedido || id;

    const historial = pedido.historialEstados || [];
    const historialHtml = historial.length
        ? historial.map(h => `
            <div class="historial-item">
                <i class="fa-solid fa-clock"></i>
                <span><b>${esc(h.estado)}</b> — ${new Date(h.fecha).toLocaleString('es-AR')} — por ${esc(nombreAutor(h.autor))}</span>
            </div>
        `).join('')
        : '<p>Sin cambios de estado registrados todavía.</p>';

    const vistos = pedido.vistoPor || [];
    const vistosHtml = vistos.length
        ? vistos.map(v => `
            <div class="historial-item">
                <i class="fa-solid fa-eye"></i>
                <span><b>${esc(nombreAutor(v.autor))}</b> — ${new Date(v.fecha).toLocaleString('es-AR')}</span>
            </div>
        `).join('')
        : '<p>Nadie lo abrió todavía.</p>';

    // Datos del cliente que hizo el pedido (según lo que guarda guardarPedido() en firebase.js)
    const clienteNombre = pedido.usuario || '-';
    const clienteTelefono = telefonoDe(pedido) || '-';
    const clienteUid = pedido.uid || '-';

    document.getElementById('admin-detalle-contenido').innerHTML = `
        <div class="detalle-seccion">
            <h4>Cliente</h4>
            <p>Nombre: ${esc(clienteNombre)}<br>
            Teléfono: ${esc(clienteTelefono)}<br>
            ID de usuario: ${esc(clienteUid)}</p>
            <p id="admin-cliente-extra" style="font-size:0.9em;color:#888">Buscando más datos del cliente...</p>
        </div>
        <div class="detalle-seccion">
            <h4>Productos</h4>
            ${pedido.productos?.map(p => `
                <div class="detalle-producto-row">
                    <span>${esc(p.nombre)} x${esc(p.cantidad)}</span>
                    <span>$${(p.precio * p.cantidad).toLocaleString('es-AR')}</span>
                </div>
            `).join('') || ''}
            <div class="detalle-total">
                <span>Total:</span>
                <span>$${(Math.round((pedido.total || 0) * 100) / 100).toLocaleString('es-AR')}</span>
            </div>
        </div>
        <div class="detalle-seccion">
            <h4>Criterio de reemplazo</h4>
            <p>${esc(pedido.reemplazo || '-')}</p>
        </div>
        <div class="detalle-seccion">
            <h4>Envío</h4>
            <p>${pedido.tipoEnvio === 'retiro'
                ? 'Retiro en local.'
                : `${esc(pedido.direccion?.calle || '')} ${esc(pedido.direccion?.numero || '')}, ${esc(pedido.direccion?.localidad || '')}<br>Tel: ${esc(pedido.direccion?.telefono || '')}`
            }</p>
        </div>
        <div class="detalle-seccion">
            <h4>Historial de estados (interno)</h4>
            ${historialHtml}
        </div>
        <div class="detalle-seccion">
            <h4>Quién vio este pedido (interno)</h4>
            ${vistosHtml}
        </div>
    `;

    document.getElementById('modal-admin-detalle').classList.add('activo');
    document.body.style.overflow = 'hidden';

    // Busca datos extra del cliente (celular, dni, localidad) en su perfil.
    // Se hace después de mostrar el modal para no demorar la apertura.
    const extraEl = document.getElementById('admin-cliente-extra');
    if (pedido.uid && window.obtenerDatosCliente) {
        const datos = await window.obtenerDatosCliente(pedido.uid);
        if (extraEl) {
            if (datos) {
                extraEl.innerHTML = `
                    Celular: ${esc(datos.celular || '-')}<br>
                    DNI/CUIT: ${esc(datos.dni || '-')}<br>
                    Localidad: ${esc(datos.localidad || '-')}, ${esc(datos.provincia || '-')}
                `;
                extraEl.style.color = '';
            } else {
                extraEl.textContent = 'No se encontraron más datos de perfil para este cliente.';
            }
        }
    } else if (extraEl) {
        extraEl.textContent = '';
    }
}

window.cerrarDetalleAdmin = function () {
    document.getElementById('modal-admin-detalle').classList.remove('activo');
    document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
    const detalle = document.getElementById('modal-admin-detalle');
    if (e.target === detalle) window.cerrarDetalleAdmin();
    const papelera = document.getElementById('modal-papelera');
    if (e.target === papelera) window.cerrarPapelera();
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
