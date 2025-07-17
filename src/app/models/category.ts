// src/app/service/models.ts
export interface CategorieCredit {
  id?: number;
  nomCategorie: string;
  description: string;
  fraisObligatoire: string[] | Frais[]; 
  assurances: string[] | Assurance[];
}

export interface Frais {
  nom: string;
  montant: number;
}

export interface Assurance {
  nom: string;
  montant: number;
}

export interface FrAss {
  frais: Frais[];
  assurance: Assurance[];
}