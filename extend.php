<?php

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use HertzDev\GroupExpiration\Api\Controller\SaveExpirationController;
use HertzDev\GroupExpiration\Console\ExpireGroupsCommand;
use HertzDev\GroupExpiration\Listener\AddUserAttributes; // 👈 1. 引入新创建的 Listener

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

    (new Extend\ApiSerializer(UserSerializer::class))
        // 👇 2. 注册刚才写的 AddUserAttributes 类
        // 这会让 groupExpiration 字段出现在 API 返回结果中
        ->attributes(AddUserAttributes::class)

        // 👇 这是你原有的代码，保留不动
        // 用于告诉前端“当前用户是否有权修改过期时间”
        ->attribute('canSetGroupExpiration', function ($serializer, $user, $attributes) {
            $actor = $serializer->getActor();
            return $actor->can('hertz-dev.group-expiration.edit');
        }),
];
