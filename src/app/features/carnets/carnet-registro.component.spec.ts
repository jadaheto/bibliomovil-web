import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarnetRegistroComponent, RegistroCarnetValores, construirRegistroCarnet } from './carnet-registro.component';

const valores: RegistroCarnetValores = {
  tipoPersona: 'docente',
  nombres: ' Ana ',
  apellidos: 'Pérez',
  tipoIdentificacion: 'CC',
  numeroIdentificacion: '123',
  correo: 'ana@colegio.edu.co',
  telefono: '300',
  area: 'Matemáticas',
  grado: '5',
  edad: 10,
  jornada: 'Tarde',
  acudiente: 'Luis',
  telefonoAcudiente: '301',
  institucionId: 7,
};

describe('CarnetRegistroComponent', () => {
  let fixture: ComponentFixture<CarnetRegistroComponent>;
  let component: CarnetRegistroComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarnetRegistroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CarnetRegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('al elegir docente exige correo, teléfono y área (no los de estudiante)', () => {
    component.form.controls.tipoPersona.setValue('docente');
    expect(component.tipo()).toBe('docente');
    expect(component.form.controls.correo.hasError('required')).toBe(true);
    expect(component.form.controls.telefono.hasError('required')).toBe(true);
    expect(component.form.controls.area.hasError('required')).toBe(true);
    expect(component.form.controls.grado.valid).toBe(true);
    expect(component.form.controls.edad.valid).toBe(true);
    expect(component.form.controls.acudiente.valid).toBe(true);
    component.form.controls.correo.setValue('no-es-correo');
    expect(component.form.controls.correo.hasError('email')).toBe(true);
  });

  it('al cambiar a estudiante libera los campos de docente y exige los de estudiante', () => {
    component.form.controls.tipoPersona.setValue('docente');
    component.form.controls.tipoPersona.setValue('estudiante');
    expect(component.form.controls.correo.valid).toBe(true);
    expect(component.form.controls.area.valid).toBe(true);
    expect(component.form.controls.grado.hasError('required')).toBe(true);
    expect(component.form.controls.jornada.hasError('required')).toBe(true);
    expect(component.form.controls.acudiente.hasError('required')).toBe(true);
    expect(component.form.controls.telefonoAcudiente.hasError('required')).toBe(true);
    component.form.controls.edad.setValue(30);
    expect(component.form.controls.edad.hasError('max')).toBe(true);
    component.form.controls.edad.setValue(4);
    expect(component.form.controls.edad.hasError('min')).toBe(true);
    component.form.controls.edad.setValue(12);
    expect(component.form.controls.edad.valid).toBe(true);
  });

  it('muestra el bloque correspondiente en la plantilla', () => {
    component.form.controls.tipoPersona.setValue('estudiante');
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Información del Estudiante');
    expect(html).not.toContain('Información del Docente');
  });
});

describe('construirRegistroCarnet', () => {
  it('docente: solo envía los campos del docente y recorta espacios', () => {
    const body = construirRegistroCarnet(valores, false);
    expect(body).toEqual({
      tipoPersona: 'docente',
      nombres: 'Ana',
      apellidos: 'Pérez',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '123',
      correo: 'ana@colegio.edu.co',
      telefono: '300',
      area: 'Matemáticas',
    });
  });

  it('estudiante: envía edad numérica y los datos del acudiente; el admin puede fijar institución', () => {
    const body = construirRegistroCarnet({ ...valores, tipoPersona: 'estudiante' }, true);
    expect(body.grado).toBe('5');
    expect(body.edad).toBe(10);
    expect(body.jornada).toBe('Tarde');
    expect(body.acudiente).toBe('Luis');
    expect(body.telefonoAcudiente).toBe('301');
    expect(body.institucionId).toBe(7);
    expect(body).not.toHaveProperty('correo');
    expect(construirRegistroCarnet({ ...valores, institucionId: null }, true)).not.toHaveProperty('institucionId');
  });
});
