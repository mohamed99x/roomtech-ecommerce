<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Webhook;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        // Check if webhooks table exists
        if (!Schema::hasTable('webhooks')) {
            return;
        }

        // Add store_id column if it doesn't exist
        if (!Schema::hasColumn('webhooks', 'store_id')) {
            Schema::table('webhooks', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('user_id');
                $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
                $table->index(['user_id', 'store_id']);
            });
        }

        // Add is_active column if it doesn't exist
        if (!Schema::hasColumn('webhooks', 'is_active')) {
            Schema::table('webhooks', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('method');
            });
        }

        // Change module from enum to varchar only if it's currently enum
        $columnType = DB::select("SHOW COLUMNS FROM webhooks WHERE Field = 'module'")[0]->Type ?? '';
        if (strpos($columnType, 'enum') !== false) {
            DB::statement('ALTER TABLE webhooks MODIFY COLUMN module VARCHAR(50) NOT NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('webhooks')) {
            return;
        }

        if (Schema::hasColumn('webhooks', 'is_active')) {
            Schema::table('webhooks', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }

        if (Schema::hasColumn('webhooks', 'store_id')) {
            Schema::table('webhooks', function (Blueprint $table) {
                $table->dropForeign(['store_id']);
                $table->dropIndex(['user_id', 'store_id']);
                $table->dropColumn('store_id');
            });
        }

        // Only revert if column exists and is varchar
        $columnType = DB::select("SHOW COLUMNS FROM webhooks WHERE Field = 'module'")[0]->Type ?? '';
        if (strpos($columnType, 'varchar') !== false) {
            DB::statement("ALTER TABLE webhooks MODIFY COLUMN module ENUM('New User') NOT NULL");
        }
    }
};