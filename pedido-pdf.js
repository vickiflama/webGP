// ==================== PEDIDO PDF ====================
const pedido = JSON.parse(localStorage.getItem('ultimoPedido') || '{}');
const nroPedido = localStorage.getItem('ultimoPedidoNro') || '-';

document.getElementById('nro-pedido').textContent = nroPedido;
document.getElementById('pdf-total').textContent = `$${(pedido.total || 0).toLocaleString('es-AR')}`;
document.getElementById('pdf-reemplazo').textContent = pedido.reemplazo || '-';
document.getElementById('pdf-pago').textContent = (pedido.pago || '-') + (pedido.factura ? ' + Factura' : '');

// Fecha y hora exacta
const fecha = new Date(pedido.fecha);
const fechaStr = fecha.toLocaleDateString('es-AR');
const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
document.getElementById('pdf-fecha-hora').textContent = `${fechaStr} ${horaStr}hs`;

// Productos
const prods = document.getElementById('pdf-productos');
if (pedido.productos) {
    prods.innerHTML = pedido.productos.map(p => `
        <div class="producto-row">
            <span>${p.nombre} x${p.cantidad}</span>
            <span>$${(p.precio * p.cantidad).toLocaleString('es-AR')}</span>
        </div>

        
    `).join('');
}


// Envases
if (pedido.costoEnvases && pedido.costoEnvases > 0) {
    prods.innerHTML += `
        <div class="producto-row">
            <span>Envases retornables</span>
            <span>+$${pedido.costoEnvases.toLocaleString('es-AR')}</span>
        </div>
    `;
}

// Envío
if (pedido.tipoEnvio === 'retiro') {
    document.getElementById('pdf-envio').textContent = 'Retiro en Bv. Lovatto N° 1313, Reconquista, Santa Fe.';
} else if (pedido.direccion) {
    const d = pedido.direccion;
    document.getElementById('pdf-envio').innerHTML = `
        ${d.calle} ${d.numero}${d.piso ? ', Piso ' + d.piso : ''}${d.depto ? ' Dpto ' + d.depto : ''}<br>
        ${d.localidad}, ${d.provincia} (CP: ${d.cp})<br>
        Tel: ${d.telefono}<br>
        Turno: ${pedido.turno || ''}
    `;
}

// Descarga automáticamente
window.addEventListener('load', function() {
    const opciones = {
        margin: 10,
        filename: `Pedido-${nroPedido}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
        html2pdf().from(document.body).set(opciones).save().then(() => {
            window.close();
        });
    }, 500);
});