import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAlVuVENd77eqQO-EjrvPQ-ppXISZ0qZYA",
    authDomain: "gran-prix-mayorista.firebaseapp.com",
    projectId: "gran-prix-mayorista",
    storageBucket: "gran-prix-mayorista.firebasestorage.app",
    messagingSenderId: "969104780476",
    appId: "1:969104780476:web:1d4e79065815a4181474b9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function suscribirse() {
  const nombre = document.getElementById("sus-nombre").value.trim();
  const apellido = document.getElementById("sus-apellido").value.trim();
  const dni = document.getElementById("sus-dni").value.trim();
  const celular = document.getElementById("sus-celular").value.trim();
  const email = document.getElementById("sus-email").value.trim();
  const cumple = document.getElementById("sus-cumple").value.trim();

  const alerta = document.getElementById("alerta-suscripcion");
  const texto = document.getElementById("alerta-suscripcion-texto");
  alerta.classList.remove("activo");
  alerta.style.background = "";

  if (!nombre || !apellido || !dni || !celular || !email) {
    texto.textContent = "Por favor completá todos los campos obligatorios.";
    alerta.classList.add("activo");
    setTimeout(() => alerta.classList.remove("activo"), 4000);
    return;
  }

  try {
    await addDoc(collection(db, "suscriptores"), {
      nombre, apellido, dni, celular, email,
      cumple: cumple || null,
      fechaAlta: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error guardando suscripción:", err);
    texto.textContent = "Hubo un error al suscribirte. Probá de nuevo.";
    alerta.classList.add("activo");
    setTimeout(() => alerta.classList.remove("activo"), 4000);
    return;
  }

  document.getElementById("sus-nombre").value = "";
  document.getElementById("sus-apellido").value = "";
  document.getElementById("sus-dni").value = "";
  document.getElementById("sus-celular").value = "";
  document.getElementById("sus-email").value = "";
  document.getElementById("sus-cumple").value = "";

  texto.textContent = "✅ ¡Te suscribiste correctamente! Pronto recibirás nuestras ofertas.";
  alerta.style.background = "#3DB549";
  alerta.classList.add("activo");
  setTimeout(() => {
    alerta.classList.remove("activo");
    alerta.style.background = "";
  }, 4000);
}

window.suscribirse = suscribirse;