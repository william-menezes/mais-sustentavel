import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LocalList } from './locais.page';
import { LocalService } from '../../apis/local.api';
import { Local } from '../../interfaces/local.interface';

const ATIVO: Local = {
  id: '1',
  nome: 'EMEF Professora Zaida Barbosa',
  tipo: 'ESCOLA',
  cep: '38408100',
  rua: 'Avenida João Naves de Ávila',
  numero: '1841',
  complemento: null,
  bairro: 'Saraiva',
  cidade: 'Uberlândia',
  uf: 'MG',
  arquivado: false,
  criadoEm: '',
};

/** Local vindo do modelo antigo: o texto livre ficou em `rua`, o resto é nulo. */
const MIGRADO: Local = {
  ...ATIVO,
  id: '2',
  nome: 'Migrado',
  cep: null,
  rua: 'Rua das Flores, 100 - Centro',
  numero: null,
  bairro: null,
  cidade: null,
  uf: null,
};

describe('LocalList', () => {
  let servicoFake: {
    listar: ReturnType<typeof vi.fn>;
    arquivar: ReturnType<typeof vi.fn>;
    reativar: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    servicoFake = {
      listar: vi.fn().mockReturnValue(of([])),
      arquivar: vi.fn().mockReturnValue(of({})),
      reativar: vi.fn().mockReturnValue(of({})),
    };
    await TestBed.configureTestingModule({
      imports: [LocalList],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: LocalService, useValue: servicoFake },
      ],
    }).compileComponents();
  });

  it('carrega os locais ativos ao iniciar', () => {
    servicoFake.listar.mockReturnValue(of([ATIVO]));
    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { locais: () => Local[] };

    expect(servicoFake.listar).toHaveBeenCalledWith(false);
    expect(comp.locais()).toEqual([ATIVO]);
  });

  it('resume o endereço como "rua, número — bairro"', () => {
    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      enderecoResumido: (local: Local) => string;
    };

    expect(comp.enderecoResumido(ATIVO)).toBe('Avenida João Naves de Ávila, 1841 — Saraiva');
  });

  it('resume o endereço de local migrado sem inventar separadores', () => {
    // Sem número nem bairro, o resumo não deve terminar em vírgula nem em travessão solto.
    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      enderecoResumido: (local: Local) => string;
    };

    expect(comp.enderecoResumido(MIGRADO)).toBe('Rua das Flores, 100 - Centro');
  });

  it('arquiva e recarrega a lista', () => {
    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { arquivar: (l: Local) => void };
    servicoFake.listar.mockClear();

    comp.arquivar({ id: '1', nome: 'A' } as Local);

    expect(servicoFake.arquivar).toHaveBeenCalledWith('1');
    expect(servicoFake.listar).toHaveBeenCalled();
  });

  it('alterna para arquivados e recarrega', () => {
    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      mudarVisao: (v: boolean) => void;
      verArquivados: () => boolean;
    };
    servicoFake.listar.mockClear();

    comp.mudarVisao(true);

    expect(comp.verArquivados()).toBe(true);
    expect(servicoFake.listar).toHaveBeenCalledWith(true);
  });
});
