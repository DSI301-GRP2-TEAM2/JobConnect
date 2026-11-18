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
}

export interface EntrepriseOffre {
  id?: string | EntrepriseDetail;
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
  localisation?: string;
  typeContrat?: string;
}
