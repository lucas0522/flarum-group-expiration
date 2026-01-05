<?php

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer; // 👈 引入 UserSerializer
use HertzDev\GroupExpiration\Api\Controller\SaveExpirationController;
use HertzDev\GroupExpiration\Console\ExpireGroupsCommand;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    (new Extend\Locales(__DIR__.'/locale')),

    (new Extend\Routes('api'))
        ->post('/group-expiration', 'hertz-dev.group-expiration.save', SaveExpirationController::class),


    (new Extend\Console())
        ->command(ExpireGroupsCommand::class)
        ->schedule('group-expiration:expire', function ($event) {

            $event->daily();
        }),

    // 👇👇👇 新增：在 API 输出中增加权限标记
    // 这就是原生的精髓：后端算好权限，前端直接用
    (new Extend\ApiSerializer(UserSerializer::class))
        ->attribute('canSetGroupExpiration', function ($serializer, $user, $attributes) {
            // 获取当前操作者（Actor）
            $actor = $serializer->getActor();

            // 使用原生的 check 机制检查后台设置的权限
            return $actor->can('hertz-dev.group-expiration.edit');
        }),
];
