<?php

use Illuminate\Database\Schema\Blueprint;
use Flarum\Database\Migration;

return Migration::createTable(
    'group_expiration', // 👈 修正：去掉 's'，必须是单数！
    function (Blueprint $table) {
        $table->increments('id');
        $table->integer('user_id')->unsigned();
        $table->integer('group_id')->unsigned();
        $table->dateTime('expiration_date');
        $table->timestamps();

        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
    }
);
