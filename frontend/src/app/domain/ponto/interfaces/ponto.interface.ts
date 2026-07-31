/** Ponto de coleta (estação física) de um Local, com seu QR. */
export interface Ponto {
  id: string;
  localId: string;
  /** Nome do local, para compor a identificação "Local · referência" na lista (FR-003). */
  localNome: string;
  /**
   * Onde a estação fica dentro do local ("portaria", "bloco B").
   *
   * `null` nas estações cadastradas antes da V7 — o servidor não inventa valor de reserva. Quem
   * exibe decide o que mostrar no lugar, e é isso que mantém visível quais estações falta nomear.
   */
  referencia: string | null;
  /** Endereço público completo do QR. É este valor que a ação de copiar entrega (FR-031). */
  qrConteudo: string;
  qrImagemUrl: string;
  arquivado: boolean;
  criadoEm: string;
}

/** Dados enviados para cadastrar ou editar uma estação. O local nunca vem no corpo (RN-G-05). */
export interface PontoRequest {
  referencia: string;
}

/**
 * Estação na visão geral: o Ponto mais os derivados que a tela precisa como **campo**.
 *
 * O filtro de coluna da tabela casa por nome de propriedade e não sabe ler expressão — por isso
 * `situacao` e `titulo` existem como dado, e não como função de template.
 */
export interface PontoNaLista extends Ponto {
  situacao: 'ATIVO' | 'ARQUIVADO';
  /** A referência, ou a referência curta quando ela não existe (FR-013). Nunca rótulo inventado. */
  titulo: string;
  /** Primeiros oito caracteres do id — a abreviação usada para citar uma estação. */
  refCurta: string;
}
