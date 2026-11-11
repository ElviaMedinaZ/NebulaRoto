const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Ajusta la ruta si es necesario

require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });

async function run() {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!uri || !email || !password) {
            throw new Error('Configura MONGODB_URI, ADMIN_EMAIL y ADMIN_PASSWORD.');
        }

        await mongoose.connect(uri);
        const passwordHash = await bcrypt.hash(password, 12);

        await Admin.findOneAndUpdate(
            { email },
            {
                nombre: 'Administrador General',
                email,
                passwordHash,
                role: 'admin',
                terminosAceptadosEn: new Date()
            },
            { upsert: true, new: true }
        );

        console.log('Usuario administrador creado o actualizado.');
    } catch (error) {
        console.error('Error al crear el admin:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

run();