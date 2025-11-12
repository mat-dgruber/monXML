// src/app/components/file-upload/file-upload.component.ts

import { Component, inject } from '@angular/core';
import { FileUploadService } from '../../services/file-upload';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';


// 1. Importar o JSZip
import JSZip from 'jszip'; 

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css'
})
export class FileUpload {

  uploadMode: 'zip' | 'xmls' = 'zip';
  selectedFiles: FileList | null = null;
  isUploading: boolean = false;
  uploadMessage: string = '';

  private fileUploadService = inject(FileUploadService);

  onFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    
    if (fileList.length > 0) {
      this.selectedFiles = fileList;
      this.uploadMessage = ''; 
    } else {
      this.selectedFiles = null;
    }
  }

  // A LÓGICA PRINCIPAL VAI MUDAR AQUI
  onUpload(): void {
    if (this.selectedFiles && this.selectedFiles.length > 0 && !this.isUploading) {
      
      this.isUploading = true;
      this.uploadMessage = 'A processar...';

      const fileToSend = this.selectedFiles[0];
      

      // --- MODO ZIP ---
      if (this.uploadMode === 'zip') {
        const zipFile = this.selectedFiles[0];
        this.subscribeToUpload(this.fileUploadService.uploadZip(zipFile));
      
      // --- MODO XMLS (Com JSZip) ---
      } else {
        this.uploadMessage = 'A comprimir ficheiros...';
        const zip = new JSZip();
        for (let i = 0; i < this.selectedFiles.length; i++) {
          zip.file(this.selectedFiles[i].name, this.selectedFiles[i]);
        }
        zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
          const zipFile = new File([zipBlob], "xmls_do_navegador.zip", { type: "application/zip" });
          this.uploadMessage = 'A enviar pacote...';
          this.subscribeToUpload(this.fileUploadService.uploadZip(zipFile));
        });
      }
    }
  }

  // 2. CRIAMOS UMA FUNÇÃO SEPARADA PARA O SUBSCRIBE
  private subscribeToUpload(uploadObservable: any) {
    
    uploadObservable.subscribe({
      
      // 'next' agora é chamado VÁRIAS VEZES
      next: (event: any) => {
        
        // Evento 1: Progresso do UPLOAD
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / event.total);
          this.uploadMessage = `A enviar... ${progress}%`;
        
        // Evento 2: O servidor respondeu (mas o download AINDA NÃO COMEÇOU)
        } else if (event.type === HttpEventType.ResponseHeader) {
          this.uploadMessage = 'Servidor respondeu. A processar...';
          // É aqui que os teus 3.17s estão a decorrer
        
        // Evento 3: Progresso do DOWNLOAD
        } else if (event.type === HttpEventType.DownloadProgress) {
          const progress = Math.round(100 * event.loaded / event.total);
          this.uploadMessage = `A baixar resultado... ${progress}%`;
        
        // Evento 4: DOWNLOAD CONCLUÍDO!
        } else if (event.type === HttpEventType.Response) {
          this.uploadMessage = 'Download concluído!';
          this.isUploading = false;
          
          // A lógica de download (agora 'event.body' em vez de 'blobResponse')
          const blobResponse = event.body;
          const url = window.URL.createObjectURL(blobResponse);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'xmls_processados.zip';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      },
      
      // ERRO
      error: (err: any) => {
        console.error('Erro no upload:', err);
        this.isUploading = false;
        this.uploadMessage = 'Erro ao processar o ficheiro.';
      }
    });
  }

  onModeChange(): void {
    this.selectedFiles = null;
    this.uploadMessage = '';
  }
}