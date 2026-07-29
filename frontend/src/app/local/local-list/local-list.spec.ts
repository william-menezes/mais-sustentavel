import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LocalList } from './local-list';
import { LocalService } from '../local.service';
import { Local } from '../local.model';

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
    const ativo: Local = { id: '1', nome: 'A', tipo: 'ESCOLA', endereco: 'R', arquivado: false, criadoEm: '' };
    servicoFake.listar.mockReturnValue(of([ativo]));
    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { locais: () => Local[] };

    expect(servicoFake.listar).toHaveBeenCalledWith(false);
    expect(comp.locais()).toEqual([ativo]);
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
