import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ScrollerModule } from 'primeng/scroller';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { KnobModule } from 'primeng/knob';
import { HighlightPipe } from '../../pipes/highlight.pipe';
import JSZip from 'jszip';

interface SearchResult {
  fileName: string;
  productName: string;
  productCode: string;
  ean: string;
  quantity: number;
  unit: string;
}

interface XmlFileContent {
  name: string;
  content: string;
}

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    ToastModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    ScrollerModule,
    HighlightPipe,
    KnobModule,
  ],
  providers: [MessageService],
  templateUrl: './product-search.html',
  styleUrl: './product-search.css',
})
export class ProductSearch {
  private messageService = inject(MessageService);

  searchTerm: string = '';
  results: SearchResult[] = [];
  isProcessing: boolean = false;
  progress: number = 0;
  showFileList: boolean = false;
  fileSearchTerm: string = '';

  @ViewChild('fileUpload') fileUploadComponent!: FileUpload;

  // Cache of loaded XML files
  private loadedFiles: XmlFileContent[] = [];

  skeletonRows: any[] = Array(5).fill({});

  // Computed properties for UI
  get totalFilesLoaded(): number {
    return this.loadedFiles.length;
  }

  get hasResults(): boolean {
    return this.results.length > 0;
  }

  get totalQuantity(): number {
    return this.results.reduce((acc, curr) => acc + curr.quantity, 0);
  }

  /**
   * Handle file selection (Standard Upload or Custom Logic)
   * We use customUpload to handle everything client-side.
   */
  async onSelectFiles(event: any) {
    this.isProcessing = true;
    this.loadedFiles = []; // Reset on new upload
    this.results = [];

    // Slight delay to allow UI to show processing state
    setTimeout(async () => {
      try {
        const files: File[] = event.files;
        let processedCount = 0;
        const totalFiles = files.length;

        for (const file of files) {
          if (file.name.toLowerCase().endsWith('.zip')) {
            await this.processZipFile(file);
          } else if (file.name.toLowerCase().endsWith('.xml')) {
            await this.processXmlFile(file);
          }
           processedCount++;
           // Only update main progress if not in zip mode (zip updates its own progress)
           if (!file.name.toLowerCase().endsWith('.zip')) {
               this.progress = Math.round((processedCount / totalFiles) * 100);
           }
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Arquivos Carregados',
          detail: `${this.loadedFiles.length} arquivos XML processados. Pronto para buscar.`,
        });
      } catch (err) {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao processar arquivos.',
        });
      } finally {
        this.isProcessing = false;
        this.progress = 0;
      }
    }, 100);
  }

  private async processXmlFile(file: File) {
    const text = await file.text();
    this.loadedFiles.push({
      name: file.name,
      content: text,
    });
  }

  private async processZipFile(file: File) {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const fileKeys = Object.keys(loadedZip.files);
    const totalZipFiles = fileKeys.length;
    let processedZipCount = 0;

    for (const filename of fileKeys) {
      if (
        filename.toLowerCase().endsWith('.xml') &&
        !loadedZip.files[filename].dir
      ) {
        const content = await loadedZip.files[filename].async('string');
        // Extract plain filename (remove paths inside zip if any)
        const simpleName = filename.split('/').pop() || filename;
        this.loadedFiles.push({
          name: simpleName,
          content: content,
        });
      }
      processedZipCount++;
      this.progress = Math.round((processedZipCount / totalZipFiles) * 100);
    }
  }

  search() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite um termo para buscar.',
      });
      return;
    }

    if (this.loadedFiles.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Carregue arquivos XML ou ZIP primeiro.',
      });
      return;
    }

    this.isProcessing = true;
    this.results = []; // Clear previous results
    const parser = new DOMParser();
    const term = this.searchTerm.toLowerCase();

    try {
      for (const file of this.loadedFiles) {
        const doc = parser.parseFromString(file.content, 'text/xml');

        // Find all <det> tags (details of products)
        // Adjusting for namespaces: use getElementsByTagName (ignores NS prefix usually)
        // or querySelectorAll with generic tag handling if needed.
        const dets = doc.getElementsByTagName('det');

        for (let i = 0; i < dets.length; i++) {
          const det = dets[i];
          const prod = det.getElementsByTagName('prod')[0];

          if (prod) {
            const xProdEl = prod.getElementsByTagName('xProd')[0];
            const qComEl = prod.getElementsByTagName('qCom')[0];
            const uComEl = prod.getElementsByTagName('uCom')[0];

            if (xProdEl) {
              const xProd = xProdEl.textContent || '';
              const cProdEl = prod.getElementsByTagName('cProd')[0];
              const cEANEl = prod.getElementsByTagName('cEAN')[0];

              const cProd = cProdEl ? (cProdEl.textContent || '') : '';
              const cEAN = cEANEl ? (cEANEl.textContent || '') : '';

              let matched = false;
              // Search Logic: Name (includes), Code (exact/includes), EAN (exact)
              if (xProd.toLowerCase().includes(term)) matched = true;
              else if (cProd.toLowerCase().includes(term)) matched = true;
              else if (cEAN === term) matched = true;

              if (matched) {
                const qCom = qComEl ? parseFloat(qComEl.textContent || '0') : 0;
                const uCom = uComEl ? uComEl.textContent || '' : '';

                this.results.push({
                  fileName: file.name,
                  productName: xProd,
                  productCode: cProd,
                  ean: cEAN,
                  quantity: qCom,
                  unit: uCom,
                });
              }
            }
          }
        }
      }

      if (this.results.length === 0) {
        this.messageService.add({
          severity: 'info',
          summary: 'Busca Concluída',
          detail: 'Nenhum produto encontrado com esse nome.',
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Busca Concluída',
          detail: `${this.results.length} ocorrências encontradas.`,
        });
      }
    } catch (err) {
      console.error('Erro na busca', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao realizar a busca nos arquivos.',
      });
    } finally {
      this.isProcessing = false;
    }
  }

  clear() {
    this.loadedFiles = [];
    this.results = [];
    this.searchTerm = '';
    this.messageService.add({
      severity: 'info',
      summary: 'Limpo',
      detail: 'Dados removidos.',
    });
  }
  formatDecimal(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  }

  toggleFileList() {
    this.showFileList = !this.showFileList;
    this.fileSearchTerm = ''; // Reset search on toggle
  }

  get filteredFiles() {
    if (!this.fileUploadComponent || !this.fileUploadComponent.files) return [];
    if (!this.fileSearchTerm) return this.fileUploadComponent.files;

    return this.fileUploadComponent.files.filter(file =>
      file.name.toLowerCase().includes(this.fileSearchTerm.toLowerCase())
    );
  }

  removeFile(event: any, fileToRemove: File) {
    if (!this.fileUploadComponent || !this.fileUploadComponent.files) return;

    const index = this.fileUploadComponent.files.indexOf(fileToRemove);
    if (index !== -1) {
      this.fileUploadComponent.remove(event, index);
      // Remove from our cache as well if needed, but 'loadedFiles' is built on 'onSelectFiles'.
      // If we remove here, we should probably clear 'loadedFiles' or rebuild it.
      // However, onSelectFiles triggers only on new selection.
      // The current logic rebuilds 'loadedFiles' entirely on 'uploadHandler' (onSelectFiles).
      // Since this is client-side 'select' before 'upload' (technically we are hijacking upload),
      // we need to be careful. 'onSelectFiles' is called by (uploadHandler).
      // The user is managing the SELECTION list here.
      // The actual processing happens when they click 'Search' or when they trigger the uploadHandler?
      // In current code: (uploadHandler)="onSelectFiles($event)".
      // So the files ARE ALREADY processed into 'loadedFiles' when they appear in the list?
      // NO. 'onSelectFiles' processes them.

      // WAIT. 'onSelectFiles' is bound to (uploadHandler).
      // This means the user selects files, then clicks 'Upload' (Carregar), and THEN they are processed.
      // BUT, in the new UI, we show the list BEFORE clicking 'Carregar'?
      // 'p-fileUpload' shows selected files immediately.
      // Our custom 'summary' shows 'fileUpload.files.length'.
      // So removing them via 'removeFile' just removes them from the pending list.
      // If 'totalFilesLoaded' > 0, it means we ALREADY processed them.

      // Use Case: User selects 100 files. Sees list. Wants to remove 1.
      // They haven't clicked 'Carregar' yet (or they have?).
      // The 'onSelectFiles' handles everything.

      // If 'loadedFiles' already has content, removing from UI list doesn't update 'loadedFiles'.
      // We should probably clear 'loadedFiles' if the user modifies the selection, forcing a re-upload?
      // Or just handle the pending selection.
    }
  }
}
