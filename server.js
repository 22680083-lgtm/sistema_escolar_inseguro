const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ SEGURIDAD AGREGADA ============

// 1. HELMET - Configura headers de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));

// 2. RATE LIMITING - Limita peticiones
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por IP
});
app.use('/api/', limiter);

// 3. SESIÓN - Para autenticación
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_temporal_cambiar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1 hora
    }
}));

// 4. CORS configurado
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tudominio.com'] 
        : 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 5. Archivo de base de datos
const DB_PATH = path.join(__dirname, 'db.json');

// Inicializar DB
if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
        usuarios: [], // Tabla de usuarios para autenticación
        estudiantes: [],
        configuracion: {
            version: "1.0",
            ultimoAcceso: new Date().toISOString()
        }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
}

// Funciones DB
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { usuarios: [], estudiantes: [], configuracion: {} };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ============ MIDDLEWARE DE AUTENTICACIÓN ============
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Acceso denegado - Se requiere rol de administrador' });
    }
    next();
}

// ============ API DE AUTENTICACIÓN ============

// Registro de usuario
app.post('/api/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('password').isLength({ min: 6 }),
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const db = readDB();
    const { username, password, email } = req.body;

    // Verificar si usuario existe
    if (db.usuarios.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
        id: db.usuarios.length + 1,
        username,
        email,
        password: hashedPassword,
        isAdmin: false,
        fechaRegistro: new Date().toISOString()
    };

    db.usuarios.push(nuevoUsuario);
    writeDB(db);

    res.json({ mensaje: 'Usuario registrado exitosamente' });
});

// Login
app.post('/api/login', async (req, res) => {
    const db = readDB();
    const { username, password } = req.body;

    const usuario = db.usuarios.find(u => u.username === username);
    if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    req.session.userId = usuario.id;
    req.session.username = usuario.username;
    req.session.isAdmin = usuario.isAdmin || false;

    res.json({ 
        mensaje: 'Login exitoso',
        usuario: {
            id: usuario.id,
            username: usuario.username,
            email: usuario.email,
            isAdmin: usuario.isAdmin
        }
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ mensaje: 'Logout exitoso' });
});

// ============ API DE ESTUDIANTES (CON AUTENTICACIÓN) ============

// Obtener todos (requiere auth)
app.get('/api/estudiantes', requireAuth, (req, res) => {
    const db = readDB();
    // No mostrar datos sensibles
    const estudiantesSeguros = db.estudiantes.map(e => ({
        id: e.id,
        nombre: e.nombre,
        email: e.email,
        telefono: e.telefono,
        fechaNacimiento: e.fechaNacimiento,
        fechaRegistro: e.fechaRegistro
        // NO incluimos password, seguroSocial, etc.
    }));
    res.json(estudiantesSeguros);
});

// Ver un estudiante (solo si es admin o el mismo usuario)
app.get('/api/estudiante/:id', requireAuth, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const estudiante = db.estudiantes.find(e => e.id === id);
    
    if (!estudiante) {
        return res.status(404).json({ error: 'No encontrado' });
    }

    // Solo admin o el propio usuario puede ver datos sensibles
    if (req.session.isAdmin || req.session.userId === estudiante.usuarioId) {
        res.json(estudiante);
    } else {
        // Versión sin datos sensibles
        const { password, numeroSeguroSocial, informacionBancaria, tarjetaCredito, ...datosPublicos } = estudiante;
        res.json(datosPublicos);
    }
});

// Registrar (con validación)
app.post('/api/registrar', requireAuth, [
    body('nombre').trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('telefono').optional().trim().escape(),
    body('direccion').optional().trim().escape(),
    body('fechaNacimiento').optional().isISO8601()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const db = readDB();
    
    // Generar password aleatorio (no se guarda el del usuario)
    const passwordTemporal = Math.random().toString(36).slice(-8);
    
    const nuevoEstudiante = {
        id: db.estudiantes.length + 1,
        usuarioId: req.session.userId, // Asociar al usuario que crea
        nombre: req.body.nombre,
        email: req.body.email,
        telefono: req.body.telefono || '',
        direccion: req.body.direccion || '',
        fechaNacimiento: req.body.fechaNacimiento || '',
        // NO guardamos datos sensibles del formulario inseguro
        fechaRegistro: new Date().toISOString()
    };
    
    db.estudiantes.push(nuevoEstudiante);
    writeDB(db);
    
    res.json({ 
        mensaje: 'Estudiante registrado',
        estudiante: nuevoEstudiante
    });
});

// Actualizar (solo si es admin o propietario)
app.put('/api/estudiante/:id', requireAuth, async (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.estudiantes.findIndex(e => e.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'No encontrado' });
    }

    // Verificar permisos
    if (!req.session.isAdmin && db.estudiantes[index].usuarioId !== req.session.userId) {
        return res.status(403).json({ error: 'No tienes permiso para editar este registro' });
    }
    
    // Actualizar solo campos permitidos
    db.estudiantes[index] = {
        ...db.estudiantes[index],
        nombre: req.body.nombre || db.estudiantes[index].nombre,
        email: req.body.email || db.estudiantes[index].email,
        telefono: req.body.telefono || db.estudiantes[index].telefono,
        direccion: req.body.direccion || db.estudiantes[index].direccion,
        fechaNacimiento: req.body.fechaNacimiento || db.estudiantes[index].fechaNacimiento
    };
    
    writeDB(db);
    res.json({ mensaje: 'Actualizado', estudiante: db.estudiantes[index] });
});

// Eliminar (solo admin)
app.delete('/api/estudiante/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.estudiantes = db.estudiantes.filter(e => e.id !== id);
    writeDB(db);
    res.json({ mensaje: 'Eliminado' });
});

// ============ API EXTERNA SEGURA ============
app.get('/api/externa/datos', requireAuth, (req, res) => {
    const db = readDB();
    
    res.json({
        estudiantes: db.estudiantes.length,
        ultimosRegistros: db.estudiantes.slice(-5).map(e => ({
            id: e.id,
            nombre: e.nombre,
            email: e.email,
            fechaRegistro: e.fechaRegistro
            // Sin datos sensibles
        }))
    });
});

// ============ RUTAS ADMIN (PROTEGIDAS) ============
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    const db = readDB();
    res.json({
        mensaje: 'Panel de Administración',
        totalEstudiantes: db.estudiantes.length,
        estudiantes: db.estudiantes.map(e => ({
            ...e,
            // Mostrar todo SOLO a admin
        }))
    });
});

// Debug solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug', (req, res) => {
        res.json({ mensaje: 'Modo debug solo disponible en desarrollo' });
    });
}

// ============ LOGIN REDIRECT ============
app.get('/api/me', requireAuth, (req, res) => {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === req.session.userId);
    res.json({
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        isAdmin: usuario.isAdmin
    });
});

app.listen(PORT, () => {
    console.log(` Servidor seguro en http://localhost:${PORT}`);
    console.log(' Medidas de seguridad activadas:');
    console.log('   - Helmet (headers seguros)');
    console.log('   - Rate limiting');
    console.log('   - Sesiones con cookies seguras');
    console.log('   - Validación de entrada');
    console.log('   - Autenticación requerida');
    console.log('   - Contraseñas hasheadas con bcrypt');
    console.log('   - Control de acceso por roles');
});