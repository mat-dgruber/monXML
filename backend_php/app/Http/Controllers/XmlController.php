<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ArquivoProcessamento;
use App\Jobs\ProcessarXmlJob;
use Illuminate\Support\Facades\Storage;

/**
 * Controller responsável por gerenciar as requisições de arquivos XML.
 * Ele lida com o upload inicial, verificação de status e download do resultado.
 */
class XmlController extends Controller
{
    /**
     * 1. Recebe o arquivo e inicia o processo.
     *
     * Este método é o ponto de entrada. Ele valida o arquivo enviado,
     * salva temporariamente, cria um registro de controle no banco de dados
     * e despacha o job para processamento em segundo plano (fila).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        $start = microtime(true);
        \Illuminate\Support\Facades\Log::info("Upload iniciado.");

        if ($request->hasFile('ZIP')) {
            $file = $request->file('ZIP');
            // Log do status do arquivo (Tamanho e Código de Erro)
            // Error 1 = UPLOAD_ERR_INI_SIZE (maior que upload_max_filesize)
            \Illuminate\Support\Facades\Log::info("Arquivo detectado: " . $file->getClientOriginalName() .
                " | Tamanho (bytes): " . $file->getSize() .
                " | Erro PHP: " . $file->getError());
        } else {
            \Illuminate\Support\Facades\Log::warning("Nenhum arquivo 'ZIP' encontrado no request.");
        }

        try {
            // Validação: Aceita ZIP ou XML
            $request->validate(['ZIP' => 'required|file|mimes:zip,xml']);
            \Illuminate\Support\Facades\Log::info("Validação concluída em " . (microtime(true) - $start) . "s");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Falha na validação: " . $e->getMessage());
            return response()->json(['erro' => 'Falha na validação', 'detalhes' => $e->getMessage()], 422);
        }

        // Armazenamento
        $tStore = microtime(true);
        $path = $request->file('ZIP')->store('uploads');
        \Illuminate\Support\Facades\Log::info("Arquivo salvo em storage em " . (microtime(true) - $tStore) . "s");

        // Criação no Banco
        $processamento = ArquivoProcessamento::create([
            'caminho_entrada' => $path,
            'status' => 'pendente'
        ]);

        // Dispatch do Job
        $tDispatch = microtime(true);
        ProcessarXmlJob::dispatch($processamento);
        \Illuminate\Support\Facades\Log::info("Job despachado em " . (microtime(true) - $tDispatch) . "s (Driver: " . config('queue.default') . ")");

        \Illuminate\Support\Facades\Log::info("Total requisição: " . (microtime(true) - $start) . "s");

        // Retorna o ID para o usuário monitorar o status.
        return response()->json([
            'mensagem' => 'Arquivo recebido! Processamento iniciado.',
            'id_processamento' => $processamento->id
        ]);
    }

    /**
     * 2. Verifica se o processamento acabou.
     *
     * O frontend chama essa rota periodicamente (polling) para saber o estado atual.
     * Retorna o status (pendente, processando, concluido, erro) e estatísticas parciais/finais.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function status($id)
    {
        $proc = ArquivoProcessamento::find($id);
        if (!$proc) return response()->json(['erro' => 'Processamento não encontrado'], 404);

        return response()->json([
            'status' => $proc->status,
            'stats' => json_decode($proc->stats) // Decodifica o JSON de estatísticas salvas no banco
        ]);
    }

    /**
     * 3. Baixa o resultado final.
     *
     * Só permite o download se o status for 'concluido'.
     * O download é servido via stream pelo Storage do Laravel, evitando carregar
     * arquivos gigantes na memória do servidor.
     *
     * @param int $id
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
     */
    public function download($id)
    {
        $proc = ArquivoProcessamento::find($id);

        if (!$proc || $proc->status !== 'concluido') {
            return response()->json(['erro' => 'O arquivo ainda não está pronto para download.'], 400);
        }

        // Retorna o arquivo ZIP processado que foi gerado pelo Job.
        // O segundo parâmetro é o nome que aparecerá para o usuário salvar.
        return Storage::download($proc->caminho_saida, 'resultado_processado.zip');
    }
}
