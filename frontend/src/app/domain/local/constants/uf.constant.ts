import { Uf } from '../interfaces/local.interface';

/**
 * As 27 unidades federativas, para alimentar o select.
 *
 * Diferente de `TIPOS_LOCAL`, aqui não há par `{ label, value }`: para UF a sigla **é** o
 * rótulo, e duplicá-la em duas propriedades só criaria a chance de as duas divergirem.
 */
export const UFS: Uf[] = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
