// src/app/services/file-upload.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private zipApiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Função para enviar UM ficheiro ZIP
   */
  uploadZip(file: File): Observable<HttpEvent<Blob>> {
    const formData: FormData = new FormData();
    // A key é 'arquivo' (singular)
    formData.append('arquivo', file, file.name);

    console.log('Uploading ZIP to:', this.zipApiUrl);
    return this.http.post(this.zipApiUrl, formData, {
      reportProgress: true,     // <-- Pedir progresso (Upload E Download)
      observe: 'events',        // <-- Ouvir todos os eventos, não só a resposta final
      responseType: 'blob'      // <-- A resposta final ainda é um blob
    });
  }

  /**
   * NOVA FUNÇÃO: Enviar MÚLTIPLOS ficheiros XML

  uploadXmls(files: FileList): Observable<any> {
    const formData: FormData = new FormData();

    // O backend (FastAPI) espera uma lista de 'arquivos'
    // Temos de iterar a FileList e adicionar cada ficheiro
    // ao FormData com a *mesma key* ('arquivos').
    for (let i = 0; i < files.length; i++) {
      formData.append('arquivos', files[i], files[i].name);
    }

    // Chamamos o novo endpoint
    return this.http.post(this.xmlApiUrl, formData, {
      responseType: 'blob'
    });
  }
    */
}
