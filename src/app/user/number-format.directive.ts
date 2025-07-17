import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appNumberFormat]'
})
export class NumberFormatDirective {
  private previousValue = '';

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\s/g, '');

    if (isNaN(value)) {
      input.value = this.previousValue;
      return;
    }

    this.previousValue = value;

    const formatted = this.formatWithSpaces(value);
    input.value = formatted;
  }

  private formatWithSpaces(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
