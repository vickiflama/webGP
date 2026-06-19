// ==================== FILTROS ====================
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
  cantidad += cambio;
  if (cantidad < 1) cantidad = 1;
  span.textContent = cantidad;
}

// ==================== CARRITO ====================
function agregarAlCarrito(nombre, precio, btn) {
  const wrap = btn
    .closest(".mv-acciones, .producto-acciones")
    ?.querySelector(".cantidad-wrap span");
  const cantidad = wrap ? parseInt(wrap.textContent) : 1;

  carritoIndex = JSON.parse(localStorage.getItem("carritoGP") || "[]");
  const existe = carritoIndex.find((p) => p.nombre === nombre);
  if (existe) {
    existe.cantidad += cantidad;
  } else {
    carritoIndex.push({ nombre, precio, cantidad });
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

// ==================== INIT ====================
window.addEventListener("load", function () {
  actualizarPanelCarrito();
});