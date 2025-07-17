import { CategorieCredit } from "./category";

export enum TypeEprunteur {
  ADMINISTRATIONS_PUBLIQUES = 'ADMINISTRATIONS_PUBLIQUES',
  SOCIETES_NON_FINANCIERES_PUBLIQUES = 'SOCIETES_NON_FINANCIERES_PUBLIQUES',
  GRANDE_ENTREPRISE = 'GRANDE_ENTREPRISE',
  PME = 'PME',
  SOCIETES_ASSURANCE = 'SOCIETES_ASSURANCE',
  AUTRES_SOCIETES_FINANCIERES = 'AUTRES_SOCIETES_FINANCIERES',
  MENAGES = 'MENAGES',
  INSTITUTIONS_SANS_BUT_LUCRATIF = 'INSTITUTIONS_SANS_BUT_LUCRATIF',
  PARTICULIER = 'PARTICULIER'
}

export interface TauxUsure {
  id: number;
  seuil: number;
  annee: number;
  categorieCredit: CategorieCredit;
  typeEmprunteur?: string; // Conservé pour compatibilité avec l'entité backend
  tauxTEGMoyen?: number;
  tauxUsure: number;
}

export interface TauxUsureDto {
  id?: number;
  seuil?: number;
  annee?: number;
  categorieId: number;
  typeEprunteur: TypeEprunteur; // Corrigé : 'type_emprunteur' -> 'typeEprunteur' pour correspondre au backend
  tauxUsure?: number;
  tauxTEGMoyen?: number;
}

export interface HistoriqueTauxUsure {
  id: number;
  tauxUsureId: number;
  ancienSeuil: number;
  nouveauSeuil: number;
  ancienneAnnee: number;
  nouvelleAnnee: number;
  ancienTauxUsure: number;
  nouveauTauxUsure: number;
  dateModification: string;
  typeChangement: string;
}