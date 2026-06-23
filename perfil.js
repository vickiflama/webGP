import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlVuVENd77eqQO-EjrvPQ-ppXISZ0qZYA",
  authDomain: "gran-prix-mayorista.firebaseapp.com",
  projectId: "gran-prix-mayorista",
  storageBucket: "gran-prix-mayorista.firebasestorage.app",
  messagingSenderId: "969104780476",
  appId: "1:969104780476:web:1d4e79065815a4181474b9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let datosOriginales = {};
let direccionOriginal = {};
let nombreOriginal = "";
let apellidoOriginal = "";

// Carga los datos del usuario
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const nombreCompleto = user.displayName || "";
  const partes = nombreCompleto.split(" ");
  nombreOriginal = partes[0] || "";
  apellidoOriginal = partes.slice(1).join(" ") || "";

  document.getElementById("perfil-nombre").value = nombreOriginal;
  document.getElementById("perfil-apellido").value = apellidoOriginal;
  document.getElementById("perfil-email").value = user.email || "";

  const docRef = doc(db, "usuarios", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("perfil-celular").value = data.celular || "";
    document.getElementById("perfil-dni").value = data.dni || "";
    document.getElementById("perfil-fecha").value = data.fechaNacimiento || "";
    document.getElementById("perfil-provincia").value = data.provincia || "";
    document.getElementById("perfil-localidad").value = data.localidad || "";

    document.getElementById("dir-calle").value = data.calle || "";
    document.getElementById("dir-numero").value = data.numero || "";
    document.getElementById("dir-piso").value = data.piso || "";
    document.getElementById("dir-depto").value = data.depto || "";
    document.getElementById("dir-provincia").value = data.dirProvincia || "";
    document.getElementById("dir-localidad").value = data.dirLocalidad || "";
    document.getElementById("dir-cp").value = data.codigoPostal || "";
    document.getElementById("dir-referencias").value = data.referencias || "";
  }

  datosOriginales = { ...getDatos() };
  direccionOriginal = { ...getDireccion() };
});

function getDatos() {
  return {
    celular: document.getElementById("perfil-celular").value,
    dni: document.getElementById("perfil-dni").value,
    fechaNacimiento: document.getElementById("perfil-fecha").value,
    provincia: document.getElementById("perfil-provincia").value,
    localidad: document.getElementById("perfil-localidad").value,
  };
}

function getDireccion() {
  return {
    calle: document.getElementById("dir-calle").value,
    numero: document.getElementById("dir-numero").value,
    piso: document.getElementById("dir-piso").value,
    depto: document.getElementById("dir-depto").value,
    dirProvincia: document.getElementById("dir-provincia").value,
    dirLocalidad: document.getElementById("dir-localidad").value,
    codigoPostal: document.getElementById("dir-cp").value,
    referencias: document.getElementById("dir-referencias").value,
  };
}

function editarSeccion(seccion) {
  const campos =
    seccion === "datos"
      ? [
          "perfil-nombre",
          "perfil-apellido",
          "perfil-celular",
          "perfil-dni",
          "perfil-fecha",
          "perfil-provincia",
          "perfil-localidad",
        ]
      : [
          "dir-calle",
          "dir-numero",
          "dir-piso",
          "dir-depto",
          "dir-provincia",
          "dir-localidad",
          "dir-cp",
          "dir-referencias",
        ];

  campos.forEach((id) => {
    document.getElementById(id).disabled = false;
  });

  document.getElementById(`botones-${seccion}`).style.display = "flex";
  document.getElementById(`btn-editar-${seccion}`).style.display = "none";
}

function cancelarEdicion(seccion) {
  if (seccion === "datos") {
    document.getElementById("perfil-nombre").value = nombreOriginal;
    document.getElementById("perfil-apellido").value = apellidoOriginal;
    document.getElementById("perfil-celular").value =
      datosOriginales.celular || "";
    document.getElementById("perfil-dni").value = datosOriginales.dni || "";
    document.getElementById("perfil-fecha").value =
      datosOriginales.fechaNacimiento || "";
    document.getElementById("perfil-provincia").value =
      datosOriginales.provincia || "";
    document.getElementById("perfil-localidad").value =
      datosOriginales.localidad || "";

    [
      "perfil-nombre",
      "perfil-apellido",
      "perfil-celular",
      "perfil-dni",
      "perfil-fecha",
      "perfil-provincia",
      "perfil-localidad",
    ].forEach((id) => {
      document.getElementById(id).disabled = true;
    });
  } else {
    document.getElementById("dir-calle").value = direccionOriginal.calle || "";
    document.getElementById("dir-numero").value =
      direccionOriginal.numero || "";
    document.getElementById("dir-piso").value = direccionOriginal.piso || "";
    document.getElementById("dir-depto").value = direccionOriginal.depto || "";
    document.getElementById("dir-provincia").value =
      direccionOriginal.dirProvincia || "";
    document.getElementById("dir-localidad").value =
      direccionOriginal.dirLocalidad || "";
    document.getElementById("dir-cp").value =
      direccionOriginal.codigoPostal || "";
    document.getElementById("dir-referencias").value =
      direccionOriginal.referencias || "";

    [
      "dir-calle",
      "dir-numero",
      "dir-piso",
      "dir-depto",
      "dir-provincia",
      "dir-localidad",
      "dir-cp",
      "dir-referencias",
    ].forEach((id) => {
      document.getElementById(id).disabled = true;
    });
  }

  document.getElementById(`botones-${seccion}`).style.display = "none";
  document.getElementById(`btn-editar-${seccion}`).style.display = "flex";
}

async function guardarDatos() {
  const user = auth.currentUser;
  if (!user) return;

  const nombre = document.getElementById("perfil-nombre").value.trim();
  const apellido = document.getElementById("perfil-apellido").value.trim();

  window.mostrarLoading("Guardando...");
  try {
    // Actualiza nombre en Firebase Auth
    await updateProfile(user, {
      displayName: `${nombre} ${apellido}`,
    });

    // Actualiza localStorage y navbar
    localStorage.setItem("usuarioNombre", `${nombre} ${apellido}`);
    const nombreSpan = document.getElementById("nombre-usuario");
    if (nombreSpan) nombreSpan.textContent = nombre;

    // Guarda en Firestore
    const docRef = doc(db, "usuarios", user.uid);
    await setDoc(docRef, getDatos(), { merge: true });

    nombreOriginal = nombre;
    apellidoOriginal = apellido;
    datosOriginales = { ...getDatos() };

    cancelarEdicion("datos");
    window.ocultarLoading();
    mostrarAlertaPerfil(
      "alerta-datos",
      "✅ Datos guardados correctamente",
      true,
    );
  } catch (error) {
    window.ocultarLoading();
    mostrarAlertaPerfil("alerta-datos", "Error al guardar: " + error.message);
  }
}

async function guardarDireccion() {
  const user = auth.currentUser;
  if (!user) return;

  window.mostrarLoading("Guardando...");
  try {
    const docRef = doc(db, "usuarios", user.uid);
    await setDoc(docRef, getDireccion(), { merge: true });
    direccionOriginal = { ...getDireccion() };
    cancelarEdicion("direccion");
    window.ocultarLoading();
    mostrarAlertaPerfil(
      "alerta-direccion",
      "✅ Dirección guardada correctamente",
      true,
    );
  } catch (error) {
    window.ocultarLoading();
    mostrarAlertaPerfil(
      "alerta-direccion",
      "Error al guardar: " + error.message,
    );
  }
}

function mostrarAlertaPerfil(id, mensaje, exito = false) {
  const alerta = document.getElementById(id);
  const texto = document.getElementById(`${id}-texto`);
  if (!alerta || !texto) return;
  texto.textContent = mensaje;
  alerta.style.background = exito ? "#3DB549" : "#cc0000";
  alerta.classList.add("activo");
  setTimeout(() => {
    alerta.classList.remove("activo");
    alerta.style.background = "";
  }, 4000);
}

window.editarSeccion = editarSeccion;
window.cancelarEdicion = cancelarEdicion;
window.guardarDatos = guardarDatos;
window.guardarDireccion = guardarDireccion;
