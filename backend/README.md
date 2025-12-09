# Backend MonXML (FastAPI)

API desenvolvida em Python com **FastAPI** para processar, validar e organizar arquivos XML de Notas Fiscais Eletrônicas (NF-e). A aplicação é capaz de processar arquivos ZIP contendo múltiplos XMLs ou receber listas de arquivos diretamente.

## 🚀 Tecnologias

* **Python 3.13+**
* **FastAPI:** Framework web moderno e rápido.
* **Uvicorn:** Servidor ASGI para produção.
* **lxml:** Biblioteca de processamento XML de alta performance.
* **Starlette:** Ferramentais assíncronos (usado para `run_in_threadpool`).

## ⚙️ Instalação e Execução Local

### Pré-requisitos

* Python 3.13 ou superior instalado.

### Passo a Passo

1. **Acesse a pasta do backend:**

    ```bash
    cd backend
    ```

2. **Crie um ambiente virtual (recomendado):**

    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # Linux/Mac:
    source .venv/bin/activate
    ```

3. **Instale as dependências:**

    ```bash
    pip install -r requirements.txt
    ```

4. **Execute o servidor:**

    ```bash
    # Importante: execute a partir da pasta 'backend'
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

    O servidor estará rodando em `http://localhost:8000`.
    A documentação interativa (Swagger UI) está disponível em `http://localhost:8000/docs`.

## 🐳 Executando com Docker

Se preferir não instalar o Python localmente, use o Docker:

1. **Construir a imagem:**

    ```bash
    docker build -t monxml-backend .
    ```

2. **Rodar o container:**

    ```bash
    docker run -p 8000:8000 monxml-backend
    ```

## 📂 Estrutura do Projeto

* `main.py`: Arquivo principal contendo a aplicação, rotas e lógica de validação.
* `requirements.txt`: Lista de dependências do projeto.
* `Dockerfile`: Configuração para containerização.

## 🛠️ Detalhes da Implementação

* **Processamento Síncrono vs Assíncrono:** O endpoint `/processar-zip/` é assíncrono (`async`) para lidar com I/O de rede eficientemente, mas delega o processamento pesado de XML e ZIP para uma thread separada (`run_in_threadpool`) para não bloquear o servidor.
* **Validação XML:** Utiliza `lxml` para verificar as tags `cStat` (Status da Nota) e `tpEmis` (Tipo de Emissão) para categorizar os arquivos em pastas: `aprovados`, `rejeitados` ou `contingencia`.
