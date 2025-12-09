# Use uma imagem Python oficial leve
FROM python:3.13-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências
COPY requirements.txt .

# Instala as dependências
# --no-cache-dir mantém a imagem menor
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Expõe a porta que o FastAPI usa
EXPOSE 8000

# Comando para iniciar a aplicação
# --host 0.0.0.0 permite acesso externo ao container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
