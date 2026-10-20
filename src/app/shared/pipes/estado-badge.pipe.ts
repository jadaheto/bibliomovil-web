import { Pipe, PipeTransform } from '@angular/core';
import { badgeEstado } from '../constants/catalogos';

/** `'Aprobada' | estadoBadge` → `'badge bg-success'`. */
@Pipe({ name: 'estadoBadge' })
export class EstadoBadgePipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    return `badge ${badgeEstado(estado)}`;
  }
}
