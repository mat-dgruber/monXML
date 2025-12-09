<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model que representa a tabela 'arquivo_processamentos'.
 *
 * Esta entidade serve para rastrear o estado de cada upload feito pelo usuário.
 * Armazena o caminho do arquivo original, o status atual (pendente, processando, concluido)
 * e o local do arquivo final processado.
 */
class ArquivoProcessamento extends Model
{
    // $guarded vazio libera o "Mass Assignment" para todos os campos.
    // Isso permite criar o registro usando ArquivoProcessamento::create(['campo' => 'valor'])
    // sem precisar listar cada campo na propriedade $fillable.
    protected $guarded = [];
}
