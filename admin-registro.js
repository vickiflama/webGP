import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
    const errorEl = document.getElementById('reg-error');
    errorEl.textContent = texto;
    errorEl.style.display = 'block';
}

document.getElementById('form-registro-admin').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('reg-error').style.display = 'none';

    const usuario = document.getElementById('reg-usuario').value.trim().toLowerCase();
    const pass1 = document.getElementById('reg-password').value;
    const pass2 = document.getElementById('reg-password2').value;

    if (!usuario) {
        mostrarError('Escribí tu usuario.');
        return;
    }
    if (pass1 !== pass2) {
        mostrarError('Las contraseñas no coinciden.');
        return;
    }

    window.mostrarLoading?.('Creando cuenta...');
    const email = usuarioAEmail(usuario);
    let cred;

    // 1) Crea la cuenta
    try {
        cred = await createUserWithEmailAndPassword(auth, email, pass1);
    } catch (error) {
        window.ocultarLoading?.();
        if (error.code === 'auth/email-already-in-use') {
            mostrarError('Ese usuario ya tiene una cuenta creada. Andá a iniciar sesión.');
        } else if (error.code === 'auth/weak-password') {
            mostrarError('La contraseña es muy corta (mínimo 6 caracteres).');
        } else {
            mostrarError('Error al crear la cuenta: ' + error.message);
        }
        return;
    }

    // 2) Registra el permiso de admin. Firestore solo lo permite si Victoria
    //    habilitó antes ese correo en la colección "adminsPermitidos".
    try {
        await setDoc(doc(db, 'admins', email), {
            usuario: usuario,
            email: email,
            creado: new Date().toISOString()
        });
        window.location.href = 'admin-pedidos.html';
    } catch (error) {
        // Sin habilitación: se borra la cuenta recién creada para que,
        // cuando la habiliten, pueda volver a registrarse sin problemas.
        try { await deleteUser(cred.user); } catch (e2) { console.error(e2); }
        window.ocultarLoading?.();
        mostrarError('Tu usuario todavía no fue habilitado. Pedile a Victoria que lo habilite y volvé a intentar.');
    }
});
