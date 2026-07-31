import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home.page';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('exibe a marca e a tagline', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('+ Sustentável');
    expect(el.querySelector('.tagline')?.textContent).toContain('Cada litro soma');
  });
});
