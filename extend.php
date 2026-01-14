<?php

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use HertzDev\GroupExpiration\Api\Controller\SaveExpirationController;
use HertzDev\GroupExpiration\Api\Controller\RedeemCodeController;
use HertzDev\GroupExpiration\Api\Controller\ListCodesController;   // 👈 必须补全这个
use HertzDev\GroupExpiration\Api\Controller\CreateCodesController; // 👈 必须补全这个
use HertzDev\GroupExpiration\Console\ExpireGroupsCommand;
use HertzDev\GroupExpiration\Listener\AddUserAttributes;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    (new Extend\Locales(__DIR__.'/locale')),

    (new Extend\Routes('api'))
        ->post('/group-expiration', 'hertz-dev.group-expiration.save', SaveExpirationController::class)
        ->post('/redemption/redeem', 'hertz-dev.redemption.redeem', RedeemCodeController::class)
        // 👇👇👇 你的文件里缺少下面这两行核心代码 👇👇👇
        ->get('/redemption/codes', 'hertz-dev.redemption.list', ListCodesController::class)
        ->post('/redemption/create', 'hertz-dev.redemption.create', CreateCodesController::class),

    (new Extend\Console())
        ->command(ExpireGroupsCommand::class)
        ->schedule('group-expiration:expire', function ($event) {
            $event->hourly();
        }),

    (new Extend\ApiSerializer(UserSerializer::class))
        ->attributes(AddUserAttributes::class)
        ->attribute('canSetGroupExpiration', function ($serializer, $user, $attributes) {
            $actor = $serializer->getActor();
            return $actor->can('hertz-dev.group-expiration.edit');
        }),
];
