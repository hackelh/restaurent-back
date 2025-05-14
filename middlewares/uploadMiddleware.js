const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/ordonnances';
        
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Générer un nom de fichier unique avec timestamp
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `ordonnance-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filtre pour n'accepter que les PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
};

// Configuration de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite à 5MB
        files: 1 // Un seul fichier à la fois
    }
});

// Middleware de gestion des erreurs Multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Le fichier est trop volumineux. Taille maximale : 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Erreur lors du téléchargement du fichier',
            error: err.message
        });
    }
    
    if (err.message === 'Seuls les fichiers PDF sont acceptés') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next(err);
};

// Middleware de suppression de fichier
const deleteFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

module.exports = {
    upload: upload.single('ordonnancePDF'),
    handleUploadError,
    deleteFile
};
