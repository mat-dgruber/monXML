# ⚙️ Backend MonXML

![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi&logoColor=white)
![Manager](https://img.shields.io/badge/Package_Manager-UV-purple?style=flat-square)

API de alta performance para processamento e validação de documentos fiscais eletrônicos (NF-e). Construída sobre o ecossistema moderno do Python.

## ⚡ Features Técnicas

- **Async Core:** Baseado em ASGI para alta concorrência.
- **High Performance XML:** Uso de `lxml` para parsing C-speed.
- **Smart Validation:** Regras de negócio SEFAZ integradas.
- **Zero-Disk I/O:** Processamento 100% em memória RAM.

## 🛠️ Instalação & Setup

### Pré-requisitos
- Python 3.13+
- UV (Opcional, mas recomendado)

### Executando Localmente

1.  **Navegue até o diretório:**
    ```bash
    cd backend
    ```

2.  **Instale as dependências:**
    ```bash
    # Via pip padrão
    pip install -r requirements.txt
    
    # OU via UV (Moderno)
    uv sync
    ```

3.  **Execute o servidor:**
    ```bash
    # Modo Desenvolvimento
    uv run main.py
    
    # OU
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

    > O servidor iniciará em `http://localhost:8000`

## 🐳 Docker

```bash
# Build
docker build -t monxml-backend .

# Run
docker run -p 8000:8000 monxml-backend
```

## 🧩 Detalhes de Implementação

> [!NOTE]
> **Processamento Assíncrono:** O endpoint principal `/processar-zip/` utiliza `run_in_threadpool` para evitar o bloqueio do Event Loop durante o processamento CPU-intensive do ZIP e XML.

> [!IMPORTANT]
> **Flattening:** A saída do processamento resulta sempre em um ZIP com estrutura "achatada", removendo subpastas para facilitar o acesso aos arquivos.
