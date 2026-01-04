<?php

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use HertzDev\GroupExpiration\Api\Controller\SaveExpirationController;
use HertzDev\GroupExpiration\Console\ExpireGroupsCommand;
use Flarum\Group\Event\Detaching;
use HertzDev\GroupExpiration\Listeners\ClearExpiration;

return [
    (new Extend\Frontend('forum'))->js(__DIR__.'/js/dist/forum.js'),
    (new Extend\Frontend('admin'))->js(__DIR__.'/js/dist/admin.js'),
    (new Extend\Locales(__DIR__.'/locale')),

    (new Extend\Routes('api'))
        ->post('/group-expiration', 'hertz-dev.group-expiration.save', SaveExpirationController::class),

    (new Extend\Console())
        ->command(ExpireGroupsCommand::class)
        ->schedule('group-expiration:expire', function ($event) {
            $event->daily();
        }),

    (new Extend\Event())
        ->listen(Detaching::class, ClearExpiration::class),

    (new Extend\ApiSerializer(UserSerializer::class))
        // 1. 权限检查 (控制按钮显示)
        ->attribute('canSetGroupExpiration', function ($serializer, $user) {
            return $serializer->getActor()->can('hertz-dev.group-expiration.edit');
        })
        // 2. 【核心修改】返回现有的过期时间列表 (带隐私检查)
        ->attribute('groupExpirations', function ($serializer, $user) {
            $actor = $serializer->getActor();

            // 🔒 隐私检查：只有“用户自己”或者“有管理权限的人”才能看到过期时间
            if ($actor->id === $user->id || $actor->can('hertz-dev.group-expiration.edit')) {
                return \Flarum\Database\AbstractModel::getConnectionResolver()->connection()
                    ->table('group_expiration')
                    ->where('user_id', $user->id)
                    ->pluck('expiration_date', 'group_id');
                    // 返回格式: { "3": "2026-05-20" }
            }

            // 如果没权限，返回 null
            return null;
        }),
];
