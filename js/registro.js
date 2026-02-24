// Registro de estudiantes - Versión segura

document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarEstadisticas();
    
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', registrarEstudiante);
    }
    
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
});

function verificarSesion() {
    fetch('/api/me')
        .then(response => {
            if (response.status === 401) {
                window.location.href = '/login.html';
            }
        });
}

function cargarEstadisticas() {
    const statsDiv = document.getElementById('estadisticas');
    if (!statsDiv) return;
    
    fetch('/api/estudiantes')
        .then(response => response.json())
        .then(estudiantes => {
            statsDiv.innerHTML = `
                <p>Total: ${estudiantes.length} estudiantes</p>
            `;
        })
        .catch(() => {
            statsDiv.innerHTML = '<p>Error al cargar</p>';
        });
}

function registrarEstudiante(event) {
    event.preventDefault();
    
    // SOLO campos necesarios, nada sensible
    const formData = {
        nombre: document.getElementById('nombre')?.value || '',
        email: document.getElementById('email')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        fechaNacimiento: document.getElementById('fechaNacimiento')?.value || ''
        // NO incluimos password, seguroSocial, etc.
    };
    
    fetch('/api/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/login.html';
            throw new Error('No autenticado');
        }
        return response.json();
    })
    .then(data => {
        alert('Estudiante registrado');
        document.getElementById('formRegistro').reset();
        setTimeout(() => {
            window.location.href = 'estudiantes.html';
        }, 1000);
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/login.html';
        });
}