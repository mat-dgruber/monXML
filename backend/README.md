# Backend

This backend is a FastAPI application that processes XML files.

## Setup

1.  **Install Python:** Make sure you have Python 3.8+ installed.
2.  **Create a virtual environment:**
    ```bash
    pip install uv
    uv venv
    ```
3.  **Activate the virtual environment:**
    -   On Windows:
        ```bash
        .venv\Scripts\activate
        ```
    -   On macOS/Linux:
        ```bash
        source .venv/bin/activate
        ```
4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the application

To run the application in development mode, use:

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.
