let carrito = JSON.parse(localStorage.getItem("carritoGP") || "[]");

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
function toggleCarrito() {
  const panel = document.getElementById("carrito-panel");
  if (carrito.length > 0) {
    panel.classList.toggle("activo");
  }
}

function agregarAlCarrito(nombre, precio, btn) {
  const wrap = btn
    .closest(".producto-acciones")
    .querySelector(".cantidad-wrap span");
  const cantidad = parseInt(wrap.textContent);

  const existe = carrito.find((p) => p.nombre === nombre);
  if (existe) {
    existe.cantidad += cantidad;
  } else {
    carrito.push({ nombre, precio, cantidad });
  }

  actualizarCarrito();
  document.getElementById("carrito-panel").classList.add("activo");
  localStorage.setItem("carritoGP", JSON.stringify(carrito));
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

function actualizarCarrito() {
  const itemsEl = document.getElementById("carrito-items");
  const contadorEl = document.getElementById("carrito-contador");
  const subtotalEl = document.getElementById("carrito-subtotal");
  const badgeEl = document.getElementById("cart-badge");

  if (!itemsEl || !contadorEl || !subtotalEl || !badgeEl) return;

  const totalProductos = carrito.reduce((sum, p) => sum + p.cantidad, 0);
  const subtotal = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  badgeEl.textContent = totalProductos;
  contadorEl.textContent = `${totalProductos} producto${totalProductos !== 1 ? "s" : ""}`;

  itemsEl.innerHTML = "";
  carrito.forEach((producto, index) => {
    const item = document.createElement("div");
    item.className = "carrito-item";
    item.innerHTML = `
            <div class="carrito-item-nombre">${producto.nombre}</div>
            <span class="carrito-item-cantidad">${producto.cantidad} U.</span>
            <span class="carrito-item-precio">$${(producto.precio * producto.cantidad).toLocaleString("es-AR")}</span>
            <button class="carrito-item-eliminar" onclick="eliminarDelCarrito(${index})">
                <i class="fa-solid fa-circle-xmark"></i>
            </button>
        `;
    itemsEl.appendChild(item);
  });

  subtotalEl.textContent = `SUBTOTAL: $${subtotal.toLocaleString("es-AR")}`;

  if (carrito.length === 0) {
    document.getElementById("carrito-panel").classList.remove("activo");
  }

  localStorage.setItem("carritoGP", JSON.stringify(carrito));
}

// ==================== HOVER CARRITO ====================
window.addEventListener("load", function () {
  const cartWrap = document.querySelector(".cart-wrap");
  const panel = document.getElementById("carrito-panel");
  actualizarCarrito();

  const badge = document.getElementById("cart-badge");
  if (badge) {
    const total = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    badge.textContent = total;
  }
  if (cartWrap && panel) {
    // ← Solo click, no hover
    cartWrap.addEventListener("click", function () {
      if (carrito.length > 0) {
        panel.classList.toggle("activo");
      }
    });

    // Cerrar clickeando fuera
    document.addEventListener("click", function (e) {
      if (!cartWrap.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.remove("activo");
      }
    });
  }
});
