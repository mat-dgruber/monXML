import { Component } from '@angular/core';
import { FileUploadService } from '../../services/file-upload';


@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUpload {

  // 1. Variavel para guardar o ficheiro selecionado
  selectedFile: File | null = null;
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
      this.selectedFile = fileList[0];
      this.uploadMessage = '';
    } else {
      this.selectedFile = null;
      this.uploadMessage = '';
    }
   }

    /**
    * Esta função é chamada QUANDO o usuário clica no botão "Processar".
    */
   onUpload(): void {
    if (this.selectedFile && !this.isUploading) {
      
      this.isUploading = true
      this.uploadMessage = "Processando..."


      //chamando o serviço
      this.fileUploadService.uploadZip(this.selectedFile).subscribe({

        // Sucesso: backend devolveu um BLOB (o ZIP)
        next: (blobResponse) => {
          console.log("Backend respondeu com sucesso.")
          this.isUploading = false
          this.uploadMessage = "Processamento concluido! Iniciando download..."

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
        error: (err) => {
          console.error("Erro no backend:", err);
          this.isUploading = false
          this.uploadMessage = "Erro ao processar ficheiro. Tente novamente."
        }

      })

    } else {
      console.warn("Nenhum ficheiro selecionado para o upload")
    }
   }

}
