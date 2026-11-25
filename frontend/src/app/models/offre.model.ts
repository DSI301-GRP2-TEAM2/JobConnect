export interface Categorie {
  _id: string;
  libelle: string;
  description?: string;
}

export interface EntrepriseDetail {
  _id?: string;
  nom?: string;
  nomEntreprise?: string;
  email?: string;
  siteWeb?: string;
  secteur?: string;
  telephone?: string;
  adresse?: string;
  description?: string;
  aPropos?: string;
}

export interface EntrepriseOffre {
  id: string | EntrepriseDetail;
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
  experience?: string;
  missions?: string;
  missionsPrincipales?: string;
  conditions?: string;
  exigences?: string;
  profilRecherche?: string;
  avantages?: string;
  descriptionEntreprise?: string;
  aPropos?: string;
  motifRefus?: string;
}

export interface OffreDraft extends Pick<Offre, 'titre' | 'description' | 'localisation' | 'typeContrat' | 'missionsPrincipales' | 'profilRecherche'> {
  categorie: string;
  salaire?: number;
}

export interface OffreCreee extends OffreDraft {
  id: string;
  statut: string;
}
