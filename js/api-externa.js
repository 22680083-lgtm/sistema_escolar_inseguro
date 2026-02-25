// js/api-externa.js - Versión simplificada solo para mostrar registros
// Al principio de cada archivo .js
if (!window.CONFIG) {
    console.error('❌ No se encontró config.js. Asegúrate de incluirlo.');
}
const API_BASE_URL = window.CONFIG?.apiUrl || '';
document.addEventListener('DOMContentLoaded', function() {
    cargarRegistrosAPI();
});

function cargarRegistrosAPI() {
    const container = document.getElementById('api-registros');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Cargando registros desde la API...</div>';
    
    // Llamar al endpoint de estudiantes
    fetch('http://localhost:3000/api/estudiantes')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(estudiantes => {
            if (estudiantes.length === 0) {
                container.innerHTML = '<p class="no-data">No hay estudiantes registrados</p>';
                return;
            }
            
            mostrarRegistros(estudiantes);
        })
        .catch(error => {
            container.innerHTML = `
                <div class="error-message">
                    <p> Error al cargar la API</p>
                    <p>${error.message}</p>
                    <p>Verifica que el servidor esté corriendo en: <strong>http://localhost:3000</strong></p>
                    <button onclick="cargarRegistrosAPI()" class="btn-reintentar">Reintentar</button>
                </div>
            `;
        });
}

function mostrarRegistros(estudiantes) {
    const container = document.getElementById('api-registros');
    
    let html = `
        <div class="records-summary">
            <p><strong>Total de registros:</strong> ${estudiantes.length}</p>
        </div>
        <table class="records-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Fecha de Registro</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    estudiantes.forEach(est => {
        const fechaRegistro = est.fechaRegistro ? new Date(est.fechaRegistro).toLocaleDateString() : 'N/A';
        
        html += `
            <tr>
                <td>${est.id}</td>
                <td>${est.nombre || 'N/A'}</td>
                <td>${est.email || 'N/A'}</td>
                <td>${est.telefono || 'N/A'}</td>
                <td>${fechaRegistro}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <div class="api-info">
            <p><small>Datos obtenidos de: <code>http://localhost:3000/api/estudiantes</code></small></p>
        </div>
    `;
    
    container.innerHTML = html;
}

// Hacer función global para reintentar
window.cargarRegistrosAPI = cargarRegistrosAPI;