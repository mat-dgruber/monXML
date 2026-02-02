import io
import zipfile
import sys
import os

# Add the backend directory to the path so we can import processar_zip_sync
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import processar_zip_sync

def test_flatten_directory_structure():
    # 1. Create a ZIP file in memory with nested structure
    input_zip_buffer = io.BytesIO()
    with zipfile.ZipFile(input_zip_buffer, 'w', zipfile.ZIP_DEFLATED) as z:
        # Create a dummy XML that would be approved (tpEmis=1, cStat=100)
        xml_content = """<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <protNFe>
                <infProt>
                    <cStat>100</cStat>
                    <xMotivo>Autorizado o uso da NF-e</xMotivo>
                </infProt>
            </protNFe>
            <NFe>
                <infNFe>
                    <ide>
                        <tpEmis>1</tpEmis>
                    </ide>
                    <total>
                        <ICMSTot>
                            <vNF>100.00</vNF>
                            <vICMS>18.00</vICMS>
                        </ICMSTot>
                    </total>
                </infNFe>
            </NFe>
        </nfeProc>"""
        
        # Add file with nested path
        z.writestr('pasta1/pasta2/arquivo_teste.xml', xml_content)
    
    input_zip_buffer.seek(0)
    
    # 2. Process the ZIP
    output_zip_buffer, stats = processar_zip_sync(input_zip_buffer.getvalue())
    
    # 3. Analyze the result
    with zipfile.ZipFile(output_zip_buffer, 'r') as z_out:
        file_list = z_out.namelist()
        print("Arquivos no ZIP de saida:", file_list)
        
        # Check if the file is flattened
        # Allowed paths: 'aprovados/arquivo_teste.xml'
        # Disallowed paths: 'aprovados/pasta1/pasta2/arquivo_teste.xml'
        
        found_flattened = False
        found_nested = False
        
        for f in file_list:
            if f == 'aprovados/arquivo_teste.xml':
                found_flattened = True
            if 'pasta1' in f or 'pasta2' in f:
                found_nested = True
                
        if found_nested:
            print("FALHA: Estrutura de pasta preservada (nao achatada).")
            # We want this test to fail currently, so exit with 1 if verified that it fails to flatten
            # But wait, TDD means we want to see it fail first. 
            # So if found_nested is True, that confirms the current behavior (FAILURE of the requirement).
            # The test script should assert that found_nested is False.
            sys.exit(1)
        
        if not found_flattened:
             print("FALHA: Arquivo achatado nao encontrado.")
             sys.exit(1)

    print("SUCESSO: Arquivo foi achatado corretamente.")

if __name__ == "__main__":
    test_flatten_directory_structure()
