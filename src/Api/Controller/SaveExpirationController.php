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

class SaveExpirationController implements RequestHandlerInterface
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // 1. 获取当前操作者（比如管理员）
        $actor = RequestUtil::getActor($request);

        // TODO: 这里以后要加权限检查，比如 $actor->assertAdmin();
        // 检查当前用户是否有我们刚才定义的那个权限字符串
        $actor->assertCan('hertz-dev.group-expiration.edit');

        // 2. 获取前端发来的数据
        $data = $request->getParsedBody();
        $userId = Arr::get($data, 'userId');
        $groupId = Arr::get($data, 'groupId');
        $date = Arr::get($data, 'expirationDate');

        // 3. 简单的验证
        if (!$userId || !$groupId || !$date) {
            throw new ValidationException(['error' => '缺少必要参数']);
        }

        // 4. 写入数据库 (使用 updateOrInsert，如果存在就更新，不存在就插入)
        $this->db->table('group_expirations')->updateOrInsert(
            [
                'user_id' => $userId,
                'group_id' => $groupId
            ],
            [
                'expiration_date' => $date,
                'created_at' => \Carbon\Carbon::now(),
                'updated_at' => \Carbon\Carbon::now()
            ]
        );

        // 5. 同时把用户真正加入那个群组 (Flarum 核心逻辑)
        $user = User::find($userId);
        if ($user) {
            $user->groups()->syncWithoutDetaching([$groupId]);
        }

        return new EmptyResponse();
    }
}
