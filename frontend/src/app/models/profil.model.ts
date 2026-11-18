export interface CandidatProfil {
  _id?: string;
  nom: string;
  prenom?: string;
  titre?: string;
  email: string;
  telephone?: string;
  adresse?: string;
  role?: string;
}

export interface UpdateProfilDto {
  nom?: string;
  prenom?: string;
  titre?: string;
  telephone?: string;
  adresse?: string;
}

export interface UpdateProfilResponse {
  message: string;
  user: CandidatProfil;
}
