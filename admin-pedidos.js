import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ADMIN_USUARIOS, usuarioAEmail } from "./admin-config.js";

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

document.getElementById('form-registro-admin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('reg-error');
    errorEl.style.display = 'none';

    const usuario = document.getElementById('reg-usuario').value.trim().toLowerCase();
    const pass1 = document.getElementById('reg-password').value;
    const pass2 = document.getElementById('reg-password2').value;

    if (!ADMIN_USUARIOS.includes(usuario)) {
        errorEl.textContent = 'Ese usuario no está autorizado. Pedile a Victoria que lo agregue primero.';
        errorEl.style.display = 'block';
        return;
    }
    if (pass1 !== pass2) {
        errorEl.textContent = 'Las contraseñas no coinciden.';
        errorEl.style.display = 'block';
        return;
    }

    window.mostrarLoading?.('Creando cuenta...');
    try {
        const email = usuarioAEmail(usuario);
        const cred = await createUserWithEmailAndPassword(auth, email, pass1);

        // Registra automáticamente el permiso de admin en Firestore,
        // así las reglas de seguridad no necesitan editarse a mano.
        await setDoc(doc(db, 'admins', email), {
            usuario: usuario,
            email: email,
            creado: new Date().toISOString()
        });

        window.location.href = 'admin-pedidos.html';
    } catch (error) {
        window.ocultarLoading?.();
        if (error.code === 'auth/email-already-in-use') {
            errorEl.textContent = 'Ese usuario ya tiene una cuenta creada. Andá a iniciar sesión.';
        } else {
            errorEl.textContent = 'Error al crear la cuenta: ' + error.message;
        }
        errorEl.style.display = 'block';
    }
});