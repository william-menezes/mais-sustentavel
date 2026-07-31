/** Tipo de Local — lista fechada (espelha o enum TipoLocal do backend). */
export type TipoLocal = 'CONDOMINIO' | 'ESCOLA' | 'EMPRESA' | 'ESPACO_PUBLICO' | 'OUTRO';

/** Local (instituição atendida) retornado pela API. */
export interface Local {
  id: string;
  nome: string;
  tipo: TipoLocal;
  endereco: string;
  arquivado: boolean;
  criadoEm: string;
}

/** Dados enviados para cadastrar/editar um Local. */
export interface LocalRequest {
  nome: string;
  endereco: string;
  tipo: TipoLocal | null;
}
