<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\XmlController;

// Definição das Rotas da API
// Estas rotas são prefixadas automaticamente com '/api' pelo Laravel.

// Rota POST para enviar o arquivo ZIP. Inicia o processo de upload e fila.
Route::post('/upload', [XmlController::class, 'upload']);

// Rota GET para consultar o status de um processamento específico pelo ID.
Route::get('/status/{id}', [XmlController::class, 'status']);

// Rota GET para baixar o arquivo ZIP processado final, quando estiver 'concluido'.
Route::get('/download/{id}', [XmlController::class, 'download']);

// Rota de DEBUG para verificar configuração da fila e Limites do PHP
Route::get('/debug-queue', function () {
    return response()->json([
        'queue_connection_config' => config('queue.default'),
        'env_queue_connection' => env('QUEUE_CONNECTION'),
        'jobs_table_count' => \Illuminate\Support\Facades\DB::table('jobs')->count(),
        'failed_jobs_count' => \Illuminate\Support\Facades\DB::table('failed_jobs')->count(),
        'php_upload_max_filesize' => ini_get('upload_max_filesize'),
        'php_post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
    ]);
});
