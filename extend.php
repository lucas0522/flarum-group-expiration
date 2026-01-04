<?php

use Flarum\Extend;
use HertzDev\GroupExpiration\Api\Controller\SaveExpirationController;
use HertzDev\GroupExpiration\Console\ExpireGroupsCommand; // 👈 引入新类

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    (new Extend\Locales(__DIR__.'/locale')),

    (new Extend\Routes('api'))
        ->post('/group-expiration', 'hertz-dev.group-expiration.save', SaveExpirationController::class),

    // 👇 新增：注册控制台命令
    (new Extend\Console())
        ->command(ExpireGroupsCommand::class)
        ->schedule('group-expiration:expire', function ($event) {
            // 设置频率：每天运行一次
            $event->daily();

            // 如果你想测试得快一点，可以用每分钟运行一次 (仅限测试用!)
            // $event->everyMinute();
        }),
];
