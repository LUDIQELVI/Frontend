/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { Assurance } from '../models/assurance';
import { DeblocageLigne } from '../models/deblocage-ligne';
import { Frais } from '../models/frais';
export interface SimulationDtoRequest {
  assuranceList?: Array<Assurance>;
  categoriId?: number;
  datePremiereEcheance?: string;
  duree?: number;
  fraisList?: Array<Frais>;
  frequence?: 'MENSUELLE' | 'ANNUELLE' | 'TRIMESTRIALITE';
  montantEmprunte?: number;
  tableauDeblocages?: Array<DeblocageLigne>;
  tauxInteretNominal?: number;
  typeEprunteur?: 'Particulier' | 'PME' | 'GrandeEntreprise';
}
