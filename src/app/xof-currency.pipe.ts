import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'xofCurrency' })
export class XofCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    return value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
  }
}