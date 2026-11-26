export interface User {
  id?: string;
  _id: string;
  nom: string;
  prenom?: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterCandidatPayload {
  nom: string;
  prenom: string;
  email: string;
  mdp: string;
}

export interface RegisterCandidatResponse {
  message: string;
  user: { id: string; nom: string; prenom: string; email: string; role: string };
}
