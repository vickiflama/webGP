// ==================== FIREBASE CONFIG ====================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        mostrarErrorLogin(errorBanner, null, false);
        return;
    }

    mostrarLoading('Ingresando...');
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailVal, passwordVal);

        if (!userCredential.user.emailVerified) {
            await signOut(auth);
            ocultarLoading();
            mostrarErrorLogin(errorBanner,
                'Debés verificar tu email antes de ingresar. Revisá tu casilla de correo (y la carpeta de spam). Si el enlace venció, pedí uno nuevo:',
                true);
            return;
        }

        const nombre = userCredential.user.displayName;
        localStorage.setItem('usuarioNombre', nombre);
        window.location.href = 'index.html';
    } catch (error) {
        ocultarLoading();
        mostrarErrorLogin(errorBanner, null, false);
        emailField.classList.add('input-error');
        passwordField.classList.add('input-error');
    }
}

// Muestra el cartel rojo del login. Si texto es null, deja el mensaje original.
// Con conBoton = true agrega el botón "Reenviar correo de verificación".
const MENSAJE_LOGIN_ORIGINAL = 'Tu correo electrónico o contraseña fueron ingresados incorrectamente. Inténtalo nuevamente';

function mostrarErrorLogin(errorBanner, texto, conBoton) {
    const p = errorBanner.querySelector('p');
    if (p) p.textContent = texto || MENSAJE_LOGIN_ORIGINAL;

    const viejo = document.getElementById('btn-reenviar-verificacion');
    if (viejo) viejo.remove();

    if (conBoton) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'btn-reenviar-verificacion';
        btn.className = 'btn-registrar';
        btn.style.marginTop = '10px';
        btn.textContent = 'Reenviar correo de verificación';
        btn.onclick = reenviarVerificacion;
        errorBanner.appendChild(btn);
    }
    errorBanner.style.display = 'block';
}

// ==================== REENVIAR VERIFICACIÓN ====================
// Vuelve a entrar con los datos escritos, pide a Firebase un correo nuevo y cierra la sesión.
async function reenviarVerificacion() {
    const emailVal = document.getElementById('login-email').value.trim();
    const passwordVal = document.getElementById('login-password').value.trim();
    const errorBanner = document.getElementById('login-error');

    if (!emailVal || !passwordVal) {
        mostrarErrorLogin(errorBanner, 'Escribí tu correo y contraseña y volvé a apretar el botón.', true);
        return;
    }

    mostrarLoading('Enviando correo...');
    try {
        const cred = await signInWithEmailAndPassword(auth, emailVal, passwordVal);
        if (cred.user.emailVerified) {
            await signOut(auth);
            ocultarLoading();
            mostrarErrorLogin(errorBanner, 'Tu correo ya está verificado. Apretá ACCESO para ingresar.', false);
            return;
        }
        await sendEmailVerification(cred.user, {
            url: 'https://vickiflama.github.io/webGP/mailconfirmado.html'
        });
        await signOut(auth);
        ocultarLoading();
        mostrarErrorLogin(errorBanner, 'Listo, te enviamos un correo nuevo a ' + emailVal + '. Abrí el enlace y después ingresá.', false);
    } catch (error) {
        ocultarLoading();
        console.error('Error reenviando verificación:', error);
        if (error.code === 'auth/too-many-requests') {
            mostrarErrorLogin(errorBanner, 'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.', true);
        } else {
            mostrarErrorLogin(errorBanner, 'No pudimos enviar el correo. Revisá que tu correo y contraseña estén bien escritos.', true);
        }
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

        // Genera el número de pedido con un contador guardado en Firestore (contadores/pedidos).
        // Si el contador no está disponible, usa un sufijo al azar para no perder el pedido.
        let numero;
        try {
            const contadorRef = doc(db, 'contadores', 'pedidos');
            numero = await runTransaction(db, async (tx) => {
                const snap = await tx.get(contadorRef);
                const siguiente = (snap.exists() ? Number(snap.data().valor) || 0 : 0) + 1;
                tx.update(contadorRef, { valor: siguiente });
                return siguiente;
            });
        } catch (errorContador) {
            console.error('No se pudo usar el contador de pedidos:', errorContador);
            numero = Math.floor(1000 + Math.random() * 9000);
        }
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