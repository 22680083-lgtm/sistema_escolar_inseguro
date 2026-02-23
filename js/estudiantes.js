// Gestión de estudiantes - Versión completa

let estudiantes = [];
let estudianteEditando = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de estudiantes cargada');
    cargarEstudiantes();
    
    // Configurar modal
    const modal = document.getElementById('modalEditar');
    const span = document.querySelector('.close');
    
    if (span) {
        span.onclick = cerrarModal;
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            cerrarModal();
        }
    }
    
    // Configurar formulario de edición
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', guardarEdicion);
        console.log('Formulario de edición configurado');
    } else {
        console.error('No se encontró el formulario de edición');
    }
});

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
    estudianteEditando = null;
}

function cargarEstudiantes() {
    const tbody = document.querySelector('#tablaEstudiantes tbody');
    if (!tbody) return;
    
    fetch('/api/estudiantes')
        .then(response => response.json())
        .then(data => {
            estudiantes = data;
            renderizarTabla(estudiantes);
        })
        .catch(error => {
            tbody.innerHTML = `<tr><td colspan="6" style="color: red;">Error al cargar: ${error.message}</td></tr>`;
        });
}

function renderizarTabla(estudiantes) {
    const tbody = document.querySelector('#tablaEstudiantes tbody');
    if (!tbody) return;
    
    if (estudiantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay estudiantes registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = estudiantes.map(estudiante => {
        let fechaNac = 'N/A';
        if (estudiante.fechaNacimiento) {
            try {
                fechaNac = new Date(estudiante.fechaNacimiento).toLocaleDateString();
            } catch (e) {
                fechaNac = estudiante.fechaNacimiento;
            }
        }
        
        return `
        <tr>
            <td>${estudiante.id}</td>
            <td>${escapeHtml(estudiante.nombre || '')}</td>
            <td>${escapeHtml(estudiante.email || '')}</td>
            <td>${escapeHtml(estudiante.telefono || 'N/A')}</td>
            <td>${fechaNac}</td>
            <td>
                <button onclick="editarEstudiante(${estudiante.id})" class="btn" style="background-color: #ffc107; color: black; margin-right: 5px;">Editar</button>
                <button onclick="eliminarEstudiante(${estudiante.id})" class="btn btn-danger">Eliminar</button>
            </td>
        </tr>
    `}).join('');
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

// Función para editar
function editarEstudiante(id) {
    console.log('Editando estudiante ID:', id);
    
    const estudiante = estudiantes.find(e => e.id === id);
    if (!estudiante) {
        alert('Estudiante no encontrado');
        return;
    }
    
    estudianteEditando = estudiante;
    
    // Llenar formulario con datos del estudiante
    document.getElementById('edit-id').value = estudiante.id || '';
    document.getElementById('edit-nombre').value = estudiante.nombre || '';
    document.getElementById('edit-email').value = estudiante.email || '';
    document.getElementById('edit-telefono').value = estudiante.telefono || '';
    document.getElementById('edit-direccion').value = estudiante.direccion || '';
    document.getElementById('edit-fechaNacimiento').value = estudiante.fechaNacimiento || '';
    document.getElementById('edit-password').value = estudiante.password || '';
    
    // Mostrar modal
    document.getElementById('modalEditar').style.display = 'block';
}

// Función para guardar edición
function guardarEdicion(event) {
    event.preventDefault();
    
    if (!estudianteEditando) {
        alert('No hay estudiante seleccionado para editar');
        return;
    }
    
    const datosActualizados = {
        nombre: document.getElementById('edit-nombre').value,
        email: document.getElementById('edit-email').value,
        telefono: document.getElementById('edit-telefono').value,
        direccion: document.getElementById('edit-direccion').value,
        fechaNacimiento: document.getElementById('edit-fechaNacimiento').value,
        password: document.getElementById('edit-password').value
    };
    
    console.log('Enviando datos actualizados:', datosActualizados);
    
    fetch(`/api/estudiante/${estudianteEditando.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => {
        alert('Estudiante actualizado correctamente');
        cerrarModal();
        cargarEstudiantes();
    })
    .catch(error => {
        alert('Error al actualizar: ' + error.message);
        console.error('Error:', error);
    });
}

// Función para eliminar
function eliminarEstudiante(id) {
    if (confirm('¿Estás seguro de eliminar este estudiante?')) {
        fetch(`/api/estudiante/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Estudiante eliminado');
            cargarEstudiantes();
        })
        .catch(error => {
            alert('Error al eliminar: ' + error.message);
        });
    }
}