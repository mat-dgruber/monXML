// src/app/components/file-upload/file-upload.component.ts

import { Component, inject } from '@angular/core';
import { FileUploadService } from '../../services/file-upload';
import { FormsModule } from '@angular/forms';

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

      if (this.uploadMode === 'zip' && this.selectedFiles instanceof FileList) {
        
        // --- MODO ZIP (Continua igual) ---
        const zipFile = this.selectedFiles[0];
        this.fileUploadService.uploadZip(zipFile).subscribe(this.handleResponse());
        
      } else {
        
        // --- MODO XMLS (A NOVA LÓGICA) ---
        this.uploadMessage = 'A comprimir ficheiros no navegador...';
        
        // 2. Criar um novo ZIP na memória
        const zip = new JSZip();
        for (let i = 0; i < this.selectedFiles.length; i++) {
          const file = this.selectedFiles[i];
          // 3. Adicionar cada XML ao ZIP
          zip.file(file.name, file); 
        }

        // 4. Gerar o ZIP como um 'blob' (binário)
        zip.generateAsync({ type: 'blob' })
          .then((zipBlob: Blob) => {
            
            this.uploadMessage = 'A enviar pacote...';
            
            // 5. Criar um "File" virtual para o nosso serviço
            const zipFile = new File([zipBlob], "xmls_do_navegador.zip", {
              type: "application/zip",
            });

            // 6. ENVIAR PARA O ENDPOINT DE ZIP!
            this.fileUploadService.uploadZip(zipFile).subscribe(this.handleResponse());

          })
          .catch((err: any) => {
            this.isUploading = false;
            this.uploadMessage = 'Erro ao criar o ZIP no navegador.';
            console.error(err);
          });
      }
    }
  }

  // O nosso 'handleResponse' (sem alterações)
  private handleResponse() {
    return {
      next: (blobResponse: any) => {
        this.isUploading = false;
        this.uploadMessage = 'Processamento concluído! A iniciar download.';
        const url = window.URL.createObjectURL(blobResponse);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'xmls_processados.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Erro no upload:', err);
        this.isUploading = false;
        this.uploadMessage = 'Erro ao processar o ficheiro. Tente novamente.';
      }
    };
  }

  onModeChange(): void {
    this.selectedFiles = null;
    this.uploadMessage = '';
  }
}