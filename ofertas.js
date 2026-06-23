// ==================== DATOS ====================
const PRODUCTOS_URL = 'data/productos.json';
let todosLosProductos = [];

// ==================== CARGA INICIAL ====================
async function cargarProductos() {
  mostrarLoadingOfertas(true);
  try {
    const res = await fetch(PRODUCTOS_URL);
    if (!res.ok) throw new Error('No se pudo cargar el catálogo');
    const data = await res.json();
    todosLosProductos = data.productos;

    generarFiltrosCategorias();
    aplicarFiltros();

  } catch (err) {
    console.error('Error:', err);
    document.getElementById('productos-grid').innerHTML =
      '<p class="sin-resultados">No se pudieron cargar los productos. Intentá de nuevo más tarde.</p>';
  } finally {
    mostrarLoadingOfertas(false);
  }
}

// ==================== RENDER ====================
function renderizarProductos(lista) {
  const grid = document.getElementById('productos-grid');

  if (lista.length === 0) {
    grid.innerHTML = '<p class="sin-resultados">No se encontraron productos.</p>';
    return;
  }

  grid.innerHTML = lista.map(p => `
    <div class="producto-card" data-familia="${p.familia}">
      <img src="https://placehold.co/180x180/f5f5f5/fe6902?text=${encodeURIComponent(p.familia || 'GP')}"
           alt="${p.nombre}" class="producto-img">
      <p class="producto-nombre">${p.nombre}</p>
      <p class="producto-precio">${formatearPrecio(p.precio)}</p>
      <p class="producto-bulto">Bulto x ${p.unidadesBulto} u.</p>
      <div class="producto-acciones">
        <div class="cantidad-wrap">
          <button onclick="cambiarCantidad(this, -1)">−</button>
          <span>1</span>
          <button onclick="cambiarCantidad(this, 1)">+</button>
        </div>
        <button class="btn-comprar" 
  data-nombre="${p.nombre.replace(/"/g, '&quot;')}"
  data-precio="${p.precio}"
  onclick="agregarAlCarrito(this)">COMPRAR</button>
      </div>
    </div>
  `).join('');
}

function formatearPrecio(precio) {
  return precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ==================== FILTROS DINÁMICOS ====================
function generarFiltrosCategorias() {
  const familias = [...new Set(todosLosProductos.map(p => p.familia).filter(Boolean))].sort();
  const contenedor = document.getElementById('filtro-categoria');
  contenedor.innerHTML = familias.map(f =>
    `<label><input type="checkbox" value="${f}" onchange="aplicarFiltros()"> ${f}</label>`
  ).join('');
}

function aplicarFiltros() {
  const categoriasSeleccionadas = [
    ...document.querySelectorAll('#filtro-categoria input:checked')
  ].map(i => i.value);

  const ordenSeleccionado = document.querySelector('input[name="orden"]:checked')?.value;
  const textoBusqueda = document.querySelector('.search-box input')?.value.toLowerCase().trim() || '';

  let resultado = [...todosLosProductos];

  if (categoriasSeleccionadas.length > 0) {
    resultado = resultado.filter(p => categoriasSeleccionadas.includes(p.familia));
  }

  if (textoBusqueda) {
    resultado = resultado.filter(p => p.nombre.toLowerCase().includes(textoBusqueda));
  }

  if (ordenSeleccionado === 'menor') resultado.sort((a, b) => a.precio - b.precio);
  if (ordenSeleccionado === 'mayor') resultado.sort((a, b) => b.precio - a.precio);

  renderizarProductos(resultado);
}

// ==================== FILTROS UI ====================
function toggleFiltro(nombre) {
  const opciones = document.getElementById(`filtro-${nombre}`);
  const icon = document.getElementById(`icon-${nombre}`);
  opciones.classList.toggle('activo');
  icon.textContent = opciones.classList.contains('activo') ? '−' : '+';
}

// ==================== CANTIDAD ====================
function cambiarCantidad(btn, cambio) {
  const wrap = btn.parentElement;
  const span = wrap.querySelector('span');
  let cantidad = parseInt(span.textContent);
  cantidad = Math.max(1, cantidad + cambio);
  span.textContent = cantidad;
}

// ==================== CARRITO ====================
function agregarAlCarrito(btn) {
    const nombre = btn.dataset.nombre;
    const precio = parseFloat(btn.dataset.precio);
    const wrap = btn.closest('.mv-acciones, .producto-acciones')?.querySelector('.cantidad-wrap span');
    const cantidad = wrap ? parseInt(wrap.textContent) : 1;

    carritoIndex = JSON.parse(localStorage.getItem('carritoGP') || '[]');
    const existe = carritoIndex.find(p => p.nombre === nombre);
    if (existe) {
        existe.cantidad += cantidad;
    } else {
        carritoIndex.push({ nombre, precio, cantidad });
    }

    localStorage.setItem('carritoGP', JSON.stringify(carritoIndex));
    actualizarPanelCarrito();

    btn.textContent = '✓ Agregado';
    btn.style.background = '#3DB549';
    setTimeout(() => {
        btn.textContent = 'COMPRAR';
        btn.style.background = '';
    }, 1500);
}

// ==================== LOADING ====================
function mostrarLoadingOfertas(mostrar) {
  const el = document.getElementById('loading');
  if (el) el.style.display = mostrar ? 'flex' : 'none';
}

// ==================== INIT ====================
window.addEventListener('load', () => {
  actualizarPanelCarrito();
  cargarProductos();

  const buscador = document.querySelector('.search-box input');
  if (buscador) buscador.addEventListener('input', aplicarFiltros);

  document.querySelectorAll('input[name="orden"]').forEach(r =>
    r.addEventListener('change', aplicarFiltros)
  );
});