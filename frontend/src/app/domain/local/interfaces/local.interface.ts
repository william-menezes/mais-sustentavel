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

/** Situação exibida e filtrável na lista — derivada de `arquivado`. */
export type SituacaoLocal = 'ATIVO' | 'ARQUIVADO';

/**
 * Local preparado para a lista, com os derivados de exibição materializados. Precisam ser campos
 * reais da linha porque o filtro de coluna da tabela opera sobre o nome do campo.
 *
 * `litros` distingue três estados: valor (local com coleta), `0` (local sem coleta) e `null`
 * (agregado de impacto indisponível). Confundir os dois últimos diria ao Gestor que um local não
 * opera quando na verdade o serviço de impacto caiu.
 */
export interface LocalNaLista extends Local {
  situacao: SituacaoLocal;
  litros: number | null;
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
