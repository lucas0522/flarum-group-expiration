<?php

namespace HertzDev\GroupExpiration\Api\Controller;

use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Flarum\Group\Group;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Illuminate\Database\ConnectionInterface;
use Flarum\Foundation\ValidationException;
use Carbon\Carbon; // 👈 必须引入 Carbon

class SaveExpirationController implements RequestHandlerInterface
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // 1. 获取权限
        $actor = RequestUtil::getActor($request);
        $actor->assertCan('hertz-dev.group-expiration.edit');

        // 2. 获取数据
        $data = $request->getParsedBody();
        $userId = Arr::get($data, 'userId');
        $groupId = Arr::get($data, 'groupId');
        $date = Arr::get($data, 'expirationDate');

        // 3. 验证
        if (!$userId || !$groupId || !$date) {
            throw new ValidationException(['error' => '缺少必要参数']);
        }

        // 4. 格式化日期 (修复 500 错误的关键)
        // 将 '2025-01-01' 转换为数据库能认的 '2025-01-01 00:00:00'
        try {
            $formattedDate = Carbon::parse($date)->toDateTimeString();
        } catch (\Exception $e) {
            throw new ValidationException(['expirationDate' => '日期格式无效']);
        }

        // 5. 写入数据库
        // 🚨 重点修复：这里改为单数 'group_expiration'，去掉 's'
        $this->db->table('group_expiration')->updateOrInsert(
            [
                'user_id' => $userId,
                'group_id' => $groupId
            ],
            [
                'expiration_date' => $formattedDate,
                'updated_at' => Carbon::now()
                // 如果表里没有 created_at 列，去掉下面这一行，否则会报错
                // 'created_at' => Carbon::now()
            ]
        );

        // 6. 同步群组
        $user = User::find($userId);
        if ($user) {
            $user->groups()->syncWithoutDetaching([$groupId]);
        }

        return new EmptyResponse();
    }
}
