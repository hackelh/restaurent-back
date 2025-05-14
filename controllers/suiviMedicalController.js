const { SuiviMedical } = require('../models/sequelize');
const { deleteFile } = require('../middlewares/uploadMiddleware');
const path = require('path');

// Récupérer tout le suivi médical d'un patient
exports.getSuiviMedicalByPatient = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const { count, rows: suiviMedical } = await SuiviMedical.findAndCountAll({
            where: { patientId },
            order: [['dateConsultation', 'DESC']],
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });
        
        const total = count;
        
        if (!suiviMedical || suiviMedical.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun suivi médical trouvé pour ce patient'
            });
        }

        // Ajouter l'URL complète pour les ordonnances PDF
        const suiviAvecUrls = suiviMedical.map(suivi => {
            const doc = suivi.get({ plain: true });
            if (doc.ordonnancePDF) {
                doc.ordonnancePDF = `${req.protocol}://${req.get('host')}/${doc.ordonnancePDF}`;
            }
            return doc;
        });

        res.status(200).json({
            success: true,
            data: suiviAvecUrls,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Créer un nouveau suivi médical
exports.createSuiviMedical = async (req, res, next) => {
    try {
        const { patientId, dateConsultation, pathologie, traitement, notesDentiste } = req.body;
        
        // Gérer le fichier PDF s'il existe
        const ordonnancePDF = req.file ? 
            path.join('uploads/ordonnances', req.file.filename).replace(/\\/g, '/') : 
            null;

        const nouveauSuivi = await SuiviMedical.create({
            patientId,
            dateConsultation,
            pathologie,
            traitement,
            notesDentiste,
            ordonnancePDF
        });

        // Ajouter l'URL complète pour l'ordonnance PDF
        const suiviAvecUrl = nouveauSuivi.get({ plain: true });
        if (suiviAvecUrl.ordonnancePDF) {
            suiviAvecUrl.ordonnancePDF = `${req.protocol}://${req.get('host')}/${suiviAvecUrl.ordonnancePDF}`;
        }

        res.status(201).json({
            success: true,
            message: 'Suivi médical créé avec succès',
            data: suiviAvecUrl
        });
    } catch (error) {
        // Supprimer le fichier en cas d'erreur
        if (req.file) {
            deleteFile(req.file.path);
        }
        next(error);
    }
};

// Télécharger une ordonnance
exports.getOrdonnance = async (req, res, next) => {
    try {
        const { suiviId } = req.params;
        
        const suivi = await SuiviMedical.findById(suiviId);
        
        if (!suivi || !suivi.ordonnancePDF) {
            return res.status(404).json({
                success: false,
                message: 'Ordonnance non trouvée'
            });
        }

        const filePath = path.join(__dirname, '..', suivi.ordonnancePDF);
        
        res.download(filePath, `ordonnance-${suiviId}.pdf`, (err) => {
            if (err) {
                next(new Error('Erreur lors du téléchargement du fichier'));
            }
        });
    } catch (error) {
        next(error);
    }
};

// Supprimer une ordonnance
exports.deleteOrdonnance = async (req, res, next) => {
    try {
        const { suiviId } = req.params;
        
        const suivi = await SuiviMedical.findById(suiviId);
        
        if (!suivi || !suivi.ordonnancePDF) {
            return res.status(404).json({
                success: false,
                message: 'Ordonnance non trouvée'
            });
        }

        // Supprimer le fichier
        const filePath = path.join(__dirname, '..', suivi.ordonnancePDF);
        deleteFile(filePath);

        // Mettre à jour le document
        suivi.ordonnancePDF = null;
        await suivi.update({ ordonnancePDF: null });

        res.status(200).json({
            success: true,
            message: 'Ordonnance supprimée avec succès'
        });
    } catch (error) {
        next(error);
    }
};
