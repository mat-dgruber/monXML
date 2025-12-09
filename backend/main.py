import uvicorn
import io
import zipfile
import csv
import time

# Importamos 'etree' do lxml para parsing de XML de alta performance
from lxml import etree as ET
from typing import List

from fastapi import FastAPI, File, UploadFile, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Importamos 'run_in_threadpool' para executar tarefas CPU-bound (síncronas) sem bloquear o Event Loop assíncrono do FastAPI
from starlette.concurrency import run_in_threadpool 

# Inicia a aplicação FastAPI
# metadados servem para a documentação automática (Swagger UI em /docs)
app = FastAPI(
    title="Processador de XML (MonXML)",
    description="API especializada em validação de cStat e separação de XMLs de NF-e.",
    version="1.0.0"
)

# Configuração de CORS (Cross-Origin Resource Sharing)
# Define quem pode acessar esta API. Importante configurar corretamente para produção.
origins = [
    "http://localhost:4200",      # Angular local
    "http://10.93.15.125:4200",   # Acesso via IP da rede
    "http://127.0.0.1:4200",       # Localhost IP
    "http://10.93.15.125:54580",   # Acesso via IP da rede
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # Lista de origens permitidas
    allow_credentials=True,   # Permitir cookies/credenciais
    allow_methods=["*"],      # Permitir todos os métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],      # Permitir todos os headers
    expose_headers=["X-Count-Approved", "X-Count-Contingency", "X-Count-Rejected"] # Importante!
)


# -------------------------------------------------------------------
# LÓGICA DE PROCESSAMENTO (SÍNCRONA / CPU-BOUND)
# -------------------------------------------------------------------
def processar_zip_sync(conteudo_zip_recebido: bytes) -> io.BytesIO:
    """
    Função síncrona que processa o arquivo ZIP recebido.
    
    MOTIVO DE SER SÍNCRONA:
    O processamento de arquivos ZIP e parsing de XML são tarefas intensivas em CPU (CPU-bound).
    Em Python, código síncrono CPU-bound bloqueia o Event Loop do asyncio.
    Para evitar travar o servidor, isolamos esta lógica nesta função e a chamamos via 'run_in_threadpool'.
    
    Args:
        conteudo_zip_recebido (bytes): O conteúdo binário do arquivo ZIP enviado pelo usuário.
        
    Returns:
        io.BytesIO: Um objeto em memória contendo o novo arquivo ZIP processado.
    """
    
    # Lógica de tracking para relatório e resumo
    # Listas para guardar tuplas (nome_arquivo, cstat, xmotivo)
    lista_detalhes_rejeicao = []
    
    # Contadores
    stats = {
        "aprovados": 0,
        "contingencia": 0,
        "rejeitados": 0
    }

    # Criamos um buffer em memória para o ZIP de saída (evita gravar em disco = + performance)
    memoria_zip_saida = io.BytesIO()

    # Abrimos o ZIP de saída em modo de escrita ('w') com compressão DEFLATED
    with zipfile.ZipFile(memoria_zip_saida, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        
        # Abrimos o ZIP de entrada a partir dos bytes recebidos
        try:
            with zipfile.ZipFile(io.BytesIO(conteudo_zip_recebido), 'r') as zip_in:
                
                # Itera por cada arquivo existente dentro do ZIP enviado
                for nome_arquivo in zip_in.namelist():
                    
                    # Ignoramos arquivos que não sejam XML (ex: imagens, txt, pastas ocultas)
                    if not nome_arquivo.lower().endswith('.xml'):
                        continue 

                    # Lê o conteúdo binário do XML específico
                    conteudo_xml = zip_in.read(nome_arquivo)
                    
                    # --- Lógica de Validação: cStat ---
                    try:
                        # Parsing do XML para árvore de elementos (DOM)
                        root = ET.fromstring(conteudo_xml)
                        
                        # Definição dos namespaces geralmente usados na NFe
                        ns = {'ns': 'http://www.portalfiscal.inf.br/nfe'}
                        
                        # --- VALIDAÇÃO 1: Encontrar a tag 'cStat' (Status) ---
                        # Busca cStat ignorando namespace ou usando wildcard se necessário
                        # Para simplificar e manter a lógica robusta anterior:
                        cstat_node = None
                        xmotivo_node = None
                        
                        for node in root.iter():
                            if node.tag.endswith('cStat'):
                                cstat_node = node
                            elif node.tag.endswith('xMotivo'):
                                xmotivo_node = node
                        
                        cstat_value = cstat_node.text if cstat_node is not None else "N/A"
                        xmotivo_value = xmotivo_node.text if xmotivo_node is not None else "Motivo não encontrado"

                        # --- REGRA DE NEGÓCIO 1: Filtrar por cStat ---
                        # Se cStat não for 100 (Autorizado) ou 150 (Autorizado Fora de Prazo), é REJEITADO.
                        if cstat_value not in ['100', '150']:
                            # Gravamos na pasta 'rejeitados/' dentro do novo ZIP
                            zip_out.writestr(f'rejeitados/{nome_arquivo}', conteudo_xml)
                            stats["rejeitados"] += 1
                            lista_detalhes_rejeicao.append([nome_arquivo, cstat_value, xmotivo_value])
                        
                        else:
                            # --- VALIDAÇÃO 2: Verificar Tipo de Emissão (tpEmis) ---
                            tpemis_node = None
                            for node in root.iter():
                                if node.tag.endswith('tpEmis'):
                                    tpemis_node = node
                                    break
                            
                            tpemis_value = tpemis_node.text if tpemis_node is not None else None

                            # --- REGRA DE NEGÓCIO 2: Classificar Aprovados vs Contingência ---
                            # tpEmis = 1: Emissão Normal -> Pasta 'aprovados/'
                            if tpemis_value == '1':
                                zip_out.writestr(f'aprovados/{nome_arquivo}', conteudo_xml)
                                stats["aprovados"] += 1
                            # Outros valores (EX: 9): Contingência -> Pasta 'contingencia/'
                            else: 
                                zip_out.writestr(f'contingencia/{nome_arquivo}', conteudo_xml)
                                stats["contingencia"] += 1
                        
                    except ET.ParseError:
                        # Se o arquivo .xml estiver corrompido ou mal formatado
                        print(f"Erro ao analisar o XML: {nome_arquivo}")
                        zip_out.writestr(f'rejeitados/{nome_arquivo}', conteudo_xml)
                        stats["rejeitados"] += 1
                        lista_detalhes_rejeicao.append([nome_arquivo, "ERRO_PARSE", "Arquivo XML inválido ou corrompido"])

            # --- GERAÇÃO DO RELATÓRIO DE REJEIÇÕES (CSV) ---
            if lista_detalhes_rejeicao:
                csv_buffer = io.StringIO()
                writer = csv.writer(csv_buffer, delimiter=';') # Ponto e vírgula para Excel PT-BR
                writer.writerow(['Nome do Arquivo', 'Código Status (cStat)', 'Motivo (xMotivo)'])
                writer.writerows(lista_detalhes_rejeicao)
                
                # Grava o CSV no ZIP
                zip_out.writestr('rejeitados/relatorio_erros.csv', csv_buffer.getvalue().encode('utf-8-sig')) # utf-8-sig para Excel abrir direto

        except zipfile.BadZipFile:
            # Caso o arquivo enviado pelo usuário não seja um ZIP válido
            print("Erro: Ficheiro não é um ZIP válido.")
            zip_out.writestr('ERRO.txt', 'O ficheiro enviado não era um ZIP válido.')

    # "Rebobina" o ponteiro do arquivo em memória para o início (byte 0) para que possa ser lido
    memoria_zip_saida.seek(0)
    
    return memoria_zip_saida, stats


# -------------------------------------------------------------------
# ENDPOINT PRINCIPAL (ASSÍNCRONO)
# -------------------------------------------------------------------
@app.post("/processar-zip/")
async def processar_zip(arquivo: UploadFile = File(...)):
    """
    Endpoint principal para processar o ZIP.
    RECEBE o arquivo e DEVOLVE um ZIP processado.
    
    Esta função é 'async', o que significa que ela roda no Event Loop do FastAPI.
    NÃO devemos colocar lógica bloqueante/pesada diretamente aqui, senão o servidor
    para de responder a outras requisições enquanto processa esta.
    """
    
    start_time = time.perf_counter()

    # Leitura ASSÍNCRONA do arquivo recebido. Isso libera o Event Loop enquanto o SO lê os dados.
    conteudo_zip_recebido = await arquivo.read()

    # Delegação para WORKER THREAD:
    # Como 'processar_zip_sync' é pesado (CPU-bound), usamos 'run_in_threadpool'.
    # O FastAPI executa a função numa thread separada e 'await' aguarda o resultado sem bloquear o loop principal.
    memoria_zip_saida, stats = await run_in_threadpool(processar_zip_sync, conteudo_zip_recebido)
    
    end_time = time.perf_counter()
    duration = end_time - start_time

    print(f"Processamento do ficheiro '{arquivo.filename}' concluído em {duration:.2f} segundos.")


    # --- Retorno da Resposta ---
    # Devolvemos os bytes diretos, marcando o Content-Type como ZIP.
    # O navegador identificará como download de arquivo.
    
    # Headers customizados com o resumo
    headers = {
        "Content-Disposition": "attachment; filename=xmls_processados.zip",
        "X-Count-Approved": str(stats["aprovados"]),
        "X-Count-Contingency": str(stats["contingencia"]),
        "X-Count-Rejected": str(stats["rejeitados"])
    }
    
    # Expose headers para o CORS (importante para o Angular conseguir ler)
    
    return Response(
        content=memoria_zip_saida.getvalue(), # Obtém os bytes brutos do buffer
        media_type="application/x-zip-compressed",
        headers=headers
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