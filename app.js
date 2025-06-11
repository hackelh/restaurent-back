require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { PORT } = require('./config/config');
const { connectDB } = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const models = require('./models/sequelize');

const app = express();

// Configuration de la sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Configuration CORS
const corsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 heures
};

app.use(cors(corsOptions));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log de la requête entrante
  console.log(`\n=== NOUVELLE REQUÊTE ===`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Sauvegarder la fonction d'envoi originale
  const originalSend = res.send;
  
  // Intercepter la réponse
  res.send = function(body) {
    // Calculer le temps de traitement
    const duration = Date.now() - start;
    
    // Log de la réponse
    console.log(`\n=== RÉPONSE ===`);
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    if (res.statusCode >= 400) {
      console.error('Erreur:', body);
    } else {
      console.log('Réponse:', JSON.stringify(body, null, 2));
    }
    
    // Appeler la fonction d'envoi originale
    originalSend.call(this, body);
  };
  
  next();
});

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de sécurité supplémentaire
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configuration pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/ordonnances', require('./routes/ordonnances'));
app.use('/api/stats', require('./routes/statsRoutes'));

// Gestion des routes non trouvées
app.use((req, res) => {
  console.log(`Route non trouvée: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.url
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connexion à la base de données
connectDB().then(() => {
  // Démarrage du serveur seulement après la connexion à la base de données
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log('Routes disponibles:');
    console.log('- /api/auth');
    console.log('- /api/patients');
    console.log('- /api/appointments');
    console.log('- /api/ordonnances');
    console.log('- /api/stats');
  });
}).catch(err => {
  console.error('Erreur de connexion à la base de données:', err);
  process.exit(1);
});

module.exports = app;
