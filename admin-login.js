import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
const db = getFirestore(app);

function mostrarError(texto) {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = texto;
    errorEl.style.display = 'block';
}

document.getElementById('form-login-admin').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('login-error').style.display = 'none';

    const usuario = document.getElementById('login-usuario').value.trim().toLowerCase();
    const pass = document.getElementById('login-password').value;
    const email = usuarioAEmail(usuario);

    window.mostrarLoading?.('Ingresando...');

    // 1) Usuario y contraseña
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        window.ocultarLoading?.();
        mostrarError('Usuario o contraseña incorrectos.');
        return;
    }

    // 2) Que esté habilitado como administrador
    try {
        const permiso = await getDoc(doc(db, 'admins', email));
        if (!permiso.exists()) {
            await signOut(auth);
            window.ocultarLoading?.();
            mostrarError('Tu usuario todavía no está habilitado como administrador. Avisale a Victoria.');
            return;
        }
    } catch (error) {
        await signOut(auth);
        window.ocultarLoading?.();
        mostrarError('No se pudo verificar tu permiso. Probá de nuevo en unos minutos.');
        return;
    }

    window.location.href = 'admin-pedidos.html';
});
