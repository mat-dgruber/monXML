<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('arquivo_processamentos', function (Blueprint $table) {
        $table->id();
        $table->string('status')->default('pendente'); // pendente, processando, concluido, erro
        $table->string('caminho_entrada'); // Onde salvamos o ZIP original
        $table->string('caminho_saida')->nullable(); // Onde salvaremos o ZIP final
        $table->json('stats')->nullable(); // Guardar contagem (aprovados, rejeitados)
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arquivo_processamentos');
    }
};
