# 🏗️ Architecture & Design

![Architecture](https://img.shields.io/badge/Architecture-REST-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

## 🔭 Visão Geral

O **monXML** foi projetado com foco em **desacoplamento**, **performance** e **usabilidade**. A arquitetura segue o modelo REST Clean, garantindo que o frontend seja apenas uma camada de apresentação e o backend concentre toda a regra de negócio pesada, mantendo o estado (stateless) para scalabilidade.

---

## 💻 Tech Stack

### 🎨 Frontend (Client-Side)
- **Core:** Angular 20+ (Standalone Components)
- **UI Toolkit:** PrimeNG 21+ (Lara Theme)
- **Styling:** Tailwind CSS 3.4+
- **Reactivity:** Signals & RxJS
- **Features:** Client-side ZIP compression (`JSZip`), Smart Upload.

### ⚙️ Backend (Server-Side)
- **Core:** Python 3.14
- **Framework:** FastAPI (ASGI)
- **Package Manager:** UV
- **Performance:** `lxml` (C-based XML parsing), `asyncio` para I/O, `ThreadPool` para CPU-bound tasks.
- **Database:** Stateless (InMemory Processing) / Firestore (Planned).

---

## 🔄 Fluxo de Dados

```mermaid
graph LR
    User([👤 Usuário]) -->|Upload ZIP/XML| Angular
    
    subgraph Client [🖥️ Frontend Angular]
        Angular[File Upload UI]
        Compress[JSZip Compression]
    end
    
    Angular --> Compress
    Compress -->|POST /processar-zip| API
    
    subgraph Server [⚙️ Backend Python]
        API[FastAPI Endpoint]
        Worker[Worker Thread]
        Logic[XML Validator (lxml)]
        Flatten[Path Flattener]
        Builder[ZIP Builder]
        
        API -->|Dispatch| Worker
        Worker --> Logic
        Logic -->|Extract Data| Flatten
        Flatten -->|Categorize| Builder
    end
    
    Builder -->|Stream Bytes| API
    API -->|Download Blob| User
```

## 📂 Organização do Repositório

- `/backend`: API e Regras de Negócio.
- `/frontend`: Aplicação Web.
- `/backend_php`: Legado (Descontinuado).

## 🧠 Decisões Técnicas Chaves

1.  **In-Memory Processing:**
    > O backend manipula arquivos ZIP inteiramente em memória (`io.BytesIO`) para eliminar a latência de I/O de disco, resultando em processamento extremamente rápido.

2.  **Validação via `cStat` & `tpEmis`:**
    > A lógica de categorização é estritamente baseada nos padrões da SEFAZ, garantindo confiabilidade fiscal.

3.  **Achatamento de Diretórios (Flattening):**
    > **Estratégia UX:** Ao processar um ZIP, o sistema intencionalmente descarta a estrutura de pastas original. Todos os arquivos são entregues "achatados" nas pastas de destino (`aprovados`, `rejeitados`, `contingencia`), facilitando a conferência visual pelo usuário final.
