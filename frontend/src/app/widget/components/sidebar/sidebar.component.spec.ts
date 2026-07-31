import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar.component';

describe('Sidebar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function criar() {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    return fixture;
  }

  it('exibe a marca', () => {
    const texto = criar().nativeElement.textContent as string;
    expect(texto).toContain('Sustentável');
  });

  it('lista as seções e todos os itens de navegação', () => {
    const texto = criar().nativeElement.textContent as string;
    for (const rotulo of [
      'Operação',
      'Painel',
      'Locais',
      'Pontos de coleta',
      'Coletas',
      'Transparência',
      'Prestação de contas',
      'Ranking',
    ]) {
      expect(texto).toContain(rotulo);
    }
  });

  it('exibe os contadores vindos das entradas', () => {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.componentRef.setInput('locaisCount', 18);
    fixture.componentRef.setInput('pontosCount', 52);
    fixture.componentRef.setInput('coletasCount', 347);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('18');
    expect(texto).toContain('52');
    expect(texto).toContain('347');
  });

  it('calcula iniciais, percentual e rótulo formatado da meta', () => {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.componentRef.setInput('usuarioNome', 'William Damascena');
    fixture.componentRef.setInput('metaAtual', 1480);
    fixture.componentRef.setInput('metaTotal', 2000);
    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as {
      iniciais: () => string;
      metaPct: () => number;
    };
    expect(comp.iniciais()).toBe('WD');
    expect(comp.metaPct()).toBe(74);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('1.480');
    expect(texto).toContain('2.000');
  });

  it('marca o item ativo apenas na rota exata para o Painel', () => {
    const comp = criar().componentInstance as unknown as { exato: (l: string) => boolean };
    expect(comp.exato('/painel')).toBe(true);
    expect(comp.exato('/locais')).toBe(false);
  });
});
