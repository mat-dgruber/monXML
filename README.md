<div align="center">

# 📑 MonXML

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Solução Premium para Processamento e Organização de NF-e**

</div>

---

**MonXML** é uma plataforma moderna e de alta performance projetada para simplificar a validação e organização de arquivos XML de Notas Fiscais Eletrônicas. Combinando um frontend fluido em **Angular** com um backend robusto em **FastAPI**, o sistema processa grandes volumes de arquivos com eficiência e precisão.

## 🚀 Funcionalidades Principais

- 📦 **Processamento em Lote (Batch):** Upload de arquivos ZIP contendo centenas de XMLs.
- ✅ **Validação Inteligente:** Classificação automática baseada no status (`cStat`) da nota:
    - 🟢 **Aprovados**
    - 🔴 **Rejeitados**
    - 🟠 **Contingência**
- 📂 **Smart Flattening:** O sistema ignora hierarquias complexas e entrega um ZIP limpo e organizado.
- 📊 **Relatórios Detalhados:** Exportação automática de CSV com análise de erros e totais financeiros.
- 🎨 **Interface Moderna:** Experiência de usuário refinada com **PrimeNG** e **TailwindCSS**.

## 📦 Estrutura do Ecossistema

| Módulo | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **[Frontend](./frontend/README.md)** | ![Angular](https://img.shields.io/badge/-Angular_20+-DD0031?logo=angular&logoColor=white) | Interface Single-Page Application (SPA). |
| **[Backend](./backend/README.md)** | ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) | API REST para processamento assíncrono. |
| **[Legado](./backend_php)** | ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white) | Versão descontinuada (Referência). |

## 🛠️ Quick Start (Docker Compose)

A maneira mais ágil de iniciar o projeto é através do Docker Compose.

1.  **Clone o projeto:**
    ```bash
    git clone https://github.com/mat-dgruber/monXML.git
    cd monXML
    ```

2.  **Inicie os serviços:**
    ```bash
    docker-compose up --build
    ```

3.  **Acesse:**
    - 🖥️ **Frontend:** [http://localhost:4200](http://localhost:4200)
    - 🔌 **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 🏗️ Arquitetura

Para uma visão detalhada das decisões técnicas, fluxos de dados e diagramas, consulte nossa documentação de arquitetura:

> [!TIP]
> **[👉 Ver Documentação de Arquitetura](./ARCHITECTURE.md)**

## 📝 Licença

Developed by **Matheus Diniz** for internal use.
All rights reserved.
