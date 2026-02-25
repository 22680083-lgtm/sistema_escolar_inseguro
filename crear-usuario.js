const bcrypt = require('bcrypt');
const fs = require('fs');

async function crearUsuarios() {
    // Leer db.json actual
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    
    // Crear array de usuarios si no existe
    if (!db.usuarios) {
        db.usuarios = [];
    }
    
    // Contraseña para los usuarios
    const passwordPlano = 'admin123';
    const hashedPassword = await bcrypt.hash(passwordPlano, 10);
    
    console.log('✅ Contraseña hasheada:', hashedPassword);
    
    // Agregar usuarios
    db.usuarios.push({
        id: 1,
        username: 'maribel',
        email: 'maribel@escuela.com',
        password: hashedPassword,
        isAdmin: false,
        fechaRegistro: new Date().toISOString()
    });
    
    db.usuarios.push({
        id: 2,
        username: 'admin',
        email: 'admin@escuela.com',
        password: hashedPassword,
        isAdmin: true,
        fechaRegistro: new Date().toISOString()
    });
    
    // Guardar archivo
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    console.log('✅ Usuarios creados correctamente');
    console.log('📝 Puedes iniciar sesión con:');
    console.log('   - Usuario: maribel / Contraseña: admin123');
    console.log('   - Usuario: admin / Contraseña: admin123');
}

crearUsuarios();