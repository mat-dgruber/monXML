import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {

  // O URL do nosso backend FastAPI
  private apiUrl = 'http://127.0.0.1:8000/processar-zip/';

  // 1. Intea o HttpClient no construtor
  constructor(private http: HttpClient) {}

    /**
   * Função para enviar o ficheiro ZIP para o backend
   * @param file O ficheiro ZIP que o usuário selecionou
   */

  uploadZip(file: File): Observable<any> {

      // 2. Usamos FormData para empacotar o ficheiro.
      // O backend (FastAPI) espera por um 'multipart/form-data'.
      const formData: FormData = new FormData();
      
      // A 'key' ('arquivo') deve ser EXATAMENTE a mesma
      // que o FastAPI espera no 'main.py':
      // async def processar_zip(arquivo: UploadFile = File(...)):
      formData.append('arquivo', file, file.name);

      // 3. Fazemos o pedido POST
      return this.http.post(this.apiUrl, formData, {
        // 4. Dizemos ao Angular para esperar um 'blob' como resposta
        // Um 'blob' é um "objeto binário", que é o nosso ficheiro ZIP de resposta.
        // Se não fizermos isto, ele vai tentar ler o ZIP como JSON e dar erro.
        responseType: 'blob' 
      });

  } 



  
}
