/** Coleta (medição real de litros) de um Ponto. `data` é ISO `YYYY-MM-DD`. */
export interface Coleta {
  id: string;
  pontoId: string;
  litrosReais: number;
  data: string;
  coletorNome: string | null;
  criadoEm: string;
}

/** Coletas de um ponto + total de litros recolhidos. */
export interface ColetasDoPonto {
  totalLitros: number;
  coletas: Coleta[];
}

/** Dados enviados para registrar uma coleta. */
export interface ColetaRequest {
  litrosReais: number;
  data: string;
}
