<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_password_resets', function (Blueprint $table) {
            $table->string('email')->index();
            $table->string('token');
            $table->unsignedBigInteger('store_id');
            $table->timestamp('created_at')->nullable();
            
            $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_password_resets');
    }
};