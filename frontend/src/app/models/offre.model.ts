export interface Categorie {
  _id: string;
  libelle: string;
  description?: string;
}

export interface EntrepriseOffre {
  id: string;
  nomEntreprise: string;
}

export interface Offre {
  _id: string;
  titre: string;
  description: string;
  salaire?: number;
  dateCreation: string;
  statut: string;
  categorie?: Categorie;
  entreprise?: EntrepriseOffre;
  lieu?: string;
  localisation?: string;
  typeContrat?: string;
  missionsPrincipales?: string;
  exigencesCandidat?: string;
}

export interface OffreDraft extends Pick<Offre, 'titre' | 'description' | 'localisation' | 'typeContrat' | 'missionsPrincipales' | 'exigencesCandidat'> {
  categorie: string;
  salaire?: number;
}

export interface OffreCreee extends OffreDraft {
  id: string;
  statut: string;
}
