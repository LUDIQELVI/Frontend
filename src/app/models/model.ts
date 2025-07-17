import { Frais } from "./category";
import { Assurance } from "./category";
import { DeblocageLigne } from "./deblocage-ligne";
import { CategorieCredit } from "./category";
export interface Simulation {
  id?: number;
  montantEmprunte: number;
  duree: number;
  tauxInteretNominal: number;
  echeance: number;
  frequence: string;
  typeEmprunteur: string;
  datePremiereEcheance: string;
  dateFin: string;
  coutTotal: number;
  fraisList: Frais[];
  assuranceList: Assurance[];
  tableauDeblocages: DeblocageLigne[];
  tegAnnuel: number;
  tableauAmortissement: {
    date: string;
    capitalRestant: number;
    interet: number;
    principal: number;
    assurance: number;
    echeanceTotale: number;
  }[];
  categorieCredit?: { id: number; nomCategorie: string };
}

export interface SimulationDtoRequest {
  categorieCreditId: number;
  montantEmprunte: number;
  duree: number;
  datePremiereEcheance: string;
  frequence: 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE';
  tauxInteretNominal: number;
  typeEmprunteur: string;
  fraisList: Frais[];
  assuranceList: Assurance[];
  tableauDeblocages: DeblocageLigne[];
}

export interface SimulationRequestGlobal {
  request: SimulationDtoRequest;
  response: Simulation;
}

export enum TypeEprunteur {
  PARTICULIER = 'PARTICULIER',
  PME = 'PME',
  GRANDE_ENTREPRISE = 'GRANDE_ENTREPRISE'
}

export interface TauxUsure {
  id: number;
  seuil: number;
  annee: number;
  categorieCredit: CategorieCredit;
  typeEmprunteur: string;
  tauxTEGMoyen: number;
  tauxUsure: number;
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