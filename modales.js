// Carga los modales en cualquier página automáticamente
fetch('modales.html')
    .then(res => res.text())
    .then(html => {
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
    });