const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Asegúrate de que apunte a tu modelo Admin

require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });

async function crearAdminDirecto() {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        const emailAdmin = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!uri || !emailAdmin || !adminPassword) {
            throw new Error("Configura MONGODB_URI, ADMIN_EMAIL y ADMIN_PASSWORD.");
        }

        await mongoose.connect(uri);
        console.log("Conectado a MongoDB Atlas...");

        // Verifica si ya existe para actualizarlo o crearlo
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        
        const resultado = await Admin.findOneAndUpdate(
            { email: emailAdmin },
            {
                nombre: "Administrador General",
                email: emailAdmin,
                passwordHash: passwordHash,
                role: "admin", // <--- Forzamos explícitamente el rol de admin
                terminosAceptadosEn: new Date()
            },
            { upsert: true, new: true }
        );

        console.log("Usuario administrador creado o actualizado.", resultado.email);
    } catch (error) {
        console.error("Error al crear el admin:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

crearAdminDirecto();