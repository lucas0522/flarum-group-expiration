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
        ->attribute('canSetGroupExpiration', function ($serializer, $user) {
            return $serializer->getActor()->can('hertz-dev.group-expiration.edit');
        })
        ->attribute('groupExpirations', function ($serializer, $user) {
            $actor = $serializer->getActor();

            // 🔒 隐私检查
            if ($actor->id === $user->id || $actor->can('hertz-dev.group-expiration.edit')) {
                // 获取数据并转为数组
                return \Flarum\Database\AbstractModel::getConnectionResolver()->connection()
                    ->table('group_expiration')
                    ->where('user_id', $user->id)
                    ->pluck('expiration_date', 'group_id')
                    ->toArray();
            }

            // ⚠️ 关键修改：没权限时返回空数组 []，千万别返回 null
            return [];
        }),
];
