// js/registro.js

document.addEventListener('DOMContentLoaded', function() {
    // Si estamos en index.html, cargar estadísticas
    if (document.getElementById('estadisticas')) {
        cargarEstadisticas();
    }
    
    // Si estamos en registro.html, configurar el formulario
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', registrarEstudiante);
    }
});

function cargarEstadisticas() {
    const statsDiv = document.getElementById('estadisticas');
    if (!statsDiv) return;
    
    fetch('/api/estudiantes')
        .then(response => response.json())
        .then(estudiantes => {
            const ultimoRegistro = estudiantes.length > 0 ? 
                new Date(estudiantes[estudiantes.length-1].fechaRegistro).toLocaleString() : 
                'Ninguno';
            
            statsDiv.innerHTML = `
                <p><strong>Total:</strong> ${estudiantes.length} estudiantes</p>
                <p><strong>Último registro:</strong> ${ultimoRegistro}</p>
                <button onclick="verDatosCompletos()" class="btn btn-danger">
                    Ver Datos Sensibles (Inseguro)
                </button>
            `;
        })
        .catch(error => {
            statsDiv.innerHTML = '<p style="color: red;">Error al cargar estadísticas</p>';
            console.error('Error:', error);
        });
}

function registrarEstudiante(event) {
    event.preventDefault();
    
    // Recolectar todos los datos del formulario
    const formData = {
        nombre: document.getElementById('nombre')?.value || '',
        email: document.getElementById('email')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
        // Campos ocultos (los enviamos vacíos)
        numeroSeguroSocial: document.getElementById('numeroSeguroSocial')?.value || '',
        informacionBancaria: document.getElementById('informacionBancaria')?.value || '',
        tarjetaCredito: document.getElementById('tarjetaCredito')?.value || ''
    };
    
    console.log('Enviando datos:', formData);
    
    fetch('/api/registrar', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert(' Estudiante registrado exitosamente');
        console.log('Respuesta del servidor:', data);
        
        // Limpiar el formulario
        document.getElementById('formRegistro').reset();
        
        // Redirigir a la lista de estudiantes después de 1.5 segundos
        setTimeout(() => {
            window.location.href = 'estudiantes.html';
        }, 1500);
    })
    .catch(error => {
        alert('Error al registrar: ' + error.message);
        console.error('Error:', error);
    });
}



// Hacer funciones globales
window.verDatosCompletos = verDatosCompletos;