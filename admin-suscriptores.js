import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let todos = [];
let visibles = [];

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function normalizar(t) {
    return String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function fmtFecha(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('es-AR');
}

function mostrarMensaje(texto) {
    document.getElementById('sus-lista').innerHTML =
        `<p style="padding:20px;color:#cc0000;font-weight:600;">${esc(texto)}</p>`;
}

function render() {
    const texto = normalizar(document.getElementById('filtro-texto').value.trim());
    visibles = todos.filter(s => !texto ||
        normalizar([s.nombre, s.apellido, s.email, s.celular, s.dni].join(' ')).includes(texto));

    document.getElementById('admin-contador').textContent =
        `Mostrando ${visibles.length} de ${todos.length} suscriptores`;

    const lista = document.getElementById('sus-lista');
    if (visibles.length === 0) {
        lista.innerHTML = '<p>No hay suscriptores que coincidan.</p>';
        return;
    }
    lista.innerHTML = visibles.map(s => `
        <div class="sus-fila">
            <div class="sus-nombre">${esc(s.nombre)} ${esc(s.apellido)}</div>
            <span><i class="fa-solid fa-mobile-screen"></i> ${esc(s.celular || '-')}</span>
            <span><i class="fa-solid fa-envelope"></i> ${esc(s.email || '-')}</span>
            <span>DNI/CUIT: ${esc(s.dni || '-')}</span>
            <span>Cumple: ${esc(fmtFecha(s.cumple) || s.cumple || '-')}</span>
            <span>Alta: ${esc(fmtFecha(s.fechaAlta) || '-')}</span>
        </div>
    `).join('');
}

// Excel en español abre bien un CSV con ";" y codificación UTF-8 con BOM
function celdaCsv(v) {
    let t = String(v ?? '');
    if (/^[=+\-@]/.test(t)) t = "'" + t; // evita que Excel lo tome como fórmula
    return '"' + t.replace(/"/g, '""') + '"';
}

function descargarExcel() {
    const cols = ['Nombre', 'Apellido', 'Celular', 'Correo', 'DNI/CUIT', 'Cumpleaños', 'Fecha de alta'];
    const filas = visibles.map(s => [
        s.nombre, s.apellido, s.celular, s.email, s.dni, s.cumple, fmtFecha(s.fechaAlta)
    ].map(celdaCsv).join(';'));
    const csv = '﻿' + [cols.map(celdaCsv).join(';'), ...filas].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'suscriptores-granprix.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}

document.getElementById('filtro-texto').addEventListener('input', render);
document.getElementById('btn-excel').addEventListener('click', descargarExcel);
document.getElementById('btn-salir').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => window.location.href = 'admin-login.html');
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
        return;
    }
    try {
        const permiso = await getDoc(doc(db, 'admins', user.email));
        if (!permiso.exists()) {
            await signOut(auth);
            window.location.href = 'admin-login.html';
            return;
        }
    } catch (e) {
        mostrarMensaje('No se pudo verificar tu permiso. Recargá la página.');
        return;
    }

    document.getElementById('admin-usuario-mail').textContent = user.email.split('@')[0];

    try {
        const snap = await getDocs(collection(db, 'suscriptores'));
        todos = [];
        snap.forEach(d => todos.push({ id: d.id, ...d.data() }));
        todos.sort((a, b) => new Date(b.fechaAlta) - new Date(a.fechaAlta));
        render();
    } catch (error) {
        console.error('Error cargando suscriptores:', error);
        mostrarMensaje(error.code === 'permission-denied'
            ? 'Tu usuario no tiene permiso para ver los suscriptores. Avisale a Victoria.'
            : 'No se pudieron cargar los suscriptores. Probá recargar la página.');
    }
});
