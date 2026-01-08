// src/app/components/file-upload/file-upload.component.ts

import { Component, inject, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FileUploadService } from '../../services/file-upload';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MessageService } from 'primeng/api';

// Imports dos Módulos do PrimeNG
// Necessário importar os Módulos (e não apenas os componentes) para garantir que todas as dependências internas funcionem
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { KnobModule } from 'primeng/knob';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { ScrollerModule } from 'primeng/scroller'; // Import Scroller for Virtual Scrolling
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { HighlightPipe } from '../../pipes/highlight.pipe'; // Custom pipe
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ChartModule } from 'primeng/chart';

// JSZip é usado para compactar múltiplos arquivos XML no cliente antes de enviar
import JSZip from 'jszip';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  // Todos os módulos necessários devem ser listados aqui
  imports: [
    FormsModule,
    CommonModule,
    FileUploadModule,
    ButtonModule,
    SelectButtonModule,
    ToastModule,
    CardModule,
    SharedModule,
    KnobModule,
    ScrollerModule, // Add ScrollerModule
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    HighlightPipe, // Add pipe
    HighlightPipe, // Add pipe
    TooltipModule,
    DialogModule,
    ChartModule
  ],
  providers: [MessageService], // Serviço de mensagens do PrimeNG
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css'
})
export class FileUploadComponent {

  // Controla o modo de operação: 'zip' (arquivo único) ou 'xmls' (múltiplos arquivos)
  uploadMode: 'zip' | 'xmls' = 'zip';

  // Opções para o seletor de modo com Tooltips
  modeOptions: any[] = [
    {
      label: 'Upload de ZIP',
      value: 'zip',
      desc: 'Enviar 1 pasta zipada (.zip) contendo todos os xmls diretamente'
    },
    {
      label: 'Upload de XMLs',
      value: 'xmls',
      desc: 'Enviar diversos arquivos XMLs de forma solta'
    }
  ];

  // Estado de carregamento para bloquear UI e mostrar progresso
  isUploading: boolean = false;

  // Porcentagem de progresso para o Knob (0-100)
  progress: number = 0;

  // UI Control
  // UI Control
  showFileList: boolean = false;
  searchTerm: string = '';
  showSummaryDialog: boolean = false;
  processingSummary = {
    approved: 0,
    contingency: 0,
    rejected: 0,
    approvedValue: 0,
    approvedIcms: 0,
    contingencyValue: 0,
    contingencyIcms: 0,
    rejectedValue: 0,
    rejectedIcms: 0
  };

  // Dados do Gráfico
  chartData: any;
  chartOptions: any;

  // Injeção de dependências
  private fileUploadService = inject(FileUploadService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  // Acesso ao componente p-fileUpload na view para manipular arquivos/limpar
  @ViewChild('fileUpload') fileUploadComponent!: FileUpload;

  // Handler para erros do componente de upload (ex: excesso de arquivos, tipo inválido)
  onUploadError(event: any) {
    console.error('Erro no componente de upload:', event);

    // O evento usually traz 'error' e 'files'
    const errorType = event.error?.name || 'Erro desconhecido';
    let detail = 'Falha ao selecionar arquivos.';

    if (errorType === 'FileLimitError' || errorType.includes('limit')) {
      detail = `Limite de arquivos excedido. Máximo: ${this.uploadMode === 'zip' ? 1 : 1000}`;
    } else if (errorType === 'FileExtensionError' || errorType.includes('extension')) {
      detail = `Tipo de arquivo inválido. Aceito: ${this.uploadMode === 'zip' ? '.zip' : '.xml'}`;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Erro na Seleção',
      detail: detail
    });
  }

  // Toggle for showing detailed file list
  toggleFileList() {
    this.showFileList = !this.showFileList;
  }

  // Filtered files for search
  get filteredFiles() {
    if (!this.fileUploadComponent || !this.fileUploadComponent.files) return [];
    if (!this.searchTerm) return this.fileUploadComponent.files;

    return this.fileUploadComponent.files.filter(file =>
      file.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Safely remove file when using filtered list
  removeFile(event: any, fileToRemove: File) {
    if (!this.fileUploadComponent || !this.fileUploadComponent.files) return;

    const index = this.fileUploadComponent.files.indexOf(fileToRemove);
    if (index !== -1) {
      this.fileUploadComponent.remove(event, index);
    }
  }

  // Helper to format total size
  get totalSize(): string {
    if (!this.fileUploadComponent || !this.fileUploadComponent.files) return '0 B';
    const total = this.fileUploadComponent.files.reduce((acc, file) => acc + file.size, 0);
    return this.formatSize(total);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Manipulador de upload personalizado para o PrimeNG (customUpload="true").
   * Recebe o evento contendo os arquivos selecionados.
   */
  myUploader(event: any): void {
    const files = event.files;

    if (!files || files.length === 0) return;

    // Inicia estado de loading
    this.isUploading = true;
    this.progress = 0; // Inicia em 0
    this.showFileList = false; // Esconde lista para focar no progresso
    this.searchTerm = ''; // Reset search
    this.messageService.add({ severity: 'info', summary: 'Processando', detail: 'Iniciando upload...' });

    // Use setTimeout para permitir que a UI atualize (mostre o loading) antes de iniciar o processamento pesado
    setTimeout(() => {
      // --- MODO ZIP ---
      // Se o usuário selecionou enviar um ZIP pronto
      if (this.uploadMode === 'zip') {
        const zipFile = files[0];
        // Envia diretamente
        this.subscribeToUpload(this.fileUploadService.uploadZip(zipFile));

        // --- MODO XMLS (Com JSZip) ---
        // Se o usuário selecionou múltiplos XMLs, compactamos no navegador
      } else {
        if (typeof Worker !== 'undefined') {
          // Cria o Worker
          const worker = new Worker(new URL('../../workers/zip.worker', import.meta.url));

          this.messageService.add({ severity: 'info', summary: 'Comprimindo', detail: 'Agrupando via Worker...' });

          worker.onmessage = ({ data }) => {
            if (data.type === 'progress') {
              this.progress = data.value;
              this.cdr.detectChanges(); // Força atualização da UI no progresso
            } else if (data.type === 'complete') {
              this.messageService.add({ severity: 'info', summary: 'Enviando', detail: 'A enviar pacote...' });
              this.progress = 0;
              this.subscribeToUpload(this.fileUploadService.uploadZip(data.blob));
              worker.terminate(); // Limpa o worker
            }
          };

          // Envia arquivos para o worker
          worker.postMessage({ files: files });

        } else {
          // Fallback para thread principal (se worker não suportado)
          this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Worker não suportado. Usando thread principal.' });

          const zip = new JSZip();
          files.forEach((file: any) => {
            zip.file(file.name, file);
          });

          zip.generateAsync({ type: 'blob' }, (metadata) => {
            this.progress = Math.round(metadata.percent);
          }).then((zipBlob) => {
            const zipFile = new File([zipBlob], "xmls_do_navegador.zip", { type: "application/zip" });
            this.messageService.add({ severity: 'info', summary: 'Enviando', detail: 'A enviar pacote...' });
            this.progress = 0;
            this.subscribeToUpload(this.fileUploadService.uploadZip(zipFile));
          });
        }
      }
    }, 100);
  }

  initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    // Configuração de cores para o gráfico
    const colorApproved = documentStyle.getPropertyValue('--green-500') || '#22c55e';
    const colorContingency = documentStyle.getPropertyValue('--orange-500') || '#f97316';
    const colorRejected = documentStyle.getPropertyValue('--red-500') || '#ef4444';

    this.chartData = {
      labels: ['Aprovados', 'Contingência', 'Rejeitados'],
      datasets: [
        {
          data: [
            this.processingSummary.approved,
            this.processingSummary.contingency,
            this.processingSummary.rejected
          ],
          backgroundColor: [colorApproved, colorContingency, colorRejected],
          hoverBackgroundColor: [colorApproved, colorContingency, colorRejected]
        }
      ]
    };

    this.chartOptions = {
      cutout: '60%',
      plugins: {
        legend: {
          labels: {
            color: documentStyle.getPropertyValue('--text-color')
          }
        }
      }
    };
  }

  /**
   * Se inscreve no Observable retornado pelo serviço de upload.
   * Gerencia eventos de progresso de upload, resposta do servidor e download do resultado.
   * @param uploadObservable Observable do evento HTTP
   */
  private subscribeToUpload(uploadObservable: any) {

    uploadObservable.subscribe({

      next: (event: any) => {

        // Evento 1: Progresso do UPLOAD (enviando dados para o servidor)
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total);

          // Evento 2: O servidor recebeu tudo e começou a processar (ResponseHeader recebido)
        } else if (event.type === HttpEventType.ResponseHeader) {
          this.messageService.add({ severity: 'info', summary: 'Processando', detail: 'Servidor respondeu. Aguarde...' });

          // Evento 3: Progresso do DOWNLOAD (baixando a resposta processada)
          // Nota: O backend precisa suportar reporte de progresso de download, senão pulará direto para Response
        } else if (event.type === HttpEventType.DownloadProgress) {
          // Lógica opcional para progresso de download

          // Evento 4: Operação CONCLUÍDA (Response completa com body)
        } else if (event.type === HttpEventType.Response) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Download concluído!' });
          this.isUploading = false;
          this.progress = 100;

          // Captura os dados do resumo dos Headers
          const headers = event.headers;
          this.processingSummary = {
            approved: parseInt(headers.get('X-Count-Approved') || '0'),
            contingency: parseInt(headers.get('X-Count-Contingency') || '0'),
            rejected: parseInt(headers.get('X-Count-Rejected') || '0'),
            approvedValue: parseFloat(headers.get('X-Value-Approved') || '0') || 0,
            approvedIcms: parseFloat(headers.get('X-Icms-Approved') || '0') || 0,
            contingencyValue: parseFloat(headers.get('X-Value-Contingency') || '0') || 0,
            contingencyIcms: parseFloat(headers.get('X-Icms-Contingency') || '0') || 0,
            rejectedValue: parseFloat(headers.get('X-Value-Rejected') || '0') || 0,
            rejectedIcms: parseFloat(headers.get('X-Icms-Rejected') || '0') || 0
          };

          // Exibe o dialog de resumo
          this.showSummaryDialog = true;
          this.initChart(); // Inicializa o gráfico com os novos dados

          // Limpa a lista de arquivos selecionados na UI
          if (this.fileUploadComponent) {
            this.fileUploadComponent.clear();
          }

          // Inicia o download automático do arquivo recebido (Blob)
          const blobResponse = event.body;
          const url = window.URL.createObjectURL(blobResponse);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'xmls_processados.zip'; // Nome do arquivo salvo
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      },

      // Tratamento de ERRO
      error: (err: any) => {
        console.error('Erro no upload:', err);
        this.isUploading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao processar o ficheiro.' });
      }
    });
  }

  // Limpa arquivos quando o usuário troca o modo (ZIP <-> XMLs) para evitar confusão
  onModeChange(): void {
    if (this.fileUploadComponent) {
      this.fileUploadComponent.clear();
    }
    this.showFileList = false;
  }
}
