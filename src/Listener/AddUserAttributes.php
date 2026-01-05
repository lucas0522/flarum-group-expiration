<?php

namespace HertzDev\GroupExpiration\Listener;

use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\User;

class AddUserAttributes
{
    /**
     * @param UserSerializer $serializer
     * @param User $user
     * @param array $attributes
     * @return array
     */
    public function __invoke(UserSerializer $serializer, User $user, array $attributes): array
    {
        // 确保用户对象有 expiration_date 字段
        if (isset($user->expiration_date)) {

            $actor = $serializer->getActor();

            // 权限判断逻辑：
            // 1. $actor->id === $user->id : 用户自己总是可以看到自己的到期时间
            // 2. $actor->can('...') : 拥有特定权限的用户（如管理员、版主）可以查看
            if ($actor->id === $user->id || $actor->can('hertz-group-expiration.view-date')) {

                // 格式化日期：建议转为 ISO 8601 字符串传给前端，让前端处理时区
                // 假设 expiration_date 是数据库取出的字符串或 DateTime 对象
                $date = $user->expiration_date;

                // 如果是 DateTime 对象，转为字符串
                if ($date instanceof \DateTime) {
                    $date = $date->format(\DateTime::RFC3339);
                }

                $attributes['groupExpiration'] = $date;
            }
        }

        return $attributes;
    }
}
