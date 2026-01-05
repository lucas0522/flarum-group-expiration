<?php

namespace HertzDev\GroupExpiration\Api\Controller;

use Flarum\Api\Controller\AbstractCreateController; // 👈 改用这个控制器基类
use Flarum\Api\Serializer\UserSerializer;         // 👈 引入 User 序列化器
use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;                    // 👈 引入 Document
use Illuminate\Database\ConnectionInterface;
use Flarum\Foundation\ValidationException;

class SaveExpirationController extends AbstractCreateController
{
    // 1. 指定返回的数据类型是 User，这样前端 Store 就能自动更新
    public $serializer = UserSerializer::class;

    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    // 2. 将 handle 改为 data，这是 AbstractCreateController 的标准写法
    protected function data(ServerRequestInterface $request, Document $document)
    {
        // 获取当前操作者
        $actor = RequestUtil::getActor($request);

        // 权限检查
        $actor->assertCan('hertz-dev.group-expiration.edit');

        // 获取数据
        $data = $request->getParsedBody();
        $userId = Arr::get($data, 'userId');
        $groupId = Arr::get($data, 'groupId');
        $date = Arr::get($data, 'expirationDate');

        // 验证
        if (!$userId || !$groupId || !$date) {
            throw new ValidationException(['error' => '缺少必要参数']);
        }

        // 3. 修正表名：去掉 's'，与 extend.php 保持一致
        // 使用 group_expiration 而不是 group_expirations
        $this->db->table('group_expiration')->updateOrInsert(
            [
                'user_id' => $userId,
                'group_id' => $groupId
            ],
            [
                'expiration_date' => $date,
                // created_at 在 updateOrInsert 中比较棘手，这里简化处理，只更新 updated_at 即可
                // 如果需要严格的 created_at，逻辑会复杂一些，通常对于这种关联表，记录最后更新时间够用了
                'updated_at' => \Carbon\Carbon::now()
            ]
        );

        // 4. 同步群组逻辑
        $user = User::findOrFail($userId);
        $user->groups()->syncWithoutDetaching([$groupId]);

        // 5. 【关键】返回 User 对象
        // 这样前端收到响应后，会自动根据 UserSerializer 更新 app.store 中的用户数据
        // 从而不需要刷新页面，用户卡片上的过期时间就能直接显示出来
        return $user;
    }
}
