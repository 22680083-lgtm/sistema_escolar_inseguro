// Conexión a API externa simulada - Diseño inseguro

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosAPI();
    
    const btnBuscar = document.getElementById('btnBuscar');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarInseguro);
    }
    
    const btnExploit = document.getElementById('btnExploit');
    if (btnExploit) {
        btnExploit.addEventListener('click', probarExploit);
    }
    
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.addEventListener('click', accederAdmin);
    }
});

function cargarDatosAPI() {
    const resultado = document.getElementById('resultadoAPI');
    if (!resultado) return;
    
    resultado.innerHTML = '<p>Cargando datos de API externa...</p>';
    
    // Vulnerabilidad: Llamada a API sin timeout ni manejo de errores
    fetch('/api/externa/datos')
        .then(response => response.json())
        .then(data => {
            // Diseño inseguro: Muestra información sensible del sistema
            resultado.innerHTML = `
    <h3>Datos de API Externa</h3>
    <div class="json-output">${JSON.stringify(data, null, 2)}</div>
`;
        })
        .catch(error => {
            resultado.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        });
}

function buscarInseguro() {
    const query = document.getElementById('busquedaInput').value;
    const resultado = document.getElementById('resultadoBusqueda');
    
    if (!query) {
        alert('Ingrese un término de búsqueda');
        return;
    }
    
    resultado.innerHTML = '<p>Buscando...</p>';
    
    // Vulnerabilidad: Inyección de consulta
    fetch(`/api/externa/buscar?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            resultado.innerHTML = `
                <h4>Resultados de búsqueda (${data.length} encontrados)</h4>
                <div class="json-output">${JSON.stringify(data, null, 2)}</div>
                
                <div class="vulnerability-note">
                    <p><strong>Vulnerabilidad:</strong> Esta búsqueda es susceptible a inyección. 
                    Prueba con: <code>{"password":"123"}</code> o caracteres especiales</p>
                </div>
            `;
        })
        .catch(error => {
            resultado.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        });
}

function probarExploit() {
    const resultado = document.getElementById('resultadoExploit');
    if (!resultado) return;
    
    resultado.innerHTML = '<p>Probando exploit de diseño inseguro...</p>';
    
    // Vulnerabilidad: Intenta acceder a rutas no autorizadas
    const exploits = [
        '/admin',
        '/.env',
        '/config.json',
        '/backup.zip',
        '/database.sql',
        '/api/estudiante/1',
        '/api/estudiantes?limit=1000'
    ];
    
    const exploitPromises = exploits.map(url => {
        return fetch(url)
            .then(response => ({
                url,
                status: response.status,
                ok: response.ok
            }))
            .catch(error => ({
                url,
                error: error.message
            }));
    });
    
    Promise.all(exploitPromises)
        .then(results => {
            const accesibles = results.filter(r => r.ok || r.status === 200);
            
            resultado.innerHTML = `
                <h4>Resultados del Test de Exploit</h4>
                <p><strong>Rutas probadas:</strong> ${exploits.length}</p>
                <p><strong>Rutas accesibles sin autorización:</strong> ${accesibles.length}</p>
                
                <div class="json-output">${JSON.stringify(results, null, 2)}</div>
                
                <div class="vulnerability-note">
                    <p><strong>Broken Access Control:</strong> Múltiples rutas son accesibles sin autenticación,
                    exponiendo información sensible del sistema.</p>
                </div>
            `;
        });
}

function accederAdmin() {
    // Vulnerabilidad: Intento de acceso a panel administrativo sin credenciales
    fetch('/admin')
        .then(response => response.json())
        .then(data => {
            const resultado = document.getElementById('resultadoExploit') || 
                             document.getElementById('resultadoAPI');
            
            if (resultado) {
                resultado.innerHTML = `
                    <h4>Acceso Administrativo Obtenido (Sin Autenticación)</h4>
                    <div class="json-output">${JSON.stringify(data, null, 2)}</div>
                    
                    <div class="vulnerability-note">
                        <h4>Broken Access Control Demostrado</h4>
                        <p>Se accedió al panel administrativo SIN proporcionar credenciales.
                        Esto es una grave vulnerabilidad de seguridad.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            alert('Error al acceder al panel admin: ' + error.message);
        });
}

// Función para simular ataque de fuerza bruta
function ataqueFuerzaBruta() {
    // Vulnerabilidad: No hay rate limiting
    console.log('Simulando ataque de fuerza bruta...');
    
    const passwords = ['123456', 'password', 'admin', '12345678', 'qwerty'];
    
    passwords.forEach((pass, index) => {
        setTimeout(() => {
            console.log(`Intentando: ${pass}`);
            // Simular intento de login
            fetch('/api/externa/buscar?q=' + pass)
                .then(() => console.log(`Intento ${index + 1} completado`))
                .catch(() => console.log(`Intento ${index + 1} fallido`));
        }, index * 500);
    });
}