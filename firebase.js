// ==================== FIREBASE CONFIG ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAlVuVENd77eqQO-EjrvPQ-ppXISZ0qZYA",
    authDomain: "gran-prix-mayorista.firebaseapp.com",
    projectId: "gran-prix-mayorista",
    storageBucket: "gran-prix-mayorista.firebasestorage.app",
    messagingSenderId: "969104780476",
    appId: "1:969104780476:web:1d4e79065815a4181474b9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ==================== REGISTRO ====================
async function registrarUsuario() {
    if (!validarFormulario()) return;

    const nombre = document.querySelector('input[placeholder="Nombre*"]').value;
    const apellido = document.querySelector('input[placeholder="Apellido*"]').value;
    const email = document.querySelector('input[placeholder="Correo electrónico*"]').value;
    const password = document.querySelector('input[placeholder="Contraseña*"]').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: `${nombre} ${apellido}`
        });

        // Guarda el nombre en localStorage
        localStorage.setItem('usuarioNombre', `${nombre} ${apellido}`);

        // Muestra modal de éxito
        document.getElementById('exito-email').textContent = email;
        cerrarModal('modal-registro');
        abrirModal('modal-exito');

    } catch (error) {
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

    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailVal, passwordVal);
        const nombre = userCredential.user.displayName;
        localStorage.setItem('usuarioNombre', nombre);
        window.location.replace('index.html');
    } catch (error) {
        errorBanner.style.display = 'block';
        emailField.classList.add('input-error');
        passwordField.classList.add('input-error');
    }
}

// ==================== CERRAR SESIÓN ====================
async function cerrarSesion() {
    await signOut(auth);
    localStorage.removeItem('usuarioNombre');
    window.location.replace = 'index.html';
}

// ==================== NAVBAR - MOSTRAR NOMBRE ====================
function actualizarNavbar() {
    const nombre = localStorage.getItem('usuarioNombre');
    const btnLogin = document.querySelector('.btn-login');
    if (btnLogin && nombre) {
        btnLogin.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${nombre.split(' ')[0]}`;
        btnLogin.onclick = cerrarSesion;
    }
}

// Llama al cargar cualquier página
actualizarNavbar();

window.registrarUsuario = registrarUsuario;
window.loginUsuario = loginUsuario;
window.cerrarSesion = cerrarSesion;