const Institucion = require("../models/Institucion");

const registrarInstitucion = async (req, res) => {
    try {
        const { nombre, direccion, telefono, correoContacto } = req.body;
        const nuevaInstitucion = await Institucion.create({
            nombre,
            direccion,
            telefono,
            correoContacto
        });
        return res.status(201).json({
            mensaje: "Institución registrada correctamente.",
            institucion: nuevaInstitucion
        });
    } catch (error) {
        return res.status(500).json({ mensaje: "Error al registrar la institución." });
    }
};

module.exports = { registrarInstitucion };