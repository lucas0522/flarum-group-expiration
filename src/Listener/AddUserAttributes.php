<?php

namespace HertzDev\GroupExpiration\Listener;

use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\User;
use Illuminate\Database\ConnectionInterface;

class AddUserAttributes
{
    /**
     * @var ConnectionInterface
     */
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserSerializer $serializer, User $user, array $attributes): array
    {
        $actor = $serializer->getActor();

        // 权限判断：用户自己 或 有查看权限的管理员/版主
        if ($actor->id === $user->id || $actor->can('hertz-group-expiration.view-date')) {

            // 👇 修正点：这里只写 'group_expiration'，Flarum 会自动加 fla_ 前缀
            $expirationRecord = $this->db->table('group_expiration')
                ->where('user_id', $user->id)
                // 逻辑：查找该用户所有未过期的记录，并取最近到期的一条
                ->where('expiration_date', '>', date('Y-m-d H:i:s'))
                ->orderBy('expiration_date', 'asc')
                ->first();

            if ($expirationRecord) {
                $date = $expirationRecord->expiration_date;

                if ($date) {
                    // 格式化为 ISO 8601 传给前端
                    $attributes['groupExpiration'] = date('c', strtotime($date));
                }
            }
        }

        return $attributes;
    }
}
