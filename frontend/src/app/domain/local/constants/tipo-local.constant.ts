import { TipoLocal } from '../interfaces/local.interface';

/** Opções de tipo com rótulos em pt-BR (RN-G-13) para os selects. */
export const TIPOS_LOCAL: { label: string; value: TipoLocal }[] = [
  { label: 'Condomínio', value: 'CONDOMINIO' },
  { label: 'Escola', value: 'ESCOLA' },
  { label: 'Empresa', value: 'EMPRESA' },
  { label: 'Espaço público', value: 'ESPACO_PUBLICO' },
  { label: 'Outro', value: 'OUTRO' },
];

/** Rótulo pt-BR de um tipo (o backend expõe o código do enum). */
export function rotuloTipo(tipo: TipoLocal): string {
  return TIPOS_LOCAL.find((t) => t.value === tipo)?.label ?? tipo;
}
