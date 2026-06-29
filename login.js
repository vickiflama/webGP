function validarLogin() {
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const errorBanner = document.getElementById('login-error');
    let valido = true;

    // Limpia errores anteriores
    email.classList.remove('input-error');
    password.classList.remove('input-error');
    errorBanner.style.display = 'none';

    if (email.value.trim() === '') valido = false;
    if (password.value.trim() === '') valido = false;

    if (!valido) {
        if (email.value.trim() === '') email.classList.add('input-error');
        if (password.value.trim() === '') password.classList.add('input-error');
        errorBanner.style.display = 'block';
    } else {
        console.log('Login válido, ingresando...');
    }
}

async function enviarRecuperar() {
    const email = document.getElementById('recuperar-email');
    email.classList.remove('input-error');

    if (email.value.trim() === '') {
        email.classList.add('input-error');
        return;
    }

    try {
        window.mostrarLoading('Enviando...');
        const { getAuth, sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email.value.trim());
        window.ocultarLoading();
        window.location.href = 'mailconfirmado.html';
    } catch (error) {
        window.ocultarLoading();
        console.error(error);
        email.classList.add('input-error');
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (window.loginUsuario) {
            window.loginUsuario();
        }
    }
});

window.addEventListener('load', function() {
    if (!window.loginUsuario) {
        window.loginUsuario = function() {
            console.error('Firebase no cargó todavía');
        };
    }
});