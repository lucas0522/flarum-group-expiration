<?php

namespace HertzDev\GroupExpiration\Listeners;

use Flarum\User\Event\Saving;
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
        // 1. 检查是否有群组变动的数据提交
        // 注意：这里要确保数据存在，防止未提交 relationships 时报错
        $relationships = Arr::get($event->data, 'relationships', []);

        if (isset($relationships['groups']['data'])) {
            // 2. 获取“修改后”即将在本次请求保存的群组 ID
            $newGroupIds = array_map(function ($item) {
                return (int) $item['id'];
            }, $relationships['groups']['data']);

            // 3. 获取“修改前”数据库里已有的群组 ID
            // ❌ 错误做法： $event->user->load('groups'); (这会污染当前 User 模型的待保存状态)
            // ✅ 正确做法： 直接查询关联，不加载模型
            $currentGroupIds = $event->user->groups()->pluck('id')->toArray();

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
