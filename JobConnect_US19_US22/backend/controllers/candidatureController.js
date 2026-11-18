const Candidature = require('../models/Candidature');
const Offre = require('../models/Offre');

// US-19 : Consulter la liste des candidatures reçues pour une offre (Entreprise)
exports.getCandidaturesByOffre = async (req, res) => {
  try {
    const offre = await Offre.findById(req.params.id);
    if (!offre) {
      return res.status(404).json({ message: 'Offre introuvable' });
    }

    if (offre.entreprise.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette offre' });
    }

    const candidatures = await Candidature.find({ offre: req.params.id })
      .populate('candidat', 'nom prenom email telephone')
      .sort({ dateCandidature: -1 });

    res.status(200).json({ offreTitre: offre.titre, candidatures });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// US-20 : Consulter le dossier d'un candidat (Entreprise)
exports.getDossierCandidat = async (req, res) => {
  try {
    const candidature = await Candidature.findById(req.params.id)
      .populate('offre')
      .populate('candidat', 'nom prenom email telephone ville titreProfessionnel competences resume cv');

    if (!candidature) {
      return res.status(404).json({ message: 'Candidature introuvable' });
    }

    if (candidature.offre.entreprise.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé à ce dossier' });
    }

    res.status(200).json(candidature);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// US-21 : Accepter ou refuser une candidature reçue (Entreprise)
exports.updateCandidatureStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['ACCEPTEE', 'REFUSEE'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide (ACCEPTEE ou REFUSEE requis)' });
    }

    const candidature = await Candidature.findById(req.params.id).populate('offre');
    if (!candidature) {
      return res.status(404).json({ message: 'Candidature introuvable' });
    }

    if (candidature.offre.entreprise.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    candidature.statut = statut;
    await candidature.save();

    res.status(200).json({ message: 'Statut mis à jour', candidature });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// US-22 : Consulter la liste de mes candidatures avec leur statut (Candidat)
exports.getMesCandidatures = async (req, res) => {
  try {
    const candidatures = await Candidature.find({ candidat: req.user.id })
      .populate({
        path: 'offre',
        select: 'titre lieu typeContrat entreprise',
        populate: { path: 'entreprise', select: 'nomEntreprise' }
      })
      .sort({ dateCandidature: -1 });

    res.status(200).json(candidatures);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
