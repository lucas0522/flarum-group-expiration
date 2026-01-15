<?php

namespace HertzDev\GroupExpiration\Listener;

use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\User;
use Illuminate\Database\ConnectionInterface;
use Carbon\Carbon;

class AddUserAttributes
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserSerializer $serializer, User $user, array $attributes): array
    {
        $actor = $serializer->getActor();

        // 权限判断
        if ($actor->id === $user->id || 
            $actor->can('hertz-group-expiration.view-date') || 
            $actor->can('hertz-dev.group-expiration.edit')) {

            // 1. 获取该用户所有【未过期】的群组记录
            $records = $this->db->table('group_expiration')
                ->where('user_id', $user->id)
                ->where('expiration_date', '>', Carbon::now())
                ->orderBy('expiration_date', 'asc')
                ->get();

            // ================= 新增逻辑开始 =================
            // 获取用户当前实际所在的群组 ID 列表
            // $user->groups 是 Flarum 自动加载的用户群组集合
            $currentUserGroupIds = $user->groups->pluck('id')->all();

            // 过滤记录：只保留那些用户【确实还在】的群组记录
            $validRecords = $records->filter(function ($record) use ($currentUserGroupIds) {
                return in_array($record->group_id, $currentUserGroupIds);
            });
            // ================= 新增逻辑结束 =================

            // 2. 构建映射数组 (给设置弹窗用)
            $map = [];
            foreach ($validRecords as $record) {
                $map[$record->group_id] = Carbon::parse($record->expiration_date)->toIso8601String();
            }
            $attributes['groupExpirations'] = $map;

            // 3. 恢复原来的单数属性 (给个人主页显示用)
            // 取过滤后的第一条记录
            if ($validRecords->isNotEmpty()) {
                $firstRecord = $validRecords->first();
                $attributes['groupExpiration'] = Carbon::parse($firstRecord->expiration_date)->toIso8601String();
            }
        }

        return $attributes;
    }
}