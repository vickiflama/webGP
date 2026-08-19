// ==================== FIREBASE CONFIG ====================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAlVuVENd77eqQO-EjrvPQ-ppXISZ0qZYA",
    authDomain: "gran-prix-mayorista.firebaseapp.com",
    projectId: "gran-prix-mayorista",
    storageBucket: "gran-prix-mayorista.firebasestorage.app",
    messagingSenderId: "969104780476",
    appId: "1:969104780476:web:1d4e79065815a4181474b9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== LOADING ====================
function mostrarLoading(texto = 'Cargando...') {
    const overlay = document.getElementById('loading');
    if (!overlay) return;
    const textoEl = overlay.querySelector('.loading-texto');
    if (textoEl) textoEl.textContent = texto;
    overlay.classList.add('activo');
}

function ocultarLoading() {
    const overlay = document.getElementById('loading');
    if (overlay) overlay.classList.remove('activo');
}

// ==================== REGISTRO ====================
async function registrarUsuario() {
    if (!window.validarFormulario()) return;

    const modal = document.getElementById('modal-registro');
    const nombre = modal.querySelector('input[placeholder="Nombre*"]').value;
    const apellido = modal.querySelector('input[placeholder="Apellido*"]').value;
    const email = document.getElementById('registro-email').value;
    const password = modal.querySelector('input[placeholder="Contraseña*"]').value;
    const celular = modal.querySelector('input[placeholder="Celular*"]').value;
    const dni = modal.querySelector('input[placeholder="DNI o CUIT*"]').value;
    const fecha = modal.querySelector('input[type="date"]').value;
    const provincia = modal.querySelector('#select-provincia').value;
    const localidad = modal.querySelector('#select-localidad').value;

    mostrarLoading('Creando tu cuenta...');
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: `${nombre} ${apellido}`
        });

        const { sendEmailVerification } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        await sendEmailVerification(userCredential.user, {
  url: 'https://vickiflama.github.io/webGP/mailconfirmado.html'
});

        await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
            celular, dni, fechaNacimiento: fecha, provincia, localidad
        });

        ocultarLoading();
document.getElementById('exito-email').textContent = email;
window.cerrarModal('modal-registro');
window.abrirModal('modal-exito');

    } catch (error) {
        ocultarLoading();
        console.error('Error al registrar:', error);
        alert('Error al registrar: ' + error.message);
    }
}

// ==================== LOGIN ====================
async function loginUsuario() {
    const emailField = document.getElementById('login-email');
    const passwordField = document.getElementById('login-password');
    const errorBanner = document.getElementById('login-error');

    emailField.classList.remove('input-error');
    passwordField.classList.remove('input-error');
    errorBanner.style.display = 'none';

    const emailVal = emailField.value.trim();
    const passwordVal = passwordField.value.trim();

    if (emailVal === '' || passwordVal === '') {
        if (emailVal === '') emailField.classList.add('input-error');
        if (passwordVal === '') passwordField.classList.add('input-error');
        errorBanner.style.display = 'block';
        return;
    }

    mostrarLoading('Ingresando...');
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailVal, passwordVal);

        if (!userCredential.user.emailVerified) {
            await signOut(auth);
            ocultarLoading();
            errorBanner.textContent = 'Debés verificar tu email antes de ingresar. Revisá tu casilla de correo.';
            errorBanner.style.display = 'block';
            return;
        }

        const nombre = userCredential.user.displayName;
        localStorage.setItem('usuarioNombre', nombre);
        window.location.href = 'index.html';
    } catch (error) {
        ocultarLoading();
        errorBanner.style.display = 'block';
        emailField.classList.add('input-error');
        passwordField.classList.add('input-error');
    }
}

// ==================== CERRAR SESIÓN ====================
async function cerrarSesion() {
    await signOut(auth);
    localStorage.removeItem('usuarioNombre');
    window.location.href = 'index.html';
}

// ==================== NAVBAR ====================
function actualizarNavbar() {
    const nombre = localStorage.getItem('usuarioNombre');
    const nombreSpan = document.getElementById('nombre-usuario');
    if (nombreSpan && nombre) {
        nombreSpan.textContent = nombre.split(' ')[0];
    }
}

actualizarNavbar();

// ==================== MENU DESPLEGABLE ====================
function toggleMenu() {
    const nombre = localStorage.getItem('usuarioNombre');
    if (!nombre) {
        const modal = document.getElementById('modal-registro');
        if (modal) {
            window.abrirModal('modal-registro');
        } else {
            window.location.href = 'login.html';
        }
        return;
    }
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('activo');
}

document.addEventListener('click', function(e) {
    const wrap = document.querySelector('.user-menu-wrap');
    if (wrap && !wrap.contains(e.target)) {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.remove('activo');
    }
});

// ==================== GUARDAR PEDIDO ====================
async function guardarPedido(pedido) {
    try {
        const user = auth.currentUser;

        // Genera el número de pedido
        const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const snapshot = await getDocs(collection(db, 'pedidos'));
        const numero = snapshot.size + 1;
        const fecha = new Date();
        const fechaStr = fecha.getFullYear().toString() +
            String(fecha.getMonth() + 1).padStart(2, '0') +
            String(fecha.getDate()).padStart(2, '0');
        const nroPedido = `GP-${fechaStr}-${String(numero).padStart(4, '0')}`;

        pedido.nroPedido = nroPedido;

        if (user) {
            await addDoc(collection(db, 'pedidos'), {
                ...pedido,
                uid: user.uid,
                usuario: user.displayName,
            });
        }

        // Guarda el número en localStorage para mostrarlo en la confirmación
        localStorage.setItem('ultimoPedidoNro', nroPedido);

    } catch (error) {
        console.error('Error guardando pedido:', error);
    }
}

// ==================== GUARDAR ARREPENTIMIENTO ====================
async function guardarArrepentimiento(datos) {
    try {
        const user = auth.currentUser;
        await addDoc(collection(db, 'arrepentimientos'), {
            ...datos,
            uid: user ? user.uid : null,
            fechaSolicitud: new Date().toISOString(),
            estado: 'Pendiente'
        });
        return true;
    } catch (error) {
        console.error('Error guardando arrepentimiento:', error);
        return false;
    }
}

// ==================== EXPONER GLOBALMENTE ====================
window.registrarUsuario = registrarUsuario;
window.loginUsuario = loginUsuario;
window.cerrarSesion = cerrarSesion;
window.toggleMenu = toggleMenu;
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;
window.guardarPedido = guardarPedido;
window.guardarArrepentimiento = guardarArrepentimiento;