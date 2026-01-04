<?php

namespace HertzDev\GroupExpiration\Listeners;

use Flarum\User\Event\Saving; // 👈 换成监听 Saving 事件
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
        // 1. 检查 API 提交的数据里是否包含 'groups' 修改
        // 如果数据里没有 groups，说明管理员只改了用户名或密码，没动群组，直接跳过
        $relationships = Arr::get($event->data, 'relationships', []);

        if (isset($relationships['groups']['data'])) {
            // 2. 提取“新”的群组 ID 列表 (即将保存的状态)
            $newGroupIds = array_map(function ($item) {
                return (int) $item['id'];
            }, $relationships['groups']['data']);

            // 3. 获取“旧”的群组 ID 列表 (当前数据库里的状态)
            // 确保 groups 关联已加载
            $event->user->load('groups');
            $currentGroupIds = $event->user->groups->pluck('id')->toArray();

            // 4. 计算差异：在旧列表里有，但在新列表里没有的，就是“被手动移除”的
            $removedGroupIds = array_diff($currentGroupIds, $newGroupIds);

            // 5. 如果确实有群组被移除了，就删掉对应的过期记录
            if (!empty($removedGroupIds)) {
                $this->db->table('group_expiration')
                    ->where('user_id', $event->user->id)
                    ->whereIn('group_id', $removedGroupIds)
                    ->delete();
            }
        }
    }
}
