<?php

namespace HertzDev\GroupExpiration\Listeners;

use Flarum\User\Event\Saving; // 👈 改为监听 Saving
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;

class ClearExpiration
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function handle(Saving $event)
    {
        // 1. 检查是否有群组变动
        $relationships = Arr::get($event->data, 'relationships', []);

        if (isset($relationships['groups']['data'])) {
            // 2. 获取“修改后”的群组 ID
            $newGroupIds = array_map(function ($item) {
                return (int) $item['id'];
            }, $relationships['groups']['data']);

            // 3. 获取“修改前”的群组 ID
            $event->user->load('groups');
            $currentGroupIds = $event->user->groups->pluck('id')->toArray();

            // 4. 找出“被移除”的群组 (旧的有，新的没有)
            $removedGroupIds = array_diff($currentGroupIds, $newGroupIds);

            // 5. 删除对应过期数据
            if (!empty($removedGroupIds)) {
                $this->db->table('group_expiration')
                    ->where('user_id', $event->user->id)
                    ->whereIn('group_id', $removedGroupIds)
                    ->delete();
            }
        }
    }
}
