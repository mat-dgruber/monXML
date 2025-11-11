import { Component } from '@angular/core';
import { FileUploadService } from '../../services/file-upload';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUpload {

  // A nossa variável de estado principal
  uploadMode: "zip" | "xmls" = "zip" // Começa em modo ZIP
  // Variavel para guardar o ficheiro selecionado
  selectedFiles: FileList | null = null;
  isUploading: boolean = false; // Feedback visual
  uploadMessage: string = ''; // Para mensagem de erro ou sucesso
 
  // Injetando o serviço no construtor
  constructor(private fileUploadService: FileUploadService) { }

    /**
    * Esta função é chamada QUANDO o usuário seleciona um ficheiro
    * no <input type="file">.
    */
   onFileSelected(event: any): void {
    const fileList: FileList = event.target.files;

    if (fileList.length > 0) {
      this.selectedFiles = fileList;
      this.uploadMessage = '';
    } else {
      this.selectedFiles = null;
    }
   }

    /**
    * Esta função é chamada QUANDO o usuário clica no botão "Processar".
    */
   onUpload(): void {
    if (this.selectedFiles && this.selectedFiles.length > 0 && !this.isUploading) {      
      this.isUploading = true
      this.uploadMessage = "Processando..."

      if (this.uploadMode === 'zip') {
        
        // --- MODO ZIP ---
        const zipFile = this.selectedFiles[0]; // Apanha o primeiro (e único) ficheiro
        this.fileUploadService.uploadZip(zipFile).subscribe(this.handleResponse());
        
      } else {
        
        // --- MODO XMLs ---
        this.fileUploadService.uploadXmls(this.selectedFiles).subscribe(this.handleResponse());
      }
      
    } else {
      console.warn('Nenhum ficheiro selecionado ou upload já em progresso.');
    }
  }

  /**
   * 7. (Refatoração) Criei um "manipulador" de resposta 
   * para evitar repetir código (DRY - Don't Repeat Yourself)
   */
  private handleResponse() {
    return {
      // SUCESSO
      next: (blobResponse: any) => {
        this.isUploading = false;
        this.uploadMessage = 'Processamento concluído! A iniciar download.';
          // o DOWNLOAD

          //cria uma url temporaria na memoria do navegador para o ficheiro
          const url = window.URL.createObjectURL(blobResponse);
          // Cria um elemente de link invisivel <a>
          const link = document.createElement('a');
          link.href = url;

          // Nome do ficheiro
          link.download = "xml_processadors.zip";

          // adiciona o link ao corpo da pagina (necessaário no firefox)
          document.body.appendChild(link);

          // Simula um clique no link para inicar o download
          link.click();

          // Limpa o link e o url temporario
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

        },

        // ERRO: erro no backend
        error: (err: any) => {
          console.error("Erro no backend:", err);
          this.isUploading = false
          this.uploadMessage = "Erro ao processar ficheiro. Tente novamente."
        }
        
      };
   }

  /**
   * 8. Função para limpar os ficheiros quando o modo muda
   */
  onModeChange(): void {
    this.selectedFiles = null;
    this.uploadMessage = '';
  }
}
