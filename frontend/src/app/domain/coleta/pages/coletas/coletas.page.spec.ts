import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ColetaList } from './coletas.page';
import { ColetaService } from '../../apis/coleta.api';
import { Coleta } from '../../interfaces/coleta.interface';

describe('ColetaList', () => {
  let servicoFake: { listar: ReturnType<typeof vi.fn>; registrar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    servicoFake = {
      listar: vi.fn().mockReturnValue(of({ totalLitros: 0, coletas: [] })),
      registrar: vi.fn().mockReturnValue(of({})),
    };
    await TestBed.configureTestingModule({
      imports: [ColetaList],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: ColetaService, useValue: servicoFake },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'P1' } } } },
        { provide: Location, useValue: { back: () => {} } },
      ],
    }).compileComponents();
  });

  it('carrega coletas e total ao iniciar', () => {
    const coleta: Coleta = { id: 'C1', pontoId: 'P1', litrosReais: 15.5, data: '2026-07-20', coletorNome: 'Gestor', criadoEm: '' };
    servicoFake.listar.mockReturnValue(of({ totalLitros: 15.5, coletas: [coleta] }));
    const fixture = TestBed.createComponent(ColetaList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { total: () => number; coletas: () => Coleta[] };

    expect(servicoFake.listar).toHaveBeenCalledWith('P1');
    expect(comp.total()).toBe(15.5);
    expect(comp.coletas().length).toBe(1);
  });

  it('recarrega após registrar', () => {
    const fixture = TestBed.createComponent(ColetaList);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { aoRegistrar: () => void };
    servicoFake.listar.mockClear();

    comp.aoRegistrar();

    expect(servicoFake.listar).toHaveBeenCalled();
  });
});
