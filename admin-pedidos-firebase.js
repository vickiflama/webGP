import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, collection, getDocs, getDoc, doc, updateDoc, arrayUnion, writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let usuarioActual = null;

function mostrarErrorEnPanel(texto) {
    const lista = document.getElementById('admin-lista-pedidos');
    if (lista) {
        lista.innerHTML = `<p style="padding:20px;color:#cc0000;font-weight:600;">${texto}</p>`;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
        return;
    }

    // El permiso real lo da Firestore: tiene que existir el documento del usuario en "admins".
    try {
        const permiso = await getDoc(doc(db, 'admins', user.email));
        if (!permiso.exists()) {
            await signOut(auth);
            alert('Tu usuario no está habilitado como administrador.');
            window.location.href = 'admin-login.html';
            return;
        }
    } catch (error) {
        console.error('Error verificando permiso de admin:', error);
        mostrarErrorEnPanel('No se pudo verificar tu permiso. Recargá la página.');
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
        mostrarErrorEnPanel(
            error.code === 'permission-denied'
                ? 'Tu usuario no tiene permiso para ver los pedidos. Avisale a Victoria.'
                : 'No se pudieron cargar los pedidos. Probá recargar la página.'
        );
    }
});

window.cerrarSesionAdmin = function () {
    signOut(auth).then(() => window.location.href = 'admin-login.html');
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

// Anota quién abrió el detalle de un pedido (una sola vez por persona). Es interno.
window.registrarVistaPedido = function (pedido) {
    if (!usuarioActual || !pedido) return;
    const autor = usuarioActual.email;
    pedido.vistoPor = pedido.vistoPor || [];
    if (pedido.vistoPor.some(v => v.autor === autor)) return;

    const registro = { autor, fecha: new Date().toISOString() };
    pedido.vistoPor.push(registro);
    updateDoc(doc(db, 'pedidos', pedido.id), { vistoPor: arrayUnion(registro) })
        .catch(error => console.error('Error registrando que el pedido fue visto:', error));
}

// Datos del perfil del cliente (celular, DNI, localidad) para el detalle del pedido
window.obtenerDatosCliente = async function (uid) {
    try {
        const snap = await getDoc(doc(db, 'usuarios', uid));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Error leyendo datos del cliente:', error);
        return null;
    }
}

// ==================== PAPELERA ====================
// Mueve el pedido a "pedidosEliminados" (queda una copia completa) y lo borra de "pedidos".
window.moverPedidoAPapelera = async function (pedidoId) {
    try {
        const refPedido = doc(db, 'pedidos', pedidoId);
        const snap = await getDoc(refPedido);
        if (!snap.exists()) return false;

        const batch = writeBatch(db);
        batch.set(doc(db, 'pedidosEliminados', pedidoId), {
            pedidoId: pedidoId,
            pedido: snap.data(),
            eliminadoPor: usuarioActual.email,
            eliminadoEn: new Date().toISOString(),
            restaurado: false
        });
        batch.delete(refPedido);
        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error moviendo pedido a la papelera:', error);
        return false;
    }
}

// Devuelve la lista de pedidos en la papelera (los más recientes primero) o null si falla
window.cargarPapelera = async function () {
    try {
        const snapshot = await getDocs(collection(db, 'pedidosEliminados'));
        const lista = [];
        snapshot.forEach(d => {
            const data = d.data();
            if (!data.restaurado) lista.push({ id: d.id, ...data });
        });
        lista.sort((a, b) => new Date(b.eliminadoEn) - new Date(a.eliminadoEn));
        return lista;
    } catch (error) {
        console.error('Error cargando la papelera:', error);
        return null;
    }
}

// Vuelve a crear el pedido con su mismo ID y número. La copia en la papelera se marca como restaurada (no se borra).
window.restaurarPedidoDePapelera = async function (papeleraId) {
    try {
        const refPapelera = doc(db, 'pedidosEliminados', papeleraId);
        const snap = await getDoc(refPapelera);
        if (!snap.exists()) return null;
        const item = snap.data();
        const pedidoId = item.pedidoId || papeleraId;

        const batch = writeBatch(db);
        batch.set(doc(db, 'pedidos', pedidoId), item.pedido);
        batch.update(refPapelera, {
            restaurado: true,
            restauradoPor: usuarioActual.email,
            restauradoEn: new Date().toISOString()
        });
        await batch.commit();
        return { id: pedidoId, ...item.pedido };
    } catch (error) {
        console.error('Error restaurando pedido:', error);
        return null;
    }
}
