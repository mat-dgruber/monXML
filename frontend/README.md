# Frontend MonXML (Angular)

Interface web moderna desenvolvida em **Angular v18+** utilizando **PrimeNG** para oferecer uma experiência de usuário robusta no upload e gerenciamento de arquivos XML.

## 🚀 Tecnologias

* **Angular:** Framework SPA (Single Page Application).
* **PrimeNG:** Biblioteca de componentes UI (v21+).
* **TailwindCSS:** Utilitários CSS para estilização rápida.
* **JSZip:** Biblioteca para compactação de arquivos ZIP no navegador.

## ⚙️ Instalação e Execução Local

### Pré-requisitos

* Node.js (v18 ou superior) instalado.
* Angular CLI instalado globalmente (`npm install -g @angular/cli`).

### Passo a Passo

1. **Acesse a pasta do frontend:**

    ```bash
    cd frontend
    ```

2. **Instale as dependências:**

    ```bash
    # Use --legacy-peer-deps se houver conflitos de versão com PrimeNG
    npm install --legacy-peer-deps
    ```

3. **Execute o servidor de desenvolvimento:**

    ```bash
    ng serve
    ```

    A aplicação estará disponível em `http://localhost:4200`.

## 🐳 Executando com Docker

Você pode rodar apenas o frontend em um container Nginx:

1. **Construir a imagem:**

    ```bash
    docker build -t monxml-frontend .
    ```

2. **Rodar o container:**

    ```bash
    docker run -p 4200:80 monxml-frontend
    ```

    Acesse em `http://localhost:4200`.

## 📂 Principais Componentes

* **File Upload:** Componente personalizado (`src/app/components/file-upload`) que permite:
  * Upload de arquivo único (.zip) ou múltiplos (.xml).
  * Compactação automática de múltiplos XMLs usando JSZip antes do envio.
  * Visualização de progresso com componente **Knob**.
  * Lista de arquivos selecionados antes do processamento.

## 🖌️ Estilização

O projeto utiliza o tema **Aura** do PrimeNG com suporte a modo escuro (Dark Mode) detectado via sistema ou classe CSS. TailwindCSS é usado para layout e espaçamentos.
