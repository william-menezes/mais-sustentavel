/**
 * Valor social agregado de um local: litros reais recolhidos nos seus pontos e o valor social
 * derivado (R$ 1,00 por litro — RN-G-02). Entregue pela IS-01.
 */
export interface ValorSocialLocal {
  localId: string;
  localNome: string;
  litrosReais: number;
  valorSocial: number;
}
