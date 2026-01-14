<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('group_redemption_codes')) {
            $schema->create('group_redemption_codes', function (Blueprint $table) {
                $table->increments('id');
                $table->string('code', 32)->unique(); // 兑换码
                $table->integer('group_id')->unsigned(); // 对应的群组ID
                $table->integer('days')->unsigned(); // 有效天数
                $table->boolean('is_used')->default(false); // 是否已使用
                $table->integer('used_by')->unsigned()->nullable(); // 使用者UID
                $table->dateTime('used_at')->nullable(); // 使用时间
                $table->timestamps(); // created_at, updated_at

                // 索引优化查询
                $table->index('code');
                $table->index('is_used');
            });
        }
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('group_redemption_codes');
    }
];
