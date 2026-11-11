

const path = require("node:path");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config({ path: path.join(__dirname, ".env") });

// Construye la aplicación Express y limita el origen autorizado para peticiones con cookies.
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const orientationResourceRoutes = require("./routes/orientationResourceRoutes");
const orientationRequestRoutes = require("./routes/orientationRequestRoutes");
const anonymousReportRoutes = require("./routes/anonymousReportRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");
const verificarToken = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/authorizeRoles");
const OrientationResource = require("./models/OrientationResource");
const AnonymousReport = require("./models/AnonymousReport");
const Partner = require("./models/Partner");
const defaultOrientationResources = require("./data/defaultOrientationResources");
const defaultPartners = require("./data/defaultPartners");
const Account = require("./models/Account");
const app = express();
app.disable("x-powered-by");

function isPrivateLanOrigin(origin) {
    let parsedOrigin;
    try {
        parsedOrigin = new URL(origin);
    } catch {
        return false;
    }

    if (parsedOrigin.protocol !== "http:" || !["5173", "8080"].includes(parsedOrigin.port)) {
        return false;
    }

    const octets = parsedOrigin.hostname.split(".").map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
        return false;
    }

    return octets[0] === 10
        || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
        || (octets[0] === 192 && octets[1] === 168);
}

const frontendOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        const isConfiguredOrigin = frontendOrigins.includes(origin);
        const isLocalDevelopmentOrigin = origin === "http://localhost:5173"
            || origin === "http://localhost:8080"
            || origin === "http://localhost:5174"
            || origin === "http://127.0.0.1:5173"
            || origin === "http://127.0.0.1:2000"
            || origin === "http://127.0.0.1:8080";

        if (!origin || isConfiguredOrigin || isLocalDevelopmentOrigin || isPrivateLanOrigin(origin)) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true
}));

app.use(express.json({ limit: "4mb" }));

const databaseStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
};

// Ruta raíz informativa para comprobar que el proceso HTTP está activo.
app.get("/", (_req, res) => {
    res.json({
        service: "nebula-api",
        status: "running",
        health: "/health"
    });
});

// Indica si la API puede atender operaciones que dependen de MongoDB.
app.get("/health", (_req, res) => {
    const databaseStatus = databaseStates[mongoose.connection.readyState] || "unknown";
    const isDatabaseConnected = databaseStatus === "connected";

    res.status(isDatabaseConnected ? 200 : 503).json({
        service: "nebula-api",
        status: isDatabaseConnected ? "ok" : "degraded",
        database: {
            status: databaseStatus
        }
    });
});

const statisticSchema = new mongoose.Schema({
    institution: String,
    category: String,
    cases: Number,
    riskLevel: String,
    updatedAt: { type: Date, default: Date.now }
});

const Statistic = mongoose.model('Statistic', statisticSchema);

// Endpoint para obtener estadísticas reales desde MongoDB Atlas
// Endpoint en tu server.js para calcular estadísticas reales basadas en los reportes
app.get('/api/statistics/real', verificarToken, authorizeRoles("admin", "institucional"), async (req, res) => {
    try {
        const { institution } = req.query;
        if (institution && institution !== "global") {
            return res.status(400).json({ mensaje: "Los reportes actuales no están asociados a una institución." });
        }

        const [totalReports, groupedReports] = await Promise.all([
            AnonymousReport.countDocuments(),
            AnonymousReport.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ])
        ]);
        const metrics = { psychological: 0, physical: 0, digital: 0 };
        for (const { _id, count } of groupedReports) {
            if (_id === "Psicológica") metrics.psychological = count;
            if (_id === "Física") metrics.physical = count;
            if (_id === "Digital") metrics.digital = count;
        }

        return res.status(200).json({ totalReports, metrics });
    } catch (error) {
        console.error("No se pudieron consultar las estadísticas de reportes:", error.message);
        return res.status(500).json({ mensaje: "No se pudieron cargar las estadísticas de reportes." });
    }
});
// ==========================================
// ENDPOINTS DE CUENTAS (CONECTADOS A MONGODB)
// ==========================================

// Obtener todas las cuentas de la base de datos
app.get('/api/accounts', verificarToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const accounts = await Account.find();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las cuentas de la base de datos" });
    }
});

// Crear una nueva cuenta en MongoDB
app.post('/api/accounts', verificarToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const newAccount = new Account(req.body);
        const savedAccount = await newAccount.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(400).json({ error: "Error al registrar la cuenta en la base de datos" });
    }
});

// Actualizar una cuenta por ID
app.put('/api/accounts/:id', verificarToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAccount = await Account.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedAccount);
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar la cuenta" });
    }
});

// Eliminar una cuenta por ID
app.delete('/api/accounts/:id', verificarToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        await Account.findByIdAndDelete(id);
        res.json({ success: true, id });
    } catch (error) {
        res.status(400).json({ error: "Error al eliminar la cuenta" });
    }
});

// Monta los endpoints de autenticación bajo un prefijo común.
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/resources", orientationResourceRoutes);
app.use("/api/auth/resources", orientationResourceRoutes);
app.use("/api/orientation-requests", orientationRequestRoutes);
app.use("/api/auth/orientation-requests", orientationRequestRoutes);
app.use("/api/reports", anonymousReportRoutes);
app.use("/api/auth/reports", anonymousReportRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/auth/partners", partnerRoutes);

// Responde con un error consistente cuando no existe una ruta solicitada.
app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Conecta Mongoose a la URI privada cargada desde el entorno del backend o usa el Atlas por defecto.
async function connectDatabase() {
    const defaultAtlasUri = "mongodb+srv://cjimenez20_db_user:baxdvJOFcVUf1GWQ@nebula.aq2h67x.mongodb.net/nebula?retryWrites=true&w=majority";
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || defaultAtlasUri;

    if (uri === defaultAtlasUri) {
        console.log("MONGODB_URI no detectada en .env. Conectando automáticamente al clúster de Atlas...");
    }

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB se ha conectado correctamente.");

        const appMetadata = mongoose.connection.collection("appMetadata");
        const initialization = await appMetadata.findOne({ _id: "orientation-resources-v1" });
        if (!initialization) {
            const resourcesCount = await OrientationResource.estimatedDocumentCount();
            if (resourcesCount === 0) {
                await OrientationResource.insertMany(defaultOrientationResources);
                console.log("Recursos de orientación iniciales guardados en MongoDB.");
            }
            await appMetadata.insertOne({
                _id: "orientation-resources-v1",
                initializedAt: new Date()
            });
        }
        const partnerInitialization = await appMetadata.findOne({ _id: "partners-v1" });
        if (!partnerInitialization) {
            const partnersCount = await Partner.estimatedDocumentCount();
            if (partnersCount === 0) {
                await Partner.insertMany(defaultPartners);
                console.log("Red de colaboradores inicial guardada en MongoDB.");
            }
            await appMetadata.insertOne({
                _id: "partners-v1",
                initializedAt: new Date()
            });
        }
    } catch (error) {
        console.error("No se pudo conectar a MongoDB:", error.message);
    }
}

// Inicia el servidor HTTP y comienza a realizar la conexión a la bdd
function startServer() {
    const port = Number(process.env.PORT) || 3000;
    const server = app.listen(port, () => {
        console.log(`Nebula API ejecutándose en el puerto ${port}.`);
    });

    server.on("error", (error) => {
        console.error("No se pudo iniciar el servidor:", error.message);
        process.exitCode = 1;
    });

    void connectDatabase();
    return server;
}

// Permite importar la aplicación en pruebas sin abrir automáticamente un puerto
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };