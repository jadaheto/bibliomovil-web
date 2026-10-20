import { Pipe, PipeTransform } from '@angular/core';

/** Primera letra en mayúscula (equivalente a `ucfirst`). */
@Pipe({ name: 'titlecaseEs' })
export class TitlecaseEsPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
