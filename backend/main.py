import uvicorn
import io
import zipfile
import time

from lxml import etree as ET
from typing import List


from fastapi import FastAPI, File, UploadFile, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# 1. IMPORTAR O RUN_IN_THREADPOOL
from starlette.concurrency import run_in_threadpool 

# Inicia a aplicação FastAPI
app = FastAPI(
    title="Processador de XML",
    description="API para validar cStat de XMLs e separá-los."
)

# Define as origens permitidas
origins = [
    "http://localhost:4200",
    "http://10.93.15.125:4200",
    "http://127.0.0.1:4200"
]

# Adiciona o middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# 2. TODA A LÓGICA PESADA (SÍNCRONA) VAI PARA A SUA PRÓPRIA FUNÇÃO
# -------------------------------------------------------------------
def processar_zip_sync(conteudo_zip_recebido: bytes) -> io.BytesIO:
    """
    Esta é uma função síncrona (bloqueante) que faz todo
    o trabalho pesado. O FastAPI vai executá-la numa thread pool.
    """
    
    # Criamos o ZIP de saída
    memoria_zip_saida = io.BytesIO()

    # Abrimos o ZIP de saída
    with zipfile.ZipFile(memoria_zip_saida, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        
        # Abrimos o ZIP de entrada
        try:
            with zipfile.ZipFile(io.BytesIO(conteudo_zip_recebido), 'r') as zip_in:
                
                # Itera por cada arquivo dentro do ZIP
                for nome_arquivo in zip_in.namelist():
                    
                    if not nome_arquivo.endswith('.xml'):
                        continue # Pula ficheiros que não são XML

                    # Lê o conteúdo do XML
                    conteudo_xml = zip_in.read(nome_arquivo)
                    
                    # --- Etapa 2: Validar o cStat do XML ---
                    try:
                        root = ET.fromstring(conteudo_xml)
                        
                        # --- VALIDAÇÃO 1: Encontrar o cStat ---
                        cstat_node = None
                        for node in root.iter():
                            if node.tag.endswith('cStat'):
                                cstat_node = node
                                break
                        
                        cstat_value = cstat_node.text if cstat_node is not None else None

                        # --- APLICAÇÃO DAS REGRAS ---
                        if cstat_value not in ['100', '150']:
                            zip_out.writestr(f'rejeitados/{nome_arquivo}', conteudo_xml)
                        
                        else:
                            # --- VALIDAÇÃO 2: Encontrar o tpEmis ---
                            tpemis_node = None
                            for node in root.iter():
                                if node.tag.endswith('tpEmis'):
                                    tpemis_node = node
                                    break
                            
                            tpemis_value = tpemis_node.text if tpemis_node is not None else None

                            if tpemis_value == '1':
                                zip_out.writestr(f'aprovados/{nome_arquivo}', conteudo_xml)
                            else: 
                                zip_out.writestr(f'contingencia/{nome_arquivo}', conteudo_xml)
                        
                    except ET.ParseError:
                        print(f"Erro ao analisar o XML: {nome_arquivo}")
                        zip_out.writestr(f'rejeitados/{nome_arquivo}', conteudo_xml)
                        
        except zipfile.BadZipFile:
            # O ficheiro enviado não era um ZIP válido
            print("Erro: Ficheiro não é um ZIP válido.")
            # Escrevemos um ficheiro de erro no zip de saída
            zip_out.writestr('ERRO.txt', 'O ficheiro enviado não era um ZIP válido.')

    # "Rebobina" o arquivo de memória
    memoria_zip_saida.seek(0)
    
    return memoria_zip_saida


# -------------------------------------------------------------------
# 3. O ENDPOINT VOLTA A SER 'ASYNC'
# -------------------------------------------------------------------
@app.post("/processar-zip/")
async def processar_zip(arquivo: UploadFile = File(...)):
    """
    Este endpoint ASÍNCRONO apenas recebe o ficheiro
    e delega o trabalho pesado para a thread pool.
    """
    
    start_time = time.perf_counter()

    # 4. Lemos o ficheiro de forma assíncrona (correto)
    conteudo_zip_recebido = await arquivo.read()

    # 5. Executamos a função síncrona (pesada) na thread pool
    #    Isto evita que o servidor bloqueie.
    memoria_zip_saida = await run_in_threadpool(processar_zip_sync, conteudo_zip_recebido)
    
    end_time = time.perf_counter()
    duration = end_time - start_time

    print(f"Processamento do ficheiro '{arquivo.filename}' concluído em {duration:.2f} segundos.")


    # --- Devolver o novo ZIP para o usuário ---
    return Response(
        content=memoria_zip_saida.getvalue(), # <-- .getvalue() obtém os bytes do BytesIO
        media_type="application/x-zip-compressed",
        headers={
            "Content-Disposition": "attachment; filename=xmls_processados.zip"
        }
    )



"""""
# === ENDPOINT PARA VÁRIOS XMLS ===
@app.post("/processar-xmls/")
def processar_xmls(arquivos: List[UploadFile] = File(...)):
    ""
    Este endpoint recebe UMA LISTA de ficheiros XML, processa-os
    e devolve um ZIP com o resultado.
    ""
    # As listas são as mesmas
    aprovados = []
    rejeitados = []
    contingencia = []

    # --- Etapa 1: Ler a LISTA de ficheiros ---
    # Em vez de ler um ZIP, iteramos a lista de 'UploadFile'
    
    for arquivo in arquivos:
        
        # Garante que estamos a processar apenas arquivos XML
        if arquivo.filename and arquivo.filename.endswith('.xml'):
            # Lê o conteúdo do XML
            conteudo_xml = arquivo.read()
            nome_arquivo = arquivo.filename # Guardamos o nome
            
            # --- Etapa 2: Validar o XML (Lógica IDÊNTICA) ---
            # (Esta lógica é copiada exatamente do 'processar_zip')
            try:
                # Analisa o conteúdo XML
                root = ET.fromstring(conteudo_xml)
                
                # --- VALIDAÇÃO 1: Encontrar o cStat ---
                cstat_node = None
                for node in root.iter():
                    if node.tag.endswith('cStat'):
                        cstat_node = node
                        break
                cstat_value = cstat_node.text if cstat_node is not None else None

                # --- APLICAÇÃO DAS REGRAS ---
                
                # REGRA 1: REJEITADOS
                if cstat_value not in ['100', '150']:
                    rejeitados.append((nome_arquivo, conteudo_xml))
                
                # Se o cStat for 100 ou 150...
                else:
                    # --- VALIDAÇÃO 2: Encontrar o tpEmis ---
                    tpemis_node = None
                    for node in root.iter():
                        if node.tag.endswith('tpEmis'):
                            tpemis_node = node
                            break
                    tpemis_value = tpemis_node.text if tpemis_node is not None else None

                    # REGRA 2: APROVADOS (Normais)
                    if tpemis_value == '1':
                        aprovados.append((nome_arquivo, conteudo_xml))
                    
                    # REGRA 3: CONTINGÊNCIA
                    else:
                        contingencia.append((nome_arquivo, conteudo_xml))

            except ET.ParseError:
                # Se o XML estiver corrompido ou for inválido
                print(f"Erro ao analisar o XML: {nome_arquivo}")
                rejeitados.append((nome_arquivo, conteudo_xml))


    # --- Etapa 3: Criar o novo ZIP de resposta (IDÊNTICA) ---
    
    memoria_zip_saida = io.BytesIO()
    with zipfile.ZipFile(memoria_zip_saida, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        
        for nome_arquivo, conteudo in aprovados:
            zip_out.writestr(f'aprovados/{nome_arquivo}', conteudo)
            
        for nome_arquivo, conteudo in contingencia:
            zip_out.writestr(f'contingencia/{nome_arquivo}', conteudo)
            
        for nome_arquivo, conteudo in rejeitados:
            zip_out.writestr(f'rejeitados/{nome_arquivo}', conteudo)

    memoria_zip_saida.seek(0)

    # --- Etapa 4: Devolver o novo ZIP para o usuário (IDÊNTICA) ---
    
    return StreamingResponse(
        memoria_zip_saida,
        media_type="application/x-zip-compressed",
        headers={
            "Content-Disposition": "attachment; filename=xmls_processados.zip"
        }
    )

"""

# Bloco para correr o servidor
if __name__ == "__main__":
    # O 'host="0.0.0.0"' diz ao Uvicorn para aceitar ligações
    # de qualquer IP na rede, não apenas de localhost.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)