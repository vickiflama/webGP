// pedido-confirmado.js
const pedido = JSON.parse(localStorage.getItem('ultimoPedido') || '{}');

// Número de pedido
document.getElementById('conf-nro-pedido').textContent = 
    localStorage.getItem('ultimoPedidoNro') || '-';

// Productos
const confProductos = document.getElementById('conf-productos');
if (pedido.productos) {
    confProductos.innerHTML = pedido.productos.map(p => `
        <div class="resumen-item">
            <span>${p.nombre} x${p.cantidad}</span>
            <span>$${(p.precio * p.cantidad).toLocaleString('es-AR')}</span>
        </div>
    `).join('');
}

document.getElementById('conf-total').textContent = `$${(pedido.total || 0).toLocaleString('es-AR')}`;
document.getElementById('conf-reemplazo').textContent = pedido.reemplazo || '-';
document.getElementById('conf-pago').textContent = (pedido.pago || '-') + (pedido.factura ? ' + Factura' : '');

// Envío
if (pedido.tipoEnvio === 'retiro') {
    document.getElementById('conf-envio').textContent = 'Retiro en Bv. Lovatto N° 1313, Reconquista, Santa Fe.';
} else if (pedido.direccion) {
    const d = pedido.direccion;
    document.getElementById('conf-envio').innerHTML = `
        ${d.calle} ${d.numero}${d.piso ? ', Piso ' + d.piso : ''}${d.depto ? ' Dpto ' + d.depto : ''}<br>
        ${d.localidad}, ${d.provincia} (CP: ${d.cp})<br>
        Tel: ${d.telefono}<br>
        Turno: ${pedido.turno}
    `;
}

// DESCARGAR PDF

function descargarPDF() {
    window.open('pedido-pdf.html', '_blank');
}