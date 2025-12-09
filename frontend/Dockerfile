# Estágio 1: Build da aplicação Angular
FROM node:20 as build

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências (incluindo devDependencies para o build)
# Usando --legacy-peer-deps devido a conflitos de versão do PrimeNG v21
RUN npm install --legacy-peer-deps

# Copia o código fonte
COPY . .

# Executa o build de produção
RUN npm run build -- --configuration production

# Estágio 2: Servidor Nginx para servir os arquivos estáticos
FROM nginx:alpine

# Copia os arquivos compilados do estágio anterior
# O caminho exato depende do "outputPath" no angular.json, geralmente dist/frontend ou dist/nome-do-projeto
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copia configuração customizada do Nginx se necessário (opcional, aqui usamos o default)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
