const MINIMO_COMPRA = 50000;
let carritoData = JSON.parse(localStorage.getItem("carritoGP") || "[]");
let pasoActual = 1;
let diaSeleccionado = null;

// ==================== ALERTAS ====================
function mostrarAlerta(idAlerta, mensaje) {
  const alerta = document.getElementById(idAlerta);
  const texto = document.getElementById(`${idAlerta}-texto`);
  if (alerta && texto) {
    texto.textContent = mensaje;
    alerta.classList.add("activo");
    alerta.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => alerta.classList.remove("activo"), 4000);
  }
}

// ==================== PASO ====================
function irPaso(paso) {
  if (paso === 2 && !validarPaso1()) return;
  if (paso === 3 && !validarPaso2()) return;
  if (paso === 4 && !validarPaso3()) return;
  if (paso === 5 && !validarPaso4()) return;

  document.getElementById(`paso-${pasoActual}`).style.display = "none";
  document.getElementById(`step-ind-${pasoActual}`).classList.remove("activo");
  document.getElementById(`step-ind-${pasoActual}`).classList.add("completado");
  if (pasoActual < 5) {
    document.getElementById(`linea-${pasoActual}`).classList.add("completada");
  }

  pasoActual = paso;
  document.getElementById(`paso-${pasoActual}`).style.display = "block";
  document.getElementById(`step-ind-${pasoActual}`).classList.add("activo");

  if (paso === 5) armarResumen();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================== VALIDACIONES ====================
function validarPaso1() {
  const total = calcularTotal();
  if (carritoData.length === 0) {
    mostrarAlerta("alerta-paso1", "Tu carrito está vacío.");
    return false;
  }
  if (total < MINIMO_COMPRA) {
    mostrarAlerta(
      "alerta-paso1",
      `El monto mínimo de compra es $${MINIMO_COMPRA.toLocaleString("es-AR")}. Agregá más productos.`
    );
    document.getElementById("alerta-minimo").style.display = "flex";
    return false;
  }

  if (productosJsonData) {
    const productosMap = {};
    for (const p of productosJsonData.productos) {
      if (p.retornable) productosMap[p.id] = p;
    }
    const sinResponder = carritoData.filter(item =>
      productosMap[item.id] && (!envaseState[item.id] || envaseState[item.id].tieneEnvases === null)
    );
    if (sinResponder.length > 0) {
      const alerta = document.getElementById("alerta-paso1");
      const texto = document.getElementById("alerta-paso1-texto");
      if (alerta && texto) {
        texto.textContent = "⚠️ Debés indicar si tenés envases para todos los productos retornables antes de continuar.";
        alerta.classList.add("activo");
      }
      document.getElementById("seccion-envases").scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
  }

  return true;
}

function validarPaso2() {
  const reemplazo = document.querySelector('input[name="reemplazo"]:checked');
  if (!reemplazo) {
    mostrarAlerta("alerta-paso2", "Seleccioná un criterio de reemplazo.");
    return false;
  }
  return true;
}

function validarPaso3() {
  const envio = document.querySelector('input[name="envio"]:checked');
  if (!envio) {
    mostrarAlerta("alerta-paso3", "Seleccioná una opción de envío.");
    return false;
  }
  if (envio.value === "envio") {
    const calle = document.getElementById("env-calle").value.trim();
    const numero = document.getElementById("env-numero").value.trim();
    const telefono = document.getElementById("env-telefono").value.trim();
    if (!calle || !numero) {
      mostrarAlerta("alerta-paso3", "Completá al menos la calle y el número.");
      return false;
    }
    if (!telefono) {
      mostrarAlerta("alerta-paso3", "Ingresá un teléfono de contacto.");
      return false;
    }
    if (!diaSeleccionado) {
      mostrarAlerta("alerta-paso3", "Seleccioná un día de entrega.");
      return false;
    }
    const franja = document.querySelector('input[name="franja"]:checked');
    if (!franja) {
      mostrarAlerta("alerta-paso3", "Seleccioná un horario de entrega.");
      return false;
    }
  }
  return true;
}

function validarPaso4() {
  const pago = document.querySelector('input[name="pago"]:checked');
  if (!pago) {
    mostrarAlerta("alerta-paso4", "Seleccioná un método de pago.");
    return false;
  }
  const factura = document.getElementById("check-factura").checked;
  if (factura) {
    const cuit = document.getElementById("fact-cuit").value.trim();
    const razon = document.getElementById("fact-razon").value.trim();
    if (!cuit || !razon) {
      mostrarAlerta(
        "alerta-paso4",
        "Completá el CUIT y la razón social para la factura.",
      );
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

  const alerta = document.getElementById("alerta-minimo");
  if (alerta) {
    alerta.style.display = total > 0 && total < MINIMO_COMPRA ? "flex" : "none";
  }

  localStorage.setItem("carritoGP", JSON.stringify(carritoData));
  renderizarEnvases();
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

// ==================== CALENDARIO ====================
function generarCalendario() {
  const cal = document.getElementById("calendario");
  if (!cal) return;

  const hoy = new Date();
  const diasNombre = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  cal.innerHTML = "";
  diasNombre.forEach((d) => {
    const header = document.createElement("div");
    header.className = "cal-dia-nombre";
    header.textContent = d;
    cal.appendChild(header);
  });

  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const iniciaSemana = primerDia.getDay();

  for (let i = 0; i < iniciaSemana; i++) {
    const vacio = document.createElement("div");
    vacio.className = "cal-dia vacio";
    cal.appendChild(vacio);
  }

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
      div.onclick = () => seleccionarDia(div, fecha);
    }

    cal.appendChild(div);
  }
}

function seleccionarDia(el, fecha) {
  document.querySelectorAll(".cal-dia.seleccionado").forEach((d) => {
    d.classList.remove("seleccionado");
    d.classList.add("disponible");
  });

  el.classList.remove("disponible");
  el.classList.add("seleccionado");
  diaSeleccionado = fecha;

  document.getElementById("franjas-wrap").style.display = "block";
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
  generarCalendario();
});

// ==================== RESUMEN ====================
function armarResumen() {
  const resumenProductos = document.getElementById("resumen-productos");
  const resumenTotal = document.getElementById("resumen-total");
  const costoEnvases = calcularCostoEnvases();

  resumenProductos.innerHTML = carritoData.map((p) => `
    <div class="resumen-item">
      <span>${p.nombre} x${p.cantidad}</span>
      <span>$${(p.precio * p.cantidad).toLocaleString("es-AR")}</span>
    </div>
  `).join("") + (costoEnvases > 0 ? `
    <div class="resumen-item">
      <span>Envases retornables</span>
      <span>+$${costoEnvases.toLocaleString("es-AR")}</span>
    </div>
  ` : "");

  resumenTotal.textContent = `$${(calcularTotal() + costoEnvases).toLocaleString("es-AR")}`;

  const reemplazo = document.querySelector('input[name="reemplazo"]:checked');
  const textos = {
    granprix: "Gran Prix elige un producto similar",
    no: "No reemplazar",
    whatsapp: "Contactar por WhatsApp",
  };
  document.getElementById("resumen-reemplazo").textContent = reemplazo
    ? textos[reemplazo.value]
    : "-";

  const envio = document.querySelector('input[name="envio"]:checked');
  if (envio?.value === "retiro") {
    document.getElementById("resumen-envio").textContent =
      "Retiro en Bv. Lovatto N° 1313, Reconquista, Santa Fe.";
  } else if (envio?.value === "envio") {
    const calle = document.getElementById("env-calle").value;
    const numero = document.getElementById("env-numero").value;
    const localidad = document.getElementById("env-localidad").value;
    const franja = document.querySelector('input[name="franja"]:checked');
    const franjaTexto = franja?.value === "manana" ? "8:00 - 12:00hs" : "12:00 - 16:00hs";
    const fechaTexto = diaSeleccionado?.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    document.getElementById("resumen-envio").textContent =
      `${calle} ${numero}, ${localidad} — ${fechaTexto} ${franjaTexto}`;
  }

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
  // Verificar si está logueado
  const nombre = localStorage.getItem("usuarioNombre");
  if (!nombre) {
    window.abrirModal("modal-login-requerido");
    return;
  }

  window.mostrarLoading("Guardando pedido...");

  try {
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
      costoEnvases: calcularCostoEnvases(),
      total: calcularTotal() + calcularCostoEnvases(),
      reemplazo: textosReemplazo[reemplazo?.value] || "-",
      tipoEnvio: envio?.value,
      pago: textosPago[pago?.value] || "-",
      factura: factura,
      fecha: new Date().toISOString(),
      estado: "pendiente",
    };

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

    localStorage.setItem("ultimoPedido", JSON.stringify(pedido));

    if (window.guardarPedido) {
      await window.guardarPedido(pedido);
    }

    localStorage.removeItem("carritoGP");
    window.ocultarLoading();
    window.location.href = "pedido-confirmado.html";
  } catch (error) {
    window.ocultarLoading();
    console.error("Error:", error);
    mostrarAlerta(
      "alerta-paso1",
      "Error al confirmar el pedido. Intentá de nuevo.",
    );
  }
}

// ==================== ENVASES RETORNABLES ====================
let envaseState = {};
let productosJsonData = null;

async function cargarProductosJson() {
  if (productosJsonData) return productosJsonData;
  const res = await fetch("data/productos.json");
  productosJsonData = await res.json();
  return productosJsonData;
}

async function renderizarEnvases() {
  const seccion = document.getElementById("seccion-envases");
  const itemsContainer = document.getElementById("envases-items");
  if (!seccion || !itemsContainer) return;

  const data = await cargarProductosJson();
  const envasesMap = data.envases || {};

  const productosMap = {};
  for (const p of data.productos) {
    if (p.retornable) productosMap[p.id] = p;
  }

  const conRetornable = carritoData.filter((item) => productosMap[item.id]);

  if (conRetornable.length === 0) {
    seccion.style.display = "none";
    actualizarTotalConEnvases();
    return;
  }

  seccion.style.display = "block";
  let html = "";

  for (const item of conRetornable) {
    const prod = productosMap[item.id];
    const ret = prod.retornable;
    const cantTotal = ret.cantEnvases * item.cantidad;
    const envaseData = envasesMap[ret.idEnvase] || { precio: 0, unidadesBulto: 1 };
    const precioUnitario = envaseData.precio / envaseData.unidadesBulto;
    const state = envaseState[item.id] || { tieneEnvases: null, cantidadEnvases: 0 };

    html += `
      <div class="envase-item">
        <p class="envase-producto">${item.nombre}</p>
        <p class="envase-info">Necesitás <strong>${cantTotal} envases</strong> (${item.cantidad} bulto${item.cantidad > 1 ? "s" : ""} × ${ret.cantEnvases})</p>
        <div class="envase-pregunta">
          <span>¿Tenés envases?</span>
          <button class="btn-envase ${state.tieneEnvases === true ? "activo" : ""}"
            onclick="seleccionarEnvase(${item.id}, true, ${cantTotal}, ${ret.idEnvase}, ${precioUnitario})">
            ✓ Sí, tengo
          </button>
          <button class="btn-envase btn-no ${state.tieneEnvases === false ? "activo" : ""}"
            onclick="seleccionarEnvase(${item.id}, false, ${cantTotal}, ${ret.idEnvase}, ${precioUnitario})">
            ✗ No, agregalos
          </button>
        </div>
        ${state.tieneEnvases === true ? `
          <div class="envase-cantidad-wrap">
            <label>¿Cuántos tenés?</label>
            <input type="number" min="0" max="${cantTotal}" value="${state.cantidadEnvases}"
              onchange="actualizarCantidadEnvases(${item.id}, this.value, ${cantTotal}, ${precioUnitario})"
              class="envase-cantidad-input">
            <span>de ${cantTotal}</span>
          </div>
          ${state.cantidadEnvases < cantTotal
            ? `<p class="envase-costo">Faltan ${cantTotal - state.cantidadEnvases} envases: +$${(precioUnitario * (cantTotal - state.cantidadEnvases)).toLocaleString("es-AR")}</p>`
            : `<p class="envase-ok">✓ Tenés todos los envases</p>`
          }
        ` : ""}
        ${state.tieneEnvases === false
          ? `<p class="envase-costo">Se agregarán ${cantTotal} envases: +$${(precioUnitario * cantTotal).toLocaleString("es-AR")}</p>`
          : ""
        }
      </div>
    `;
  }

  itemsContainer.innerHTML = html;
  actualizarTotalConEnvases();
}

function seleccionarEnvase(idProducto, tieneEnvases, cantTotal, idEnvase, precioUnitario) {
  if (!envaseState[idProducto]) envaseState[idProducto] = {};
  envaseState[idProducto].tieneEnvases = tieneEnvases;
  envaseState[idProducto].cantidadEnvases = tieneEnvases ? cantTotal : 0;
  renderizarEnvases();
}

function actualizarCantidadEnvases(idProducto, cantidad, cantTotal, precioUnitario) {
  cantidad = Math.min(Math.max(parseInt(cantidad) || 0, 0), cantTotal);
  envaseState[idProducto].cantidadEnvases = cantidad;
  renderizarEnvases();
}

function calcularCostoEnvases() {
  if (!productosJsonData) return 0;
  const envasesMap = productosJsonData.envases || {};
  const productosMap = {};
  for (const p of productosJsonData.productos) {
    if (p.retornable) productosMap[p.id] = p;
  }

  let total = 0;
  for (const item of carritoData) {
    const prod = productosMap[item.id];
    if (!prod || !prod.retornable) continue;
    const state = envaseState[item.id];
    if (!state || state.tieneEnvases === null) continue;
    const cantTotal = prod.retornable.cantEnvases * item.cantidad;
    const envaseData = envasesMap[prod.retornable.idEnvase];
    if (!envaseData) continue;
    const precioUnitario = envaseData.precio / envaseData.unidadesBulto;
    if (state.tieneEnvases === false) {
      total += precioUnitario * cantTotal;
    } else if (state.tieneEnvases === true && state.cantidadEnvases < cantTotal) {
      total += precioUnitario * (cantTotal - state.cantidadEnvases);
    }
  }
  return total;
}

function actualizarTotalConEnvases() {
  const totalEl = document.getElementById("carrito-total");
  const total = calcularTotal() + calcularCostoEnvases();
  if (totalEl) totalEl.textContent = `$${total.toLocaleString("es-AR")}`;
}
