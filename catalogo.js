// ==================== DATOS ====================
const PRODUCTOS_URL = "data/productos.json";
const PRODUCTOS_POR_PAGINA = 20;

let todosLosProductos = [];
let productosFiltrados = [];
let paginaActual = 1;

// ==================== CARGA INICIAL ====================
async function cargarProductos() {
  mostrarLoadingCatalogo(true);
  try {
    const res = await fetch(PRODUCTOS_URL);
    if (!res.ok) throw new Error("No se pudo cargar el catálogo");
    const data = await res.json();
    todosLosProductos = data.productos;
    generarFiltrosCategorias();

    const params = new URLSearchParams(window.location.search);
    const textoBuscar = params.get("buscar");
    const categoriaParam = params.get("categoria");

    if (textoBuscar) {
      const inputBuscador = document.querySelector(".search-box input");
      if (inputBuscador) inputBuscador.value = textoBuscar;
    }

    if (categoriaParam) {
      const checkbox = document.querySelector(
        `#filtro-categoria input[value="${categoriaParam}"]`
      );
      if (checkbox) checkbox.checked = true;
    }

    aplicarFiltros();
  } catch (err) {
    console.error("Error:", err);
    document.getElementById("productos-grid").innerHTML =
      '<p class="sin-resultados">No se pudieron cargar los productos. Intentá de nuevo más tarde.</p>';
  } finally {
    mostrarLoadingCatalogo(false);
  }
}

// ==================== RENDER ====================
function renderizarProductos(lista) {
  const grid = document.getElementById("productos-grid");

  if (lista.length === 0) {
    grid.innerHTML = '<p class="sin-resultados">No se encontraron productos.</p>';
    renderizarPaginacion(0);
    return;
  }

  const totalPaginas = Math.ceil(lista.length / PRODUCTOS_POR_PAGINA);
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;

  const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const fin = inicio + PRODUCTOS_POR_PAGINA;
  const visibles = lista.slice(inicio, fin);

  grid.innerHTML = visibles.map((p) => `
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
           data-id="${p.id}"
          onclick="agregarAlCarrito(this)">COMPRAR</button>
      </div>
    </div>
  `).join("");

  renderizarPaginacion(totalPaginas);

  document.getElementById("productos-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ==================== PAGINACIÓN ====================
function renderizarPaginacion(totalPaginas) {
  const contenedor = document.getElementById("paginacion");
  if (!contenedor) return;

  if (totalPaginas <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  const botones = [];

  botones.push(`
    <button class="pag-btn pag-nav ${paginaActual === 1 ? 'disabled' : ''}"
      onclick="irAPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `);

  const rango = generarRangoPaginas(paginaActual, totalPaginas);
  for (const item of rango) {
    if (item === "...") {
      botones.push(`<span class="pag-ellipsis">…</span>`);
    } else {
      botones.push(`
        <button class="pag-btn ${item === paginaActual ? 'activo' : ''}"
          onclick="irAPagina(${item})">${item}</button>
      `);
    }
  }

  botones.push(`
    <button class="pag-btn pag-nav ${paginaActual === totalPaginas ? 'disabled' : ''}"
      onclick="irAPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `);

  const total = productosFiltrados.length;
  const desde = (paginaActual - 1) * PRODUCTOS_POR_PAGINA + 1;
  const hasta = Math.min(paginaActual * PRODUCTOS_POR_PAGINA, total);

  contenedor.innerHTML = `
    <p class="pag-info">Mostrando ${desde}–${hasta} de ${total} productos</p>
    <div class="pag-botones">${botones.join("")}</div>
  `;
}

function generarRangoPaginas(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const rango = [];
  if (actual <= 4) {
    for (let i = 1; i <= 5; i++) rango.push(i);
    rango.push("...");
    rango.push(total);
  } else if (actual >= total - 3) {
    rango.push(1);
    rango.push("...");
    for (let i = total - 4; i <= total; i++) rango.push(i);
  } else {
    rango.push(1);
    rango.push("...");
    for (let i = actual - 1; i <= actual + 1; i++) rango.push(i);
    rango.push("...");
    rango.push(total);
  }
  return rango;
}

function irAPagina(pagina) {
  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderizarProductos(productosFiltrados);
}

function formatearPrecio(precio) {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ==================== FILTROS DINÁMICOS ====================
function generarFiltrosCategorias() {
  const rubros = [
    ...new Set(todosLosProductos.map((p) => p.rubro).filter(Boolean)),
  ].sort();
  const contenedor = document.getElementById("filtro-categoria");
  contenedor.innerHTML = rubros
    .map((r) => `<label><input type="checkbox" value="${r}" onchange="aplicarFiltros()"> ${r}</label>`)
    .join("");
}

function aplicarFiltros() {
  const categoriasSeleccionadas = [
    ...document.querySelectorAll("#filtro-categoria input:checked"),
  ].map((i) => i.value);

  const ordenSeleccionado = document.querySelector('input[name="orden"]:checked')?.value;
  const textoBusqueda =
    document.querySelector(".search-box input")?.value.toLowerCase().trim() || "";

  let resultado = [...todosLosProductos];

  if (categoriasSeleccionadas.length > 0) {
    resultado = resultado.filter(p => categoriasSeleccionadas.includes(p.rubro));
  }
  if (textoBusqueda) {
    resultado = resultado.filter((p) => p.nombre.toLowerCase().includes(textoBusqueda));
  }
  if (ordenSeleccionado === "menor") resultado.sort((a, b) => a.precio - b.precio);
  if (ordenSeleccionado === "mayor") resultado.sort((a, b) => b.precio - a.precio);

  productosFiltrados = resultado;
  paginaActual = 1;
  renderizarProductos(productosFiltrados);
}

// ==================== FILTROS UI ====================
function toggleFiltro(nombre) {
  const opciones = document.getElementById(`filtro-${nombre}`);
  const icon = document.getElementById(`icon-${nombre}`);
  opciones.classList.toggle("activo");
  icon.textContent = opciones.classList.contains("activo") ? "−" : "+";
}

// ==================== CANTIDAD ====================
function cambiarCantidad(btn, cambio) {
  const wrap = btn.parentElement;
  const span = wrap.querySelector("span");
  let cantidad = parseInt(span.textContent);
  cantidad = Math.max(1, cantidad + cambio);
  span.textContent = cantidad;
}

// ==================== CARRITO ====================
function agregarAlCarrito(btn) {
  const nombre = btn.dataset.nombre;
  const precio = parseFloat(btn.dataset.precio);
  const id = parseInt(btn.dataset.id) || 0;
  const wrap = btn
    .closest(".mv-acciones, .producto-acciones")
    ?.querySelector(".cantidad-wrap span");
  const cantidad = wrap ? parseInt(wrap.textContent) : 1;

  carritoIndex = JSON.parse(localStorage.getItem("carritoGP") || "[]");
  const existe = carritoIndex.find((p) => p.nombre === nombre);
  if (existe) {
    existe.cantidad += cantidad;
  } else {
    carritoIndex.push({ id, nombre, precio, cantidad });
  }

  localStorage.setItem("carritoGP", JSON.stringify(carritoIndex));
  actualizarPanelCarrito();

  btn.textContent = "✓ Agregado";
  btn.style.background = "#3DB549";
  setTimeout(() => {
    btn.textContent = "COMPRAR";
    btn.style.background = "";
  }, 1500);
}

// ==================== LOADING ====================
function mostrarLoadingCatalogo(mostrar) {
  const el = document.getElementById("loading");
  if (el) el.style.display = mostrar ? "flex" : "none";
}

// ==================== INIT ====================
window.addEventListener("load", () => {
  actualizarPanelCarrito();
  cargarProductos();

  const buscador = document.querySelector(".search-box input");
  if (buscador) {
    buscador.addEventListener("input", aplicarFiltros);
    buscador.addEventListener("keydown", (e) => {
      if (e.key === "Enter") aplicarFiltros();
    });

    const searchIcon = document.querySelector(".search-box i");
    if (searchIcon) searchIcon.addEventListener("click", aplicarFiltros);
  }

  document
    .querySelectorAll('input[name="orden"]')
    .forEach((r) => r.addEventListener("change", aplicarFiltros));
});