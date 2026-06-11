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