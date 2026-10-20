import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginationComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
  });

  it('muestra el rango y las páginas cercanas', () => {
    fixture.componentRef.setInput('meta', { total: 95, page: 5, limit: 10, totalPages: 10 });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mostrando 41–50 de 95');
    expect(fixture.componentInstance.paginas()).toEqual([3, 4, 5, 6, 7]);
  });

  it('emite la página al pulsar siguiente', () => {
    fixture.componentRef.setInput('meta', { total: 30, page: 1, limit: 10, totalPages: 3 });
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.cambiar.subscribe((p) => emitted.push(p));
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    buttons.find((b) => b.textContent?.includes('Siguiente'))?.click();
    expect(emitted).toEqual([2]);
  });
});
