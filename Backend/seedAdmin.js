const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Asegúrate de que apunte a tu modelo Admin

async function crearAdminDirecto() {
    try {
        // Conecta usando la misma URI de tu servidor
        const uri = "mongodb+srv://cjimenez20_db_user:baxdvJOFcVUf1GWQ@nebula.aq2h67x.mongodb.net/nebula?retryWrites=true&w=majority";
        await mongoose.connect(uri);
        console.log("Conectado a MongoDB Atlas...");

        const emailAdmin = "admin@nebula.com";
        
        // Verifica si ya existe para actualizarlo o crearlo
        const passwordHash = await bcrypt.hash("Admin12345678*", 12);
        
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

        console.log("¡Usuario Administrador creado/actualizado con éxito en MongoDB Atlas!", resultado);
        process.exit(0);
    } catch (error) {
        console.error("Error al crear el admin:", error);
        process.exit(1);
    }
}

crearAdminDirecto();