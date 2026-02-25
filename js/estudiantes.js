// js/estudiantes.js
// Al principio de cada archivo .js
if (!window.CONFIG) {
    console.error(' No se encontró config.js. Asegúrate de incluirlo.');
}
const API_BASE_URL = window.CONFIG?.apiUrl || '';

let estudiantes = [];
let estudianteEditando = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarEstudiantes();
    
    // Configurar modal
    const modal = document.getElementById('modalEditar');
    if (modal) {
        const span = document.querySelector('.close');
        if (span) {
            span.onclick = () => modal.style.display = 'none';
        }
        
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }
    
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', guardarEdicion);
    }
});

function cargarEstudiantes() {
    const tbody = document.querySelector('#tablaEstudiantes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando estudiantes...</td></tr>';
    
    // ✅ CORREGIDO: Usar API_BASE_URL
    fetch(`${API_BASE_URL}/api/estudiantes`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Estudiantes cargados:', data);
            estudiantes = data;
            renderizarTabla(estudiantes);
        })
        .catch(error => {
            tbody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">
                Error al cargar: ${error.message}</td></tr>`;
            console.error('Error:', error);
        });
}

function renderizarTabla(estudiantes) {
    const tbody = document.querySelector('#tablaEstudiantes tbody');
    if (!tbody) return;
    
    if (estudiantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">' +
            'No hay estudiantes registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = estudiantes.map(estudiante => `
        <tr>
            <td>${estudiante.id}</td>
            <td>${escapeHtml(estudiante.nombre)}</td>
            <td>${escapeHtml(estudiante.email)}</td>
            <td>${escapeHtml(estudiante.telefono || 'N/A')}</td>
            <td class="actions">
                <button onclick="editarEstudiante(${estudiante.id})" class="action-btn edit-btn">
                     Editar
                </button>
                <button onclick="eliminarEstudiante(${estudiante.id})" class="action-btn delete-btn">
                     Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function editarEstudiante(id) {
    const estudiante = estudiantes.find(e => e.id === id);
    if (!estudiante) return;
    
    estudianteEditando = estudiante;
    
    document.getElementById('edit-id').value = estudiante.id;
    document.getElementById('edit-nombre').value = estudiante.nombre || '';
    document.getElementById('edit-email').value = estudiante.email || '';
    document.getElementById('edit-telefono').value = estudiante.telefono || '';
    document.getElementById('edit-direccion').value = estudiante.direccion || '';
    document.getElementById('edit-fechaNacimiento').value = estudiante.fechaNacimiento || '';
    
    document.getElementById('modalEditar').style.display = 'block';
}

function guardarEdicion(event) {
    event.preventDefault();
    
    if (!estudianteEditando) return;
    
    const datosActualizados = {
        nombre: document.getElementById('edit-nombre').value,
        email: document.getElementById('edit-email').value,
        telefono: document.getElementById('edit-telefono').value,
        direccion: document.getElementById('edit-direccion').value,
        fechaNacimiento: document.getElementById('edit-fechaNacimiento').value
    };
    
    // ✅ CORREGIDO: Usar API_BASE_URL
    fetch(`${API_BASE_URL}/api/estudiante/${estudianteEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Estudiante actualizado');
        document.getElementById('modalEditar').style.display = 'none';
        cargarEstudiantes();
    })
    .catch(error => {
        alert('Error al actualizar: ' + error.message);
        console.error('Error:', error);
    });
}

function eliminarEstudiante(id) {
    if (confirm('¿Estás seguro de eliminar este estudiante?')) {
        // ✅ CORREGIDO: Usar API_BASE_URL
        fetch(`${API_BASE_URL}/api/estudiante/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Estudiante eliminado');
            cargarEstudiantes();
        })
        .catch(error => {
            alert('Error al eliminar: ' + error.message);
            console.error('Error:', error);
        });
    }
}

// Hacer funciones globales
window.editarEstudiante = editarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;