import requests

# 1. O URL do nosso endpoint
url = "http://127.0.0.1:8000/processar-zip/"

# 2. O nome do arquivo ZIP que queremos enviar
# (Muda isto se o teu arquivo de teste tiver outro nome)
nome_arquivo_teste = "xml.zip"

# 3. O nome que queremos dar ao arquivo de resposta
nome_arquivo_saida = "xmls_processados_pelo_teste.zip"

print(f"A tentar enviar o arquivo '{nome_arquivo_teste}' para {url}...")

try:
    # 4. Abre o arquivo de teste em modo 'leitura binária' (rb)
    with open(nome_arquivo_teste, 'rb') as f:
        
        # 5. Prepara os arquivos para o formato 'multipart/form-data'
        # O 'arquivo' é o nome do parâmetro que o FastAPI espera (arquivo: UploadFile)
        files = {
            'arquivo': (nome_arquivo_teste, f, 'application/zip')
        }
        
        # 6. Faz o pedido POST!
        response = requests.post(url, files=files)

        # 7. Verifica se a resposta foi SUCESSO (200 OK)
        if response.status_code == 200:
            print("Sucesso! Resposta 200 OK recebida.")
            
            # 8. Pega no conteúdo da resposta (o nosso ZIP) e guarda-o
            with open(nome_arquivo_saida, 'wb') as f_out:
                f_out.write(response.content)
            
            print(f"Arquivo de resposta salvo como: '{nome_arquivo_saida}'")
            print("Verifica se este arquivo ZIP contém as pastas 'aprovados' e 'rejeitados'!")
            
        else:
            print(f"Erro! O servidor respondeu com o código: {response.status_code}")
            print(f"Resposta: {response.text}")

except FileNotFoundError:
    print(f"Erro: O arquivo de teste '{nome_arquivo_teste}' não foi encontrado.")
except requests.exceptions.ConnectionError:
    print("Erro: Não foi possível conectar ao servidor.")
    print("Verifica se o 'main.py' está a correr em http://127.0.0.1:8000")