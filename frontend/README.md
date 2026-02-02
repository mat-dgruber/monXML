# 🖥️ Frontend MonXML

![Angular](https://img.shields.io/badge/Angular-v20+-DD0031?style=flat-square&logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-v21+-blue?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

Interface moderna e responsiva para interação com o sistema MonXML. Focada em UX, feedback visual e performance.

## ✨ Destaques de UX/UI

- **Upload Drag & Drop:** Suporte a arquivos individuais e ZIPs.
- **Feedback em Tempo Real:** Indicadores visuais de progresso e processamento.
- **Dark Mode:** Tema inteligente que se adapta à preferência do sistema.
- **Client-Side ZIP:** Compactação de múltiplos arquivos no navegador antes do envio.

## 🚀 Como Rodar

### Pré-requisitos
- Node.js v18+
- Angular CLI

### Desenvolvimento Local

1.  **Instale as dependências:**
    ```bash
    cd frontend
    npm install --legacy-peer-deps
    ```

2.  **Inicie o servidor:**
    ```bash
    ng serve
    ```
    
    > Acesse em `http://localhost:4200`

## 🐳 Docker

```bash
# Build
docker build -t monxml-frontend .

# Run (Nginx)
docker run -p 4200:80 monxml-frontend
```

## 🧩 Componentes Chave

- `file-upload`: Gerencia a seleção, validação e envio de arquivos.
- `danfe-modal`: Exibição de detalhes da nota (em desenvolvimento).

> [!NOTE]
> **Observação:** O download retornado pelo backend virá em formato ZIP com estrutura de pastas simplificada (flattened).
