import uvicorn
import io  # Para lidar com arquivos na memória
import zipfile  # Para ler e escrever arquivos ZIP
import xml.etree.ElementTree as ET  # Para analisar (parse) XML

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse  # Para devolver um arquivo para download
from fastapi.middleware.cors import CORSMiddleware



# 1. Inicia a aplicação FastAPI
app = FastAPI(
    title="Processador de XML",
    description="API para validar cStat de XMLs e separá-los."
)


# Define as origens permitidas
origins = [
     "http://localhost:4200"
]

# Adiciona o middleware CORS
# Isto diz ao FastAPI: "Permite ligações que venham de 'origins'"
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,         # Quais domínios podem ligar-se
    allow_credentials=True,        # Permite cookies (não usamos, mas é boa prática)
    allow_methods=["*"],           # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],           # Permite todos os cabeçalhos
)




@app.post("/processar-zip/")
async def processar_zip(arquivo: UploadFile = File(...)):
    """
    Este endpoint recebe UM arquivo ZIP, processa-o (ainda por implementar)
    e devolve o resultado.
    """
    
    # Listas para guardar os arquivos processados
    # Vamos guardar (nome_do_arquivo, conteudo_do_arquivo)
    aprovados = []
    rejeitados = []
    contingencia = []

    # Lê o conteúdo do arquivo ZIP que o usuário enviou
    conteudo_zip_recebido = await arquivo.read()

    # --- Etapa 1: Ler o ZIP recebido ---
    
    # Abre o ZIP na memória (usando io.BytesIO)
    with zipfile.ZipFile(io.BytesIO(conteudo_zip_recebido), 'r') as zip_in:
        
        # Itera por cada arquivo dentro do ZIP
        for nome_arquivo in zip_in.namelist():
            
            # Garante que estamos a processar apenas arquivos XML
            if nome_arquivo.endswith('.xml'):
                # Lê o conteúdo do XML
                conteudo_xml = zip_in.read(nome_arquivo)
                
                # --- Etapa 2: Validar o cStat do XML ---
                try:
                    # Analisa o conteúdo XML
                    root = ET.fromstring(conteudo_xml)
                    
                    # --- VALIDAÇÃO 1: Encontrar o cStat ---
                    # (Como explicaste, ele fica dentro do <prot...> -> <infProt>)
                    cstat_node = None
                    for node in root.iter():
                        if node.tag.endswith('cStat'):
                            cstat_node = node
                            break # Encontrámos o que queríamos
                        
                    cstas_value = cstat_node.text if cstat_node is not None else None

                    # --- APLICAÇÃO DAS REGRAS ---
                    
                    # REGRA 1: REJEITADOS
                    # Se cStat não for 100 (Autorizado) ou 150 (Autorizado fora de prazo - comum em NFC-e)

                    if cstas_value not in ['100', '150']:
                        rejeitados.append((nome_arquivo, conteudo_xml))

                    # Se o cStat for 100 ou 150, verificamos a contingência
                    else:
                        # --- VALIDAÇÃO 2: Encontrar o tpEmis ---
                        # (Como explicaste, ele fica dentro do <NFe/NFCe> -> <infNFe> -> <ide>)
                        tpemis_node = None
                        for node in root.iter():
                            if node.tag.endswith('tpEmis'):
                                tpemis_node = node
                                break # Encontramos
                            
                    tpemis_value = tpemis_node.text if tpemis_node is not None else None

                    # REGRA 2: APROVADOS (Normais)
                    if tpemis_value == '1':
                        aprovados.append((nome_arquivo, conteudo_xml))

                    # REGRA 3: CONTINGÊNCIA 
                    # Se tpEmis for '9', '6', '7', etc. (qualuqer coisa != '1')
                    else: 
                        contingencia.append((nome_arquivo, conteudo_xml))
                        
                    
                except ET.ParseError:
                    # Se o XML estiver corrompido ou for inválido
                    print(f"Erro ao analisar o XML: {nome_arquivo}")
                    rejeitados.append((nome_arquivo, conteudo_xml))


    # --- Etapa 3: Criar o novo ZIP de resposta ---
    
    # Cria um "arquivo" em memória para o novo ZIP
    memoria_zip_saida = io.BytesIO()

    # Abre o "arquivo" em modo de escrita ('w')
    with zipfile.ZipFile(memoria_zip_saida, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        
        # Adiciona os arquivos aprovados
        for nome_arquivo, conteudo in aprovados:
            # Escreve o arquivo dentro da pasta 'aprovados/'
            zip_out.writestr(f'aprovados/{nome_arquivo}', conteudo)
            
     
        # Adiciona os arquivos em contingência 
        for nome_arquivo, conteudo in contingencia:
            zip_out.writestr(f'contingencia/{nome_arquivo}', conteudo)

            
        # Adiciona os arquivos rejeitados
        for nome_arquivo, conteudo in rejeitados:
            # Escreve o arquivo dentro da pasta 'rejeitados/'
            zip_out.writestr(f'rejeitados/{nome_arquivo}', conteudo)

    # "Rebobina" o arquivo de memória para o início, para que a resposta o possa ler
    memoria_zip_saida.seek(0)

    # --- Etapa 4: Devolver o novo ZIP para o usuário ---
    
    return StreamingResponse(
        memoria_zip_saida, # O conteúdo do nosso ZIP em memória
        media_type="application/x-zip-compressed", # O tipo de arquivo
        headers={
            "Content-Disposition": "attachment; filename=xmls_processados.zip"
        } # Diz ao navegador para fazer download com este nome
    )


# Bloco para correr o servidor
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)