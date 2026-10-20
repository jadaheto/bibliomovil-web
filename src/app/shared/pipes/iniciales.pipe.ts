import { Pipe, PipeTransform } from '@angular/core';
import { iniciales } from '../constants/catalogos';

@Pipe({ name: 'iniciales' })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined): string {
    return iniciales(nombre);
  }
}
