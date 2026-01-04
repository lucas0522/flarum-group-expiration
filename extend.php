<?php

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use HertzDev\GroupExpiration\Api\Controller\SaveExpirationController;
use HertzDev\GroupExpiration\Console\ExpireGroupsCommand;
use Flarum\User\Event\Saving; // 👈 1. 引入正确的 Saving 事件
use HertzDev\GroupExpiration\Listeners\ClearExpiration;
// 注意：删掉了 use Flarum\Group\Event\Detaching;

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
        ->attribute('canSetGroupExpiration', function ($serializer, $user, $attributes) {
            $actor = $serializer->getActor();
            return $actor->can('hertz-dev.group-expiration.edit');
        })
        // 这一段是你之前加的 groupExpirations，保持原样即可，这里省略了为了节省篇幅...
        ->attribute('groupExpirations', function ($serializer, $user) {
             $actor = $serializer->getActor();
             if ($actor->id === $user->id || $actor->can('hertz-dev.group-expiration.edit')) {
                 return \Flarum\Database\AbstractModel::getConnectionResolver()->connection()
                     ->table('group_expiration')
                     ->where('user_id', $user->id)
                     ->pluck('expiration_date', 'group_id')
                     ->toArray();
             }
             return [];
        }),

    // 👇👇👇 2. 修改监听器绑定
    (new Extend\Event())
        ->listen(Saving::class, ClearExpiration::class), // 👈 这里改成了 Saving
];
