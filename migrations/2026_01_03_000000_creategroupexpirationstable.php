<?php

use Illuminate\Database\Schema\Blueprint;
use Flarum\Database\Migration;

return Migration::createTable(
    'group_expirations',
    function (Blueprint $table) {
        $table->increments('id');
        $table->integer('user_id')->unsigned();
        $table->integer('group_id')->unsigned();
        $table->dateTime('expiration_date');
        $table->timestamps();

        // 外键约束：用户或群组被删时，自动清理这条记录
        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
    }
);
