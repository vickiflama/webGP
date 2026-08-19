import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc, arrayUnion, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ADMIN_USUARIOS, usuarioAEmail } from "./admin-config.js";



const firebaseConfig = {
    apiKey: "AIzaSyAlVuVENd77eqQO-EjrvPQ-ppXISZ0qZYA",
    authDomain: "gran-prix-mayorista.firebaseapp.com",
    projectId: "gran-prix-mayorista",
    storageBucket: "gran-prix-mayorista.firebasestorage.app",
    messagingSenderId: "969104780476",
    appId: "1:969104780476:web:1d4e79065815a4181474b9"
};

// Agregá acá los usuarios del equipo autorizado para entrar al panel
const ADMIN_EMAILS = ADMIN_USUARIOS.map(usuarioAEmail);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioActual = null;

onAuthStateChanged(auth, async (user) => {
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
       window.location.href = 'admin-login.html';
        return;
    }

    usuarioActual = user;
    document.getElementById('admin-usuario-mail').textContent = user.email.split('@')[0];

    window.mostrarLoading('Cargando pedidos...');
    try {
        const snapshot = await getDocs(collection(db, 'pedidos'));
        const pedidos = [];
        snapshot.forEach(d => pedidos.push({ id: d.id, ...d.data() }));

        pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        window.ocultarLoading();
        window.todosPedidosAdmin = pedidos;
        window.renderizarPedidosAdmin(pedidos);
    } catch (error) {
        window.ocultarLoading();
        console.error('Error cargando pedidos:', error);
    }
});

window.cerrarSesionAdmin = function () {
    signOut(auth).then(() => window.location.href = 'login.html');
}

// Actualiza el estado de un pedido y deja registro de quién lo hizo
window.actualizarEstadoPedido = async function (pedidoId, nuevoEstado) {
    try {
        const ref = doc(db, 'pedidos', pedidoId);
        await updateDoc(ref, {
            estado: nuevoEstado,
            historialEstados: arrayUnion({
                estado: nuevoEstado,
                fecha: new Date().toISOString(),
                autor: usuarioActual.email
            })
        });
        return true;
    } catch (error) {
        console.error('Error actualizando estado:', error);
        return false;
    }
}

// Busca los datos de perfil de un cliente (colección usuarios) por su uid.
// Se usa solo al abrir el detalle de un pedido puntual, no en toda la lista.
window.obtenerDatosCliente = async function (uid) {
    if (!uid) return null;
    try {
        const snap = await getDoc(doc(db, 'usuarios', uid));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Error buscando datos del cliente:', error);
        return null;
    }
}