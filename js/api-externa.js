
document.addEventListener('DOMContentLoaded', function() {
    mostrarDatosEjemplo();
});

function mostrarDatosEjemplo() {
    const container = document.getElementById('api-registros');
    if (!container) return;
    
    // TUS MISMOS DATOS DE LA CAPTURA
    const estudiantes = [
        {
            id: 1,
            nombre: "María García",
            email: "maria@escuela.com",
            telefono: "555-1234",
            fechaRegistro: "2026-02-25T13:11:06.000Z"
        },
        {
            id: 2,
            nombre: "Juan Pérez",
            email: "juan@escuela.com",
            telefono: "555-5678",
            fechaRegistro: "2026-02-25T13:11:06.000Z"
        },
        
        {
            id: 5,
            nombre: "Carlos López",
            email: "carlos@escuela.com",
            telefono: "555-9012",
            fechaRegistro: "2026-02-25T13:43:34.000Z"
        }
    ];
    
    let html = `
        <div class="records-summary" style="background-color: #4CAF50; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 18px; margin: 0;"><strong>Total de registros:</strong> ${estudiantes.length}</p>
            <p style="font-size: 14px; margin: 5px 0 0 0;"> Datos cargados correctamente (modo demostración)</p>
        </div>
        
        <div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 15px; text-align: left;">ID</th>
                        <th style="padding: 15px; text-align: left;">Nombre</th>
                        <th style="padding: 15px; text-align: left;">Email</th>
                        <th style="padding: 15px; text-align: left;">Teléfono</th>
                        <th style="padding: 15px; text-align: left;">Fecha de Registro</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    estudiantes.forEach(est => {
        const fecha = new Date(est.fechaRegistro).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        html += `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 15px;">${est.id}</td>
                <td style="padding: 15px;">${est.nombre}</td>
                <td style="padding: 15px;">${est.email}</td>
                <td style="padding: 15px;">${est.telefono}</td>
                <td style="padding: 15px;">${fecha}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
            
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="recargarDemo()" style="background-color: #4CAF50; color: white; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
                Recargar Datos
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

function recargarDemo() {
    const container = document.getElementById('api-registros');
    container.innerHTML = '<div style="text-align: center; padding: 40px;"> Recargando...</div>';
    setTimeout(() => mostrarDatosEjemplo(), 500);
}

// Función para simular carga desde API (opcional)
function simularCargaAPI() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                estudiantes: [
                    { id: 1, nombre: "María García", email: "maria@escuela.com", telefono: "555-1234", fechaRegistro: new Date() }
                ]
            });
        }, 1000);
    });
}

// Hacer funciones globales
window.recargarDemo = recargarDemo;