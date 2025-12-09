# MonXML - Validador e Organizador de XMLs NF-e

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow) ![Angular](https://img.shields.io/badge/Frontend-Angular-red) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)

**MonXML** é uma aplicação completa (Fullstack) para automação do processamento de Notas Fiscais Eletrônicas (XML). Ela permite que usuários façam upload de arquivos, validados pelo servidor e recebidos de volta organizados em pastas (`aprovados`, `rejeitados`, `contingencia`) de acordo com o status da nota (`cStat`).

## 🏗️ Arquitetura

O projeto é dividido em dois serviços principais:

1. **Frontend (`/frontend`):**
    * Desenvolvido em **Angular** com **PrimeNG**.
    * Responsável pela interface de usuário, seleção de arquivos e compactação pré-envio.
    * Comunica-se com a API REST do backend.

2. **Backend (`/backend`):**
    * Desenvolvido em **Python (FastAPI)**.
    * Recebe arquivos ZIP, valida o conteúdo XML (usando `lxml` para performance) e reorganiza os arquivos baseados em regras de negócio.

## 🚀 Como Executar (Rápido com Docker)

A maneira mais fácil de rodar o projeto todo é usando **Docker Compose**. Isso subirá tanto o frontend quanto o backend e configurará a rede entre eles.

### Pré-requisitos

* Docker e Docker Compose instalados.

### Passos

1. Na raiz do projeto, execute:

    ```bash
    docker-compose up --build
    ```

2. Acesse a aplicação:
    * **Frontend:** [http://localhost:4200](http://localhost:4200)
    * **Backend API:** [http://localhost:8000](http://localhost:8000)
    * **Documentação API:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 🛠️ Como Executar (Manualmente)

Se preferir rodar os serviços individualmente em sua máquina:

### 1. Backend

Consulte o [README do Backend](./backend/README.md) para detalhes.
Resumo:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

Consulte o [README do Frontend](./frontend/README.md) para detalhes.
Resumo:

```bash
cd frontend
npm install --legacy-peer-deps
ng serve
```

## 📝 Funcionalidades

* **Validação de Status (cStat):** Verifica se a nota está autorizada (100) ou autorizada fora de prazo (150).
* **Separação por Tipo de Emissão:** Identifica notas emitidas em contingência.
* **Relatório de Rejeições:** Gera automaticamente um arquivo `relatorio_erros.csv` listando os motivos de cada recusa.
* **Resumo Visual:** Exibe um painel com Gráfico de Rosca (Donut Chart) e estatísticas detalhadas do lote processado.
* **Alta Performance:**
  * **Backend:** Processamento síncrono em pool de threads.
  * **Frontend:** Compressão ZIP via **Web Worker** para manter a interface fluida mesmo com milhares de arquivos.
* **Interface Rica:** Upload com drag-and-drop, visualização de progresso e feedback visual de alto contraste.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.
