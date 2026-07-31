import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function criar() {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return fixture;
  }

  it('exibe a trilha e o usuário padrão', () => {
    const texto = criar().nativeElement.textContent as string;
    expect(texto).toContain('Home');
    expect(texto).toContain('Painel');
    expect(texto).toContain('William Damascena');
  });

  it('marca o último item da trilha como página atual', () => {
    const el = criar().nativeElement as HTMLElement;
    const atual = el.querySelector('[aria-current="page"]');
    expect(atual?.textContent?.trim()).toBe('Painel');
  });

  it('calcula a inicial do usuário para o avatar', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.componentRef.setInput('usuarioNome', 'William Damascena');
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { inicial: () => string };
    expect(comp.inicial()).toBe('W');
  });

  it('emite ao clicar no menu e no sino', () => {
    const fixture = criar();
    const comp = fixture.componentInstance;
    let menu = false;
    let sino = false;
    comp.menuAlternado.subscribe(() => (menu = true));
    comp.notificacoes.subscribe(() => (sino = true));

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.menu') as HTMLButtonElement).click();
    (el.querySelector('.sino') as HTMLButtonElement).click();

    expect(menu).toBe(true);
    expect(sino).toBe(true);
  });
});
