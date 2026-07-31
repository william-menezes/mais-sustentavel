import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { PontoList } from './pontos.page';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

describe('PontoList', () => {
  let servicoFake: {
    listar: ReturnType<typeof vi.fn>;
    criar: ReturnType<typeof vi.fn>;
    arquivar: ReturnType<typeof vi.fn>;
    reativar: ReturnType<typeof vi.fn>;
    qrUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    servicoFake = {
      listar: vi.fn().mockReturnValue(of([])),
      criar: vi.fn().mockReturnValue(of({})),
      arquivar: vi.fn().mockReturnValue(of({})),
      reativar: vi.fn().mockReturnValue(of({})),
      qrUrl: vi.fn().mockImplementation((id: string) => `/api/pontos/${id}/qr`),
    };
    await TestBed.configureTestingModule({
      imports: [PontoList],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: PontoService, useValue: servicoFake },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'L1' } } } },
      ],
    }).compileComponents();
  });

  it('carrega os pontos ativos do local ao iniciar', () => {
    const ponto: Ponto = { id: 'P1', localId: 'L1', qrConteudo: 'http://x/p/P1', qrImagemUrl: '/api/pontos/P1/qr', arquivado: false, criadoEm: '' };
    servicoFake.listar.mockReturnValue(of([ponto]));
    const fixture = TestBed.createComponent(PontoList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { pontos: () => Ponto[] };

    expect(servicoFake.listar).toHaveBeenCalledWith('L1', false);
    expect(comp.pontos()).toEqual([ponto]);
  });

  it('cria um novo ponto e recarrega', () => {
    const fixture = TestBed.createComponent(PontoList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { novoPonto: () => void };
    servicoFake.listar.mockClear();

    comp.novoPonto();

    expect(servicoFake.criar).toHaveBeenCalledWith('L1');
    expect(servicoFake.listar).toHaveBeenCalled();
  });

  it('alterna para arquivados e recarrega', () => {
    const fixture = TestBed.createComponent(PontoList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { mudarVisao: (v: boolean) => void };
    servicoFake.listar.mockClear();

    comp.mudarVisao(true);

    expect(servicoFake.listar).toHaveBeenCalledWith('L1', true);
  });
});
