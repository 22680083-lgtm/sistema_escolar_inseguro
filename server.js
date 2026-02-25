const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - Configuración insegura
app.use(cors()); // CORS abierto a cualquiera
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Sirve archivos estáticos

// Archivo de base de datos
const DB_PATH = path.join(__dirname, 'db.json');

// Inicializar DB si no existe
if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
        estudiantes: [],
        configuracion: {
            version: "1.0",
            ultimoAcceso: new Date().toISOString(),
            claveSecreta: "123456789", // Falla criptográfica: clave hardcodeada
            dbPassword: "admin123" // Contraseña en texto plano
        }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
}

// Función para leer DB
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { estudiantes: [], configuracion: {} };
    }
}

// Función para escribir DB
function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ============ VULNERABILIDADES ============

// 1. BROKEN ACCESS CONTROL - Sin autenticación
app.get('/api/estudiantes', (req, res) => {
    const db = readDB();
    res.json(db.estudiantes);
});

// 2. IDOR - Insecure Direct Object Reference
app.get('/api/estudiante/:id', (req, res) => {
    const db = readDB();
    const estudiante = db.estudiantes.find(e => e.id === parseInt(req.params.id));
    
    if (estudiante) {
        res.json(estudiante);
    } else {
        res.status(404).json({ error: 'Estudiante no encontrado' });
    }
});

// 3. FALLAS CRIPTOGRÁFICAS - Datos en texto plano
app.post('/api/registrar', (req, res) => {
    const db = readDB();
    
    const nuevoEstudiante = {
        id: db.estudiantes.length + 1,
        nombre: req.body.nombre || '',
        email: req.body.email || '',
        telefono: req.body.telefono || '',
        direccion: req.body.direccion || '',
        fechaNacimiento: req.body.fechaNacimiento || '',
        // Falla criptográfica: Datos sensibles en texto plano
        numeroSeguroSocial: req.body.numeroSeguroSocial || '',
        informacionBancaria: req.body.informacionBancaria || '',
        password: req.body.password || '123456', // Contraseña en texto plano
        tarjetaCredito: req.body.tarjetaCredito || '',
        fechaRegistro: new Date().toISOString()
    };
    
    db.estudiantes.push(nuevoEstudiante);
    writeDB(db);
    
    res.json({ 
        mensaje: 'Estudiante registrado exitosamente',
        estudiante: nuevoEstudiante 
    });
});

// 4. Broken Access Control - Actualizar sin validación
app.put('/api/estudiante/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.estudiantes.findIndex(e => e.id === id);
    
    if (index !== -1) {
        db.estudiantes[index] = { ...db.estudiantes[index], ...req.body };
        writeDB(db);
        res.json({ mensaje: 'Estudiante actualizado', estudiante: db.estudiantes[index] });
    } else {
        res.status(404).json({ error: 'Estudiante no encontrado' });
    }
});

// 5. Broken Access Control - Eliminar sin autenticación
app.delete('/api/estudiante/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.estudiantes = db.estudiantes.filter(e => e.id !== id);
    writeDB(db);
    
    res.json({ mensaje: 'Estudiante eliminado' });
});

// 6. DISEÑO INSEGURO - API externa que expone datos sensibles
app.get('/api/externa/datos', (req, res) => {
    const db = readDB();
    
    res.json({
        sistema: {
            version: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            directorioActual: __dirname,
            archivoDB: DB_PATH
        },
        estudiantes: db.estudiantes.length,
        // Diseño inseguro: Expone datos sensibles
        configuracionSistema: db.configuracion,
        ultimosRegistros: db.estudiantes.slice(-5).map(e => ({
            id: e.id,
            nombre: e.nombre,
            email: e.email,
            password: e.password, // Contraseña expuesta
            seguroSocial: e.numeroSeguroSocial,
            tarjeta: e.tarjetaCredito
        }))
    });
});

// 7. DISEÑO INSEGURO - Búsqueda sin sanitizar
app.get('/api/externa/buscar', (req, res) => {
    const query = req.query.q || '';
    const db = readDB();
    
    // Diseño inseguro: Búsqueda sin sanitizar
    const resultados = db.estudiantes.filter(e => 
        JSON.stringify(e).toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(resultados);
});

// 8. Broken Access Control - Ruta admin sin protección
app.get('/admin', (req, res) => {
    const db = readDB();
    res.json({
        mensaje: 'PANEL ADMINISTRATIVO - SIN AUTENTICACIÓN',
        totalEstudiantes: db.estudiantes.length,
        estudiantes: db.estudiantes,
        configuracion: db.configuracion,
        infoServidor: {
            nodeVersion: process.version,
            memoria: process.memoryUsage(),
            pid: process.pid
        }
    });
});

// 9. Falla criptográfica - Exportar datos sin encriptar
app.get('/api/exportar', (req, res) => {
    const db = readDB();
    res.json({
        fecha: new Date().toISOString(),
        datos: db.estudiantes,
        metadata: {
            incluyeDatosSensibles: true,
            contrasenasVisibles: true,
            tarjetasCredito: true
        }
    });
});

// 10. Diseño inseguro - Endpoint de depuración
app.get('/debug', (req, res) => {
    res.json({
        rutasDisponibles: [
            "/api/estudiantes",
            "/api/estudiante/:id",
            "/api/registrar",
            "/api/externa/datos",
            "/admin",
            "/api/exportar",
            "/debug"
        ],
        variablesEntorno: process.env,
        archivos: fs.readdirSync(__dirname)
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(` Servidor inseguro corriendo en http://localhost:${PORT}`);
    console.log(' ADVERTENCIA: Este servidor contiene vulnerabilidades educativas');
    console.log(' Base de datos:', DB_PATH);
    console.log('\n VULNERABILIDADES INCLUIDAS:');
    console.log('1. Broken Access Control - Sin autenticación');
    console.log('2. Fallas Criptográficas - Datos en texto plano');
    console.log('3. Diseño Inseguro - Exposición de datos sensibles');
    console.log('4. IDOR - Acceso directo a objetos');
    console.log('5. Información de sistema expuesta\n');
});