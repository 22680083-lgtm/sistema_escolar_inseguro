// js/registro.js
if (!window.CONFIG) {
    console.error('❌ No se encontró config.js. Asegúrate de incluirlo.');
}
const API_BASE_URL = window.CONFIG?.apiUrl || '';

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('estadisticas')) {
        cargarEstadisticas();
    }
    
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', registrarEstudiante);
    }
});

function cargarEstadisticas() {
    const statsDiv = document.getElementById('estadisticas');
    if (!statsDiv) return;
    
    fetch(`${API_BASE_URL}/api/estudiantes`)
        .then(response => response.json())
        .then(estudiantes => {
            const ultimoRegistro = estudiantes.length > 0 ? 
                new Date(estudiantes[estudiantes.length-1].fechaRegistro).toLocaleString() : 
                'Ninguno';
            
            statsDiv.innerHTML = `
                <p><strong>Total:</strong> ${estudiantes.length} estudiantes</p>
                <p><strong>Último registro:</strong> ${ultimoRegistro}</p>
            `;
        })
        .catch(error => {
            statsDiv.innerHTML = '<p style="color: red;">Error al cargar estadísticas</p>';
        });
}

function registrarEstudiante(event) {
    event.preventDefault();
    
    const formData = {
        nombre: document.getElementById('nombre')?.value || '',
        email: document.getElementById('email')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
        password: document.getElementById('password')?.value || '123456',
        numeroSeguroSocial: document.getElementById('numeroSeguroSocial')?.value || '',
        informacionBancaria: document.getElementById('informacionBancaria')?.value || '',
        tarjetaCredito: document.getElementById('tarjetaCredito')?.value || ''
    };
    
    fetch(`${API_BASE_URL}/api/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return response.json();
    })
    .then(data => {
        alert('✅ Estudiante registrado exitosamente');
        document.getElementById('formRegistro').reset();
        setTimeout(() => window.location.href = 'estudiantes.html', 1500);
    })
    .catch(error => {
        alert('Error al registrar: ' + error.message);
    });
}