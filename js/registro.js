// Registro de estudiantes - Versión corregida

document.addEventListener('DOMContentLoaded', function() {
    cargarEstadisticas();
    
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
            statsDiv.innerHTML = `
                <p><strong>Total de estudiantes registrados:</strong> ${estudiantes.length}</p>
                <p><strong>Último registro:</strong> ${estudiantes.length > 
                    0 ? new Date(estudiantes[estudiantes.length-1].fechaRegistro).toLocaleString() : 'Ninguno'}</p>
            `;
        })
        .catch(error => {
            statsDiv.innerHTML = '<p style="color: red;">Error al cargar estadísticas</p>';
            console.error('Error:', error);
        });
}

function registrarEstudiante(event) {
    event.preventDefault();
    
    // SOLO los campos que existen en tu HTML
    const formData = {
        nombre: document.getElementById('nombre')?.value || '',
        email: document.getElementById('email')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
        password: document.getElementById('password')?.value || '123456'
    };
    
    console.log('Enviando datos:', formData);
    
    fetch('/api/registrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => {
        alert('Estudiante registrado exitosamente');
        console.log('Respuesta:', data);
        
        document.getElementById('formRegistro').reset();
        
        setTimeout(() => {
            window.location.href = 'estudiantes.html';
        }, 1000);
    })
    .catch(error => {
        alert('Error al registrar: ' + error.message);
        console.error('Error completo:', error);
    });
}

function cargarEstadisticas() {
    const statsDiv = document.getElementById('estadisticas');
    if (!statsDiv) return;
    
    // Vulnerabilidad: Llamada directa a API sin verificación
    fetch('/api/estudiantes')
        .then(response => response.json())
        .then(estudiantes => {
            statsDiv.innerHTML = `
                <p><strong>Total de estudiantes registrados:</strong> ${estudiantes.length}</p>
                <p><strong>Último registro:</strong> ${estudiantes.length > 0 ? new Date(estudiantes[estudiantes.length-1].fechaRegistro).toLocaleString() : 'Ninguno'}</p>
            `;
        })
        .catch(error => {
            statsDiv.innerHTML = '<p style="color: red;">Error al cargar estadísticas</p>';
        });
}

function registrarEstudiante(event) {
    event.preventDefault();
    
    // Vulnerabilidad: No hay validación de datos
    const formData = {
        nombre: document.getElementById('nombre')?.value || 'Desconocido',
        email: document.getElementById('email')?.value || 'no-email@test.com',
        telefono: document.getElementById('telefono')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
        // Datos sensibles sin protección
        numeroSeguroSocial: document.getElementById('numeroSeguroSocial')?.value || '',
        informacionBancaria: document.getElementById('informacionBancaria')?.value || '',
        password: document.getElementById('password')?.value || '123456'
    };
    
    // Vulnerabilidad: Envío de datos en texto plano
    fetch('/api/registrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    // En la función registrarEstudiante, después del registro exitoso:

.then(data => {
    alert('Estudiante registrado exitosamente');
    console.log('Respuesta:', data);
    
    document.getElementById('formRegistro').reset();
    
    // CORREGIDO: Redirigir a estudiantes.html en la misma carpeta
    setTimeout(() => {
        window.location.href = 'estudiantes.html';  // Sin "pages/"
    }, 1000);
})
}

// Función para validación insegura (solo verifica si los campos existen)
function validacionInsegura(datos) {
    // Vulnerabilidad: Validación mínima, acepta cualquier dato
    return Object.keys(datos).length > 0;
}