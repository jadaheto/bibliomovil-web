import { AbstractControl, FormGroup } from '@angular/forms';

/** Utilidades para formularios reactivos: marcar errores y obtener mensajes en español. */
export function marcarTodoTocado(form: FormGroup): void {
  Object.values(form.controls).forEach((control) => {
    control.markAsTouched();
    control.updateValueAndValidity({ onlySelf: true });
    if (control instanceof FormGroup) marcarTodoTocado(control);
  });
}

export function esInvalido(control: AbstractControl | null): boolean {
  return !!control && control.invalid && (control.touched || control.dirty);
}

export function mensajeError(control: AbstractControl | null, etiqueta = 'Este campo'): string {
  if (!control || !control.errors) return '';
  const e = control.errors;
  if (e['required']) return `${etiqueta} es obligatorio.`;
  if (e['email']) return 'Ingrese un correo válido.';
  if (e['minlength']) return `${etiqueta} debe tener al menos ${e['minlength'].requiredLength} caracteres.`;
  if (e['maxlength']) return `${etiqueta} no puede superar ${e['maxlength'].requiredLength} caracteres.`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}.`;
  if (e['max']) return `El valor máximo es ${e['max'].max}.`;
  if (e['noCoincide']) return 'Las contraseñas no coinciden.';
  if (e['pattern']) return `${etiqueta} tiene un formato inválido.`;
  return `${etiqueta} no es válido.`;
}

/** Validador de grupo: `campo` y `confirmacion` deben coincidir. */
export function coincidenValidator(campo: string, confirmacion: string) {
  return (group: AbstractControl) => {
    const a = group.get(campo)?.value;
    const b = group.get(confirmacion);
    if (!b) return null;
    if (a !== b.value) {
      b.setErrors({ ...(b.errors ?? {}), noCoincide: true });
    } else if (b.errors?.['noCoincide']) {
      const { noCoincide: _ignored, ...rest } = b.errors;
      b.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}
