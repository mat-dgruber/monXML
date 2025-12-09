<?php

namespace App\Jobs;

use App\Models\ArquivoProcessamento;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use ZipArchive;
use DOMDocument;

/**
 * Job responsável pelo processamento assíncrono dos arquivos XML.
 * Implementa ShouldQueue para indicar que deve rodar em background (Worker).
 */
class ProcessarXmlJob implements ShouldQueue
{
    use Queueable; // Permite despachar o job para a fila

    protected $processamento;

    /**
     * Cria uma nova instância do Job.
     *
     * @param ArquivoProcessamento $processamento Modelo com os dados do arquivo a ser processado.
     */
    public function __construct(ArquivoProcessamento $processamento)
    {
        $this->processamento = $processamento;
    }

    /**
     * Executa o Job (Lógica principal).
     *
     * Este método é chamado automaticamente pelo Worker.
     */
    public function handle(): void
    {
        // 1. Atualiza status para PROCESSANDO no banco
        $this->processamento->update(['status' => 'processando']);

        // Caminho absoluto do arquivo ZIP enviado pelo usuário
        $caminhoEntrada = storage_path('app/private/' . $this->processamento->caminho_entrada);

        // Gera um nome único para o arquivo de saída e define seu caminho
        $nomeSaida = 'processados/' . uniqid() . '.zip';
        $caminhoSaida = storage_path('app/private/' . $nomeSaida);

        // Garante que a pasta de destino ('storage/app/private/processados') existe
        if (!file_exists(dirname($caminhoSaida))) {
            mkdir(dirname($caminhoSaida), 0777, true);
        }

        $zipIn = new ZipArchive;
        $zipOut = new ZipArchive;

        // Inicializa estatísticas para relatório
        $stats = ['aprovados' => 0, 'contingencia' => 0, 'rejeitados' => 0];
        $rejeicoes = [];

        // --- LÓGICA CORE ---
        // Abre o ZIP de entrada para leitura E cria o ZIP de saída para escrita
        if ($zipIn->open($caminhoEntrada) === TRUE && $zipOut->open($caminhoSaida, ZipArchive::CREATE) === TRUE) {

            // Itera arquivo por arquivo dentro do ZIP original
            for ($i = 0; $i < $zipIn->numFiles; $i++) {
                $nomeArquivo = $zipIn->getNameIndex($i);

                // Ignora arquivos que não terminam com .xml
                if (strtolower(pathinfo($nomeArquivo, PATHINFO_EXTENSION)) !== 'xml') continue;

                // Lê o conteúdo do XML da memória
                $conteudoXml = $zipIn->getFromIndex($i);
                $dom = new DOMDocument;

                // Tenta fazer o parsing do XML. O '@' suprime warnings de XML malformado.
                $carregou = @$dom->loadXML($conteudoXml);

                // Se o XML for inválido/corrompido
                if (!$carregou) {
                    // Adiciona na pasta 'rejeitados' do novo ZIP
                    $zipOut->addFromString("rejeitados/{$nomeArquivo}", $conteudoXml);
                    $stats['rejeitados']++;
                    $rejeicoes[] = [$nomeArquivo, 'ERRO_PARSE', 'XML invalido'];
                    continue;
                }

                // Extrai as tags necessárias para validação
                $cStat = $this->getTagValue($dom, 'cStat') ?? 'N/A';
                $tpEmis = $this->getTagValue($dom, 'tpEmis');
                $xMotivo = $this->getTagValue($dom, 'xMotivo') ?? 'Motivo não encontrado';

                // Regra de Validação: cStat deve ser 100 (Autorizado) ou 150 (Autorizado Fora de Prazo)
                if (!in_array($cStat, ['100', '150'])) {
                    // Arquivo REJEITADO
                    $zipOut->addFromString("rejeitados/{$nomeArquivo}", $conteudoXml);
                    $stats['rejeitados']++;
                    $rejeicoes[] = [$nomeArquivo, $cStat, $xMotivo];
                } else {
                    // Arquivo APROVADO
                    if ($tpEmis == '1') {
                        // Emissão Normal
                        $zipOut->addFromString("aprovados/{$nomeArquivo}", $conteudoXml);
                        $stats['aprovados']++;
                    } else {
                        // Emissão em Contingência
                        $zipOut->addFromString("contingencia/{$nomeArquivo}", $conteudoXml);
                        $stats['contingencia']++;
                    }
                }
            }

            // Geração do relatório CSV de rejeições
            if (!empty($rejeicoes)) {
                $stream = fopen('php://memory', 'r+'); // Cria stream em memória
                fputs($stream, "\xEF\xBB\xBF"); // Adiciona BOM para o Excel abrir UTF-8 corretamente
                fputcsv($stream, ['Arquivo', 'cStat', 'Motivo'], ';'); // Cabeçalho

                foreach ($rejeicoes as $linha) {
                    fputcsv($stream, $linha, ';');
                }

                rewind($stream); // Volta ponteiro para o início da stream
                // Adiciona o CSV gerado dentro do ZIP na pasta rejeitados
                $zipOut->addFromString('rejeitados/relatorio.csv', stream_get_contents($stream));
                fclose($stream);
            }

            $zipIn->close();
            $zipOut->close();

            // 2. Atualiza status para CONCLUIDO
            // Salva estatísticas em JSON e o caminho do novo arquivo gerado
            $this->processamento->update([
                'status' => 'concluido',
                'caminho_saida' => $nomeSaida,
                'stats' => json_encode($stats)
            ]);

        } else {
            // Em caso de erro ao abrir os ZIPs
            $this->processamento->update(['status' => 'erro']);
        }
    }

    /**
     * Helper para extrair valor de uma tag XML de forma segura.
     * Retorna null se a tag não existir.
     */
    private function getTagValue($dom, $tagName) {
        $nodes = $dom->getElementsByTagName($tagName);
        return $nodes->length > 0 ? $nodes->item(0)->nodeValue : null;
    }
}
