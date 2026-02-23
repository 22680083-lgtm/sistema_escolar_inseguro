const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Archivo de base de datos
const DB_PATH = path.join(__dirname, 'db.json');

// Inicializar DB si no existe
if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
        estudiantes: [],
        configuracion: {
            version: "1.0",
            ultimoAcceso: new Date().toISOString(),
            claveSecreta: "123456789",
            dbPassword: "admin123"
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

// ============ API ROUTES ============

// ✅ REGISTRAR ESTUDIANTE - Esta es la ruta que te falta
app.post('/api/registrar', (req, res) => {
    console.log('Recibida solicitud de registro:', req.body);
    
    const db = readDB();
    
    const nuevoEstudiante = {
        id: db.estudiantes.length + 1,
        nombre: req.body.nombre || '',
        email: req.body.email || '',
        telefono: req.body.telefono || '',
        direccion: req.body.direccion || '',
        fechaNacimiento: req.body.fechaNacimiento || '',
        password: req.body.password || '123456',
        fechaRegistro: new Date().toISOString()
    };
    
    db.estudiantes.push(nuevoEstudiante);
    writeDB(db);
    
    console.log('Estudiante registrado:', nuevoEstudiante);
    
    res.json({ 
        mensaje: 'Estudiante registrado exitosamente',
        estudiante: nuevoEstudiante 
    });
});

// Obtener todos los estudiantes
app.get('/api/estudiantes', (req, res) => {
    const db = readDB();
    res.json(db.estudiantes);
});

// Obtener un estudiante por ID
app.get('/api/estudiante/:id', (req, res) => {
    const db = readDB();
    const estudiante = db.estudiantes.find(e => e.id === parseInt(req.params.id));
    
    if (estudiante) {
        res.json(estudiante);
    } else {
        res.status(404).json({ error: 'Estudiante no encontrado' });
    }
});

// Esta ruta debe existir en server.js
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

// Eliminar estudiante
app.delete('/api/estudiante/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.estudiantes = db.estudiantes.filter(e => e.id !== id);
    writeDB(db);
    
    res.json({ mensaje: 'Estudiante eliminado' });
});

// API Externa - Datos del sistema
app.get('/api/externa/datos', (req, res) => {
    const db = readDB();
    
    res.json({
        sistema: {
            version: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            directorioActual: __dirname
        },
        estudiantes: db.estudiantes.length,
        configuracionSistema: db.configuracion,
        ultimosRegistros: db.estudiantes.slice(-5)
    });
});

// Búsqueda insegura
app.get('/api/externa/buscar', (req, res) => {
    const query = req.query.q || '';
    const db = readDB();
    
    const resultados = db.estudiantes.filter(e => 
        JSON.stringify(e).toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(resultados);
});

// Panel admin sin autenticación
app.get('/admin', (req, res) => {
    const db = readDB();
    res.json({
        mensaje: 'PANEL ADMINISTRATIVO - SIN AUTENTICACIÓN',
        totalEstudiantes: db.estudiantes.length,
        estudiantes: db.estudiantes,
        configuracion: db.configuracion
    });
});

// Exportar datos
app.get('/api/exportar', (req, res) => {
    const db = readDB();
    res.json({
        fecha: new Date().toISOString(),
        datos: db.estudiantes
    });
});

// Debug
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
        ]
    });
});

// Ruta para servir páginas de la carpeta pages
app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'pages', page);
    
    const finalPath = filePath.endsWith('.html') ? filePath : filePath + '.html';
    
    res.sendFile(finalPath, (err) => {
        if (err) {
            res.status(404).send(`No se puede obtener /pages/${page}`);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Base de datos: ${DB_PATH}`);
    console.log(`Rutas API disponibles:`);
    console.log(`- POST /api/registrar`);
    console.log(`- GET /api/estudiantes`);
    console.log(`- GET /api/estudiante/:id`);
    console.log(`- PUT /api/estudiante/:id`);
    console.log(`- DELETE /api/estudiante/:id`);
    console.log(`- GET /api/externa/datos`);
});