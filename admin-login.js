import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { usuarioAEmail } from "./admin-config.js";

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

document.getElementById('form-login-admin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    const usuario = document.getElementById('login-usuario').value.trim().toLowerCase();
    const pass = document.getElementById('login-password').value;

    window.mostrarLoading?.('Ingresando...');
    try {
        await signInWithEmailAndPassword(auth, usuarioAEmail(usuario), pass);
        window.location.href = 'admin-pedidos.html';
    } catch (error) {
        window.ocultarLoading?.();
        errorEl.textContent = 'Usuario o contraseña incorrectos.';
        errorEl.style.display = 'block';
    }
});