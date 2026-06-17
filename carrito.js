const MINIMO_COMPRA = 50000;

// Carga el carrito desde localStorage o el carrito de ofertas.js
let carritoData = JSON.parse(localStorage.getItem("carritoGP") || "[]");

// ==================== PASO ====================
let pasoActual = 1;

function irPaso(paso) {
  // Validaciones
  if (paso === 2 && !validarPaso1()) return;
  if (paso === 4 && !validarPaso3()) return;
  if (paso === 5 && !validarPaso4()) return;

  // Oculta el paso actual
  document.getElementById(`paso-${pasoActual}`).style.display = "none";

  // Marca como completado
  document.getElementById(`step-ind-${pasoActual}`).classList.remove("activo");
  document.getElementById(`step-ind-${pasoActual}`).classList.add("completado");
  if (pasoActual < 5) {
    document.getElementById(`linea-${pasoActual}`).classList.add("completada");
  }

  // Muestra el nuevo paso
  pasoActual = paso;
  document.getElementById(`paso-${pasoActual}`).style.display = "block";
  document.getElementById(`step-ind-${pasoActual}`).classList.add("activo");

  // Si es el paso 5 arma el resumen
  if (paso === 5) armarResumen();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================== VALIDACIONES ====================
function validarPaso1() {
  const total = calcularTotal();
  if (carritoData.length === 0) {
    alert("Tu carrito está vacío.");
    return false;
  }
  if (total < MINIMO_COMPRA) {
    document.getElementById("alerta-minimo").style.display = "flex";
    return false;
  }
  return true;
}

function validarPaso3() {
  const envio = document.querySelector('input[name="envio"]:checked');
  if (!envio) {
    alert("Seleccioná una opción de envío.");
    return false;
  }
  if (envio.value === "envio") {
    const calle = document.getElementById("env-calle").value.trim();
    const numero = document.getElementById("env-numero").value.trim();
    const telefono = document.getElementById("env-telefono").value.trim();

    if (!calle || !numero) {
      alert("Completá al menos la calle y el número.");
      return false;
    }
    if (!telefono) {
      alert("Ingresá un teléfono de contacto.");
      return false;
    }
    if (!diaSeleccionado) {
      alert("Seleccioná un día de entrega.");
      return false;
    }
    const franja = document.querySelector('input[name="franja"]:checked');
    if (!franja) {
      alert("Seleccioná un horario de entrega.");
      return false;
    }
  }
  return true;
}

function validarPaso4() {
  const pago = document.querySelector('input[name="pago"]:checked');
  if (!pago) {
    alert("Seleccioná un método de pago.");
    return false;
  }
  const factura = document.getElementById("check-factura").checked;
  if (factura) {
    const cuit = document.getElementById("fact-cuit").value.trim();
    const razon = document.getElementById("fact-razon").value.trim();
    if (!cuit || !razon) {
      alert("Completá el CUIT y la razón social para la factura.");
      return false;
    }
  }
  return true;
}

// ==================== CARRITO ====================
function calcularTotal() {
  return carritoData.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
}

function renderizarCarrito() {
  const lista = document.getElementById("carrito-lista");
  const badge = document.getElementById("cart-badge");
  const totalEl = document.getElementById("carrito-total");

  if (!lista) return;

  lista.innerHTML = "";

  if (carritoData.length === 0) {
    lista.innerHTML =
      '<div style="padding:20px; text-align:center; color:#999">Tu carrito está vacío</div>';
  }

  carritoData.forEach((producto, index) => {
    const row = document.createElement("div");
    row.className = "carrito-row";
    row.innerHTML = `
            <span class="carrito-row-nombre">${producto.nombre}</span>
            <span class="carrito-row-precio">$${producto.precio.toLocaleString("es-AR")}</span>
            <div class="carrito-row-cantidad">
                <button onclick="cambiarCantidadCarrito(${index}, -1)">−</button>
                <span>${producto.cantidad}</span>
                <button onclick="cambiarCantidadCarrito(${index}, 1)">+</button>
            </div>
            <span class="carrito-row-subtotal">$${(producto.precio * producto.cantidad).toLocaleString("es-AR")}</span>
            <button class="carrito-row-eliminar" onclick="eliminarProducto(${index})">
                <i class="fa-solid fa-circle-xmark"></i>
            </button>
        `;
    lista.appendChild(row);
  });

  const total = calcularTotal();
  if (totalEl) totalEl.textContent = `$${total.toLocaleString("es-AR")}`;
  if (badge)
    badge.textContent = carritoData.reduce((sum, p) => sum + p.cantidad, 0);

  // Muestra alerta si no llega al mínimo
  const alerta = document.getElementById("alerta-minimo");
  if (alerta) {
    alerta.style.display = total > 0 && total < MINIMO_COMPRA ? "flex" : "none";
  }

  localStorage.setItem("carritoGP", JSON.stringify(carritoData));
}

function cambiarCantidadCarrito(index, cambio) {
  carritoData[index].cantidad += cambio;
  if (carritoData[index].cantidad < 1) carritoData[index].cantidad = 1;
  renderizarCarrito();
}

function eliminarProducto(index) {
  carritoData.splice(index, 1);
  renderizarCarrito();
}

// ==================== ENVÍO ====================
function mostrarFormEnvio() {
  const envio = document.querySelector('input[name="envio"]:checked');
  const form = document.getElementById("form-direccion");
  if (envio && envio.value === "envio") {
    form.style.display = "block";
  } else {
    form.style.display = "none";
  }
}

// ==================== FACTURA ====================
document.addEventListener("DOMContentLoaded", function () {
  const checkFactura = document.getElementById("check-factura");
  if (checkFactura) {
    checkFactura.addEventListener("change", function () {
      document.getElementById("form-factura").style.display = this.checked
        ? "block"
        : "none";
    });
  }
  renderizarCarrito();
});

// ==================== RESUMEN ====================
function armarResumen() {
  // Productos
  const resumenProductos = document.getElementById("resumen-productos");
  const resumenTotal = document.getElementById("resumen-total");
  resumenProductos.innerHTML = carritoData
    .map(
      (p) => `
        <div class="resumen-item">
            <span>${p.nombre} x${p.cantidad}</span>
            <span>$${(p.precio * p.cantidad).toLocaleString("es-AR")}</span>
        </div>
    `,
    )
    .join("");
  resumenTotal.textContent = `$${calcularTotal().toLocaleString("es-AR")}`;

  // Reemplazo
  const reemplazo = document.querySelector('input[name="reemplazo"]:checked');
  const textos = {
    granprix: "Gran Prix elige un producto similar",
    no: "No reemplazar",
    whatsapp: "Contactar por WhatsApp",
  };
  document.getElementById("resumen-reemplazo").textContent = reemplazo
    ? textos[reemplazo.value]
    : "-";

  // Envío
  const envio = document.querySelector('input[name="envio"]:checked');
  if (envio?.value === "retiro") {
    document.getElementById("resumen-envio").textContent =
      "Retiro en Bv. Lovatto N° 1313, Reconquista, Santa Fe.";
  } else if (envio?.value === "envio") {
    const calle = document.getElementById("env-calle").value;
    const numero = document.getElementById("env-numero").value;
    const localidad = document.getElementById("env-localidad").value;
    const franja = document.querySelector('input[name="franja"]:checked');
    const franjaTexto =
      franja?.value === "manana" ? "8:00 - 12:00hs" : "12:00 - 16:00hs";
    const fechaTexto = diaSeleccionado?.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    document.getElementById("resumen-envio").textContent =
      `${calle} ${numero}, ${localidad} — ${fechaTexto} ${franjaTexto}`;
  }

  // Pago
  const pago = document.querySelector('input[name="pago"]:checked');
  const textosPago = {
    efectivo: "Efectivo",
    transferencia: "Transferencia bancaria",
    tarjeta: "Tarjeta de débito/crédito",
  };
  const factura = document.getElementById("check-factura").checked;
  document.getElementById("resumen-pago").textContent =
    (pago ? textosPago[pago.value] : "-") + (factura ? " + Factura" : "");
}

// ==================== CONFIRMAR ====================
async function confirmarPedido() {
  window.mostrarLoading("Guardando pedido...");

  try {
    // Recolecta todos los datos
    const envio = document.querySelector('input[name="envio"]:checked');
    const reemplazo = document.querySelector('input[name="reemplazo"]:checked');
    const pago = document.querySelector('input[name="pago"]:checked');
    const franja = document.querySelector('input[name="franja"]:checked');
    const factura = document.getElementById("check-factura").checked;

    const textosPago = {
      efectivo: "Efectivo",
      transferencia: "Transferencia bancaria",
      tarjeta: "Tarjeta de débito/crédito",
    };

    const textosReemplazo = {
      granprix: "Gran Prix elige un producto similar",
      no: "No reemplazar",
      whatsapp: "Contactar por WhatsApp",
    };

    const pedido = {
      productos: carritoData,
      total: calcularTotal(),
      reemplazo: textosReemplazo[reemplazo?.value] || "-",
      tipoEnvio: envio?.value,
      pago: textosPago[pago?.value] || "-",
      factura: factura,
      fecha: new Date().toISOString(),
      estado: "pendiente",
    };

    // Datos de envío
    if (envio?.value === "envio") {
      pedido.direccion = {
        calle: document.getElementById("env-calle").value,
        numero: document.getElementById("env-numero").value,
        piso: document.getElementById("env-piso").value,
        depto: document.getElementById("env-depto").value,
        provincia: document.getElementById("env-provincia").value,
        localidad: document.getElementById("env-localidad").value,
        cp: document.getElementById("env-cp").value,
        referencias: document.getElementById("env-referencias").value,
        telefono: document.getElementById("env-telefono").value,
      };
      const franjaTexto =
        franja?.value === "manana" ? "8:00 - 12:00hs" : "12:00 - 16:00hs";
      const fechaTexto = diaSeleccionado?.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      pedido.turno = `${fechaTexto} ${franjaTexto}`;
    } else {
      pedido.direccion = {
        retiro: "Bv. Lovatto N° 1313, Reconquista, Santa Fe",
      };
    }

    // Guarda en localStorage para la página de confirmación
    localStorage.setItem("ultimoPedido", JSON.stringify(pedido));

    // Guarda en Firestore si hay usuario logueado
    const usuario = localStorage.getItem("usuarioNombre");
    if (usuario) {
      if (window.guardarPedido) {
        await window.guardarPedido(pedido);
      }
    }

    // Limpia el carrito
    localStorage.removeItem("carritoGP");

    window.ocultarLoading();
    window.location.href = "pedido-confirmado.html";
  } catch (error) {
    window.ocultarLoading();
    console.error("Error:", error);
    alert("Error al confirmar el pedido: " + error.message);
  }
}

// ==================== CALENDARIO ====================
let diaSeleccionado = null;

function generarCalendario() {
  const cal = document.getElementById("calendario");
  if (!cal) return;

  const hoy = new Date();
  const diasNombre = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Encabezados
  cal.innerHTML = "";
  diasNombre.forEach((d) => {
    const header = document.createElement("div");
    header.className = "cal-dia-nombre";
    header.textContent = d;
    cal.appendChild(header);
  });

  // Primer día del mes actual
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const iniciaSemana = primerDia.getDay();

  // Espacios vacíos al inicio
  for (let i = 0; i < iniciaSemana; i++) {
    const vacio = document.createElement("div");
    vacio.className = "cal-dia vacio";
    cal.appendChild(vacio);
  }

  // Días del mes
  const diasEnMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    0,
  ).getDate();

  for (let d = 1; d <= diasEnMes; d++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), d);
    const diaSemana = fecha.getDay();
    const esPasado =
      fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

    const div = document.createElement("div");
    div.textContent = d;

    if (esPasado) {
      div.className = "cal-dia pasado";
    } else if (esFinDeSemana) {
      div.className = "cal-dia no-disponible";
    } else {
      div.className = "cal-dia disponible";
      div.onclick = () => seleccionarDia(div, fecha, d);
    }

    cal.appendChild(div);
  }
}

function seleccionarDia(el, fecha, dia) {
  // Deselecciona el anterior
  document.querySelectorAll(".cal-dia.seleccionado").forEach((d) => {
    d.classList.remove("seleccionado");
    d.classList.add("disponible");
  });

  el.classList.remove("disponible");
  el.classList.add("seleccionado");

  diaSeleccionado = fecha;

  // Muestra las franjas horarias
  document.getElementById("franjas-wrap").style.display = "block";
}

// Genera el calendario al cargar
document.addEventListener("DOMContentLoaded", function () {
  generarCalendario();
  // ... resto del DOMContentLoaded que ya tenés
});

function validarPaso3() {
  const envio = document.querySelector('input[name="envio"]:checked');
  if (!envio) {
    alert("Seleccioná una opción de envío.");
    return false;
  }
  if (envio.value === "envio") {
    const calle = document.getElementById("env-calle").value.trim();
    const numero = document.getElementById("env-numero").value.trim();
    if (!calle || !numero) {
      alert("Completá al menos la calle y el número.");
      return false;
    }
    if (!diaSeleccionado) {
      alert("Seleccioná un día de entrega.");
      return false;
    }
    const franja = document.querySelector('input[name="franja"]:checked');
    if (!franja) {
      alert("Seleccioná un horario de entrega.");
      return false;
    }
  }
  return true;
}
