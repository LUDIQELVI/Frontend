import { SimulationDtoResponse } from "../service/models";

export interface SimulationDtoResponseExtended extends SimulationDtoResponse {
  coutTotal?: number;
  datefin?: string;
}
