export interface ProfilCandidat {
  _id?: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  ville?: string;
  adresse?: string;
  titre?: string;
  competences?: string[];
  bio?: string;
  cv?: string;
  cvNomOriginal?: string;
  cvTaille?: number;
  cvDateUpload?: string;
}

export interface UpdateProfilResponse {
  message: string;
  user: ProfilCandidat;
}
