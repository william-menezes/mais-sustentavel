/** Ponto de coleta (estação física) de um Local, com seu QR. */
export interface Ponto {
  id: string;
  localId: string;
  qrConteudo: string;
  qrImagemUrl: string;
  arquivado: boolean;
  criadoEm: string;
}
