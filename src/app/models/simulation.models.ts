import { DeblocageLigne } from './deblocage-ligne';
import { Frais } from './category';
import { Assurance } from './category';
import { TypeEprunteur } from './taux-usure';

export interface Simulation {
  id: number;
  montant: number;
  duree: number;
  tauxNominal: number;
  echeance: number;
  frequence: string;
  typeEmprunteur: string;
  dateDebut: string;
  datefin: string;
  coutTotal: number;
  fraisJson: { nom: string; montant: number }[];
  assuranceJson: { nom: string; montant: number }[];
  tableauDeblocages?: DeblocageLigne[];
  teg?: number;
  tegAnnuel: number;

 tableauAmortissement?: {
  numero: number;
  capitalRestant: number;
  interet: number;
  principal: number;
  assurance: number;
  echeanceTotale: number;
  dateEcheance: string;
}[];



  datesEcheances?: string[];

  categoryId: number;
  categoryName?: string;
  categorieCredit?: { id: number; nomCategorie: string };
  datePremiereEcheance: string;
}

export interface SimulationDtoRequest {
  categorieCreditId: number;
  montantEmprunte: number;
  duree: number;
  datePremiereEcheance: string;
  frequence: 'MENSUELLE' | 'ANNUELLE' | 'TRIMESTRIALITE';
  tauxInteretNominal: number;
  typeEprunteur: string;
  fraisList: Frais[];
  assuranceList: Assurance[];
  tableauDeblocages: DeblocageLigne[];
}

export interface SimulationDtoResponse {
  teg: number;
  echeance: number;
  totalCost: number;
  amortizationTable: {
    numero: number;
    capitalRestant: number;
    interet: number;
    principal: number;
    assurance: number;
    echeanceTotale: number;
  }[];
}

export interface SimulationRequestGlobal {
  request: SimulationDtoRequest;
  response: Simulation;
}
