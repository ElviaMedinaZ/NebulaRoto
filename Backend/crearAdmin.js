const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin'); // Ajusta la ruta si es necesario

async function run() {
    await mongoose.connect('AQUI_VA_TU_URI_DE_MONGODB_ATLAS'); // O usa tu process.env.MONGO_URI
    
    const passwordHash = await bcrypt.hash('TuPassword123*', 10);
    
    await Admin.findOneAndUpdate(
        { email: 'admin@nebula.com' },
        { 
            nombre: 'Administrador General', 
            email: 'admin@nebula.com', 
            passwordHash: passwordHash, 
            role: 'admin',
            terminosAceptadosEn: new Date()
        },
        { upsert: true, new: true }
    );
    
    console.log('¡Administrador creado o actualizado con éxito!');
    process.exit(0);
}

run();