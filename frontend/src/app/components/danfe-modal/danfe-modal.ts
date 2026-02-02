import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { NfeData } from '../../models/nfe.model';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-danfe-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './danfe-modal.html',
  styleUrl: './danfe-modal.css',
})
export class DanfeModalComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() nfeData: NfeData | null = null;
  @ViewChild('barcode') barcodeElement!: ElementRef;

  updateVisible(value: boolean) {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  close() {
    this.updateVisible(false);
  }

  onShow() {
    if (this.nfeData && this.barcodeElement) {
      try {
        JsBarcode(this.barcodeElement.nativeElement, this.nfeData.chave, {
          format: 'CODE128',
          displayValue: true,
          fontSize: 14,
          height: 40,
          width: 1.5,
          margin: 0,
        });
      } catch (e) {
        console.error('Erro ao gerar barcode', e);
      }
    }
  }

  print() {
    window.print();
  }

  formatCurrency(val: number): string {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    // Simple parse YYYY-MM-DD
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }
}
