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

// ============ MIDDLEWARE GLOBAL ============
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// 2. CORS configurado
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// 3. SESIÓN - Para autenticación
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta_temporal',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // false para desarrollo local
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1 hora
    }
}));

// 4. RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// ============ BASE DE DATOS ============
const DB_PATH = path.join(__dirname, 'db.json');

// Inicializar DB si no existe
if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
        usuarios: [],
        estudiantes: [],
        configuracion: {
            version: "1.0",
            ultimoAcceso: new Date().toISOString()
        }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    console.log('✅ Base de datos creada');
}

function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo DB:', error);
        return { usuarios: [], estudiantes: [], configuracion: {} };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ============ RUTA DE DEBUG ============
app.get('/api/debug-session', (req, res) => {
    console.log('🔍 DEBUG - Sesión actual:', req.session.id);
    console.log('   userId:', req.session.userId);
    console.log('   username:', req.session.username);
    
    res.json({
        autenticado: !!req.session.userId,
        userId: req.session.userId || null,
        username: req.session.username || null,
        isAdmin: req.session.isAdmin || false,
        sessionId: req.session.id
    });
});

// ============ MIDDLEWARE DE AUTENTICACIÓN ============
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Acceso denegado - Se requieren permisos de administrador' });
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
    console.log('📝 POST /api/register - Recibido:', req.body.username);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }

    const db = readDB();
    const { username, password, email } = req.body;

    if (db.usuarios.find(u => u.username === username)) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    if (db.usuarios.find(u => u.email === email)) {
        return res.status(400).json({ error: 'El email ya está registrado' });
    }

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

    console.log('✅ Usuario registrado:', username);
    res.json({ mensaje: 'Usuario registrado exitosamente' });
});

// Login
app.post('/api/login', async (req, res) => {
    console.log('🔑 POST /api/login - Intento:', req.body.username);
    
    const db = readDB();
    const { username, password } = req.body;

    const usuario = db.usuarios.find(u => u.username === username);
    if (!usuario) {
        console.log('❌ Usuario no encontrado:', username);
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
        console.log('❌ Contraseña incorrecta para:', username);
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    req.session.userId = usuario.id;
    req.session.username = usuario.username;
    req.session.isAdmin = usuario.isAdmin || false;

    req.session.save((err) => {
        if (err) {
            console.error('❌ Error guardando sesión:', err);
            return res.status(500).json({ error: 'Error al iniciar sesión' });
        }
        
        console.log('✅ Login exitoso para:', username);
        console.log('   Session ID:', req.session.id);
        
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
});

// Logout
app.post('/api/logout', (req, res) => {
    console.log('🚪 Logout para:', req.session.username);
    req.session.destroy((err) => {
        if (err) {
            console.error('Error en logout:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ mensaje: 'Logout exitoso' });
    });
});

// Verificar sesión actual
app.get('/api/me', (req, res) => {
    console.log('👤 GET /api/me - Sesión:', req.session.id);
    
    if (!req.session.userId) {
        console.log('❌ No autenticado');
        return res.status(401).json({ error: 'No autenticado' });
    }
    
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === req.session.userId);
    
    if (!usuario) {
        console.log('❌ Usuario no encontrado en DB');
        return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('✅ Usuario autenticado:', usuario.username);
    res.json({
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        isAdmin: usuario.isAdmin
    });
});

// ============ API DE ESTUDIANTES ============

// Obtener todos los estudiantes
app.get('/api/estudiantes', requireAuth, (req, res) => {
    console.log('📋 GET /api/estudiantes - Usuario:', req.session.username);
    const db = readDB();
    const estudiantesSeguros = db.estudiantes.map(e => ({
        id: e.id,
        nombre: e.nombre,
        email: e.email,
        telefono: e.telefono,
        fechaNacimiento: e.fechaNacimiento,
        fechaRegistro: e.fechaRegistro
    }));
    res.json(estudiantesSeguros);
});

// Obtener un estudiante por ID
app.get('/api/estudiante/:id', requireAuth, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const estudiante = db.estudiantes.find(e => e.id === id);
    
    if (!estudiante) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    if (req.session.isAdmin || req.session.userId === estudiante.usuarioId) {
        res.json(estudiante);
    } else {
        const { password, ...datosPublicos } = estudiante;
        res.json(datosPublicos);
    }
});

// Registrar nuevo estudiante
app.post('/api/registrar', requireAuth, [
    body('nombre').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('telefono').optional().trim().escape(),
    body('direccion').optional().trim().escape(),
    body('fechaNacimiento').optional().isISO8601()
], (req, res) => {
    console.log('📝 POST /api/registrar - Usuario:', req.session.username);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }

    const db = readDB();
    
    const nuevoEstudiante = {
        id: db.estudiantes.length + 1,
        usuarioId: req.session.userId,
        nombre: req.body.nombre,
        email: req.body.email,
        telefono: req.body.telefono || '',
        direccion: req.body.direccion || '',
        fechaNacimiento: req.body.fechaNacimiento || '',
        fechaRegistro: new Date().toISOString()
    };
    
    db.estudiantes.push(nuevoEstudiante);
    writeDB(db);
    
    console.log('✅ Estudiante registrado:', nuevoEstudiante.nombre);
    res.json({ 
        mensaje: 'Estudiante registrado exitosamente',
        estudiante: nuevoEstudiante
    });
});

// Actualizar estudiante
app.put('/api/estudiante/:id', requireAuth, async (req, res) => {
    console.log('✏️ PUT /api/estudiante/:id - Usuario:', req.session.username);
    
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.estudiantes.findIndex(e => e.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    if (!req.session.isAdmin && db.estudiantes[index].usuarioId !== req.session.userId) {
        return res.status(403).json({ error: 'No tienes permiso para editar este estudiante' });
    }
    
    // Actualizar solo los campos permitidos
    db.estudiantes[index] = {
        ...db.estudiantes[index],
        nombre: req.body.nombre || db.estudiantes[index].nombre,
        email: req.body.email || db.estudiantes[index].email,
        telefono: req.body.telefono || db.estudiantes[index].telefono,
        direccion: req.body.direccion || db.estudiantes[index].direccion,
        fechaNacimiento: req.body.fechaNacimiento || db.estudiantes[index].fechaNacimiento
    };
    
    // Si se envía nueva contraseña
    if (req.body.password && req.body.password.trim() !== '') {
        db.estudiantes[index].password = await bcrypt.hash(req.body.password, 10);
    }
    
    writeDB(db);
    console.log('✅ Estudiante actualizado ID:', id);
    res.json({ 
        mensaje: 'Estudiante actualizado correctamente',
        estudiante: db.estudiantes[index]
    });
});

// Eliminar estudiante (solo admin)
app.delete('/api/estudiante/:id', requireAuth, requireAdmin, (req, res) => {
    console.log('🗑️ DELETE /api/estudiante/:id - Admin:', req.session.username);
    
    const db = readDB();
    const id = parseInt(req.params.id);
    const initialLength = db.estudiantes.length;
    
    db.estudiantes = db.estudiantes.filter(e => e.id !== id);
    
    if (db.estudiantes.length === initialLength) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    writeDB(db);
    console.log('✅ Estudiante eliminado ID:', id);
    res.json({ mensaje: 'Estudiante eliminado correctamente' });
});

// ============ API EXTERNA ============
app.get('/api/externa/datos', requireAuth, (req, res) => {
    console.log('🔌 GET /api/externa/datos - Usuario:', req.session.username);
    
    const db = readDB();
    res.json({
        totalEstudiantes: db.estudiantes.length,
        ultimosRegistros: db.estudiantes.slice(-5).map(e => ({
            id: e.id,
            nombre: e.nombre,
            email: e.email,
            fechaRegistro: e.fechaRegistro
        })),
        estadisticas: {
            conTelefono: db.estudiantes.filter(e => e.telefono).length,
            conDireccion: db.estudiantes.filter(e => e.direccion).length,
            conFechaNac: db.estudiantes.filter(e => e.fechaNacimiento).length
        }
    });
});

// ============ SERVIDOR DE ARCHIVOS ESTÁTICOS ============
app.use(express.static(__dirname));

// ============ INICIAR SERVIDOR ============
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('📁 Base de datos:', DB_PATH);
    console.log('\n✅ Rutas API disponibles:');
    console.log('   - GET  /api/debug-session');
    console.log('   - POST /api/register');
    console.log('   - POST /api/login');
    console.log('   - POST /api/logout');
    console.log('   - GET  /api/me');
    console.log('   - GET  /api/estudiantes');
    console.log('   - POST /api/registrar');
    console.log('   - PUT  /api/estudiante/:id');
    console.log('   - DEL  /api/estudiante/:id');
    console.log('   - GET  /api/externa/datos\n');
});