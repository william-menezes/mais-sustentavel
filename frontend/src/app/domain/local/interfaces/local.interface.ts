/** Tipo de Local — lista fechada (espelha o enum TipoLocal do backend). */
export type TipoLocal = 'CONDOMINIO' | 'ESCOLA' | 'EMPRESA' | 'ESPACO_PUBLICO' | 'OUTRO';

/** Unidade federativa — lista fechada (espelha o enum Uf do backend). */
export type Uf =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI'
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

/**
 * Local (instituição atendida) retornado pela API, com o endereço em componentes.
 *
 * Os componentes são anuláveis de propósito: locais migrados do modelo de texto livre vêm com
 * `cep`, `numero`, `bairro`, `cidade` e `uf` nulos e `rua` preenchida com o texto original.
 * Tipar como obrigatório mentiria sobre a resposta e esconderia esse caso da interface.
 */
export interface Local {
  id: string;
  nome: string;
  tipo: TipoLocal;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: Uf | null;
  arquivado: boolean;
  criadoEm: string;
}

/**
 * Dados enviados para cadastrar/editar um Local. Diferente de {@link Local}, aqui os
 * obrigatórios são obrigatórios: o formulário só envia quando estão completos. O `cep` viaja
 * com oito dígitos, sem máscara.
 */
export interface LocalRequest {
  nome: string;
  tipo: TipoLocal | null;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: Uf | null;
}
