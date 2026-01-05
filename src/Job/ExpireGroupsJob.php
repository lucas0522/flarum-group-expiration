<?php

namespace HertzDev\GroupExpiration\Job;

use Flarum\Queue\AbstractJob;
use Illuminate\Database\ConnectionInterface;
use Flarum\User\User;
use Carbon\Carbon;

class ExpireGroupsJob extends AbstractJob
{
    public function __construct()
    {
    }

    public function handle(ConnectionInterface $db)
    {
        // 1. 找出过期记录
        // ⚠️ 注意：这里我改成了单数 'group_expiration' 以匹配 Controller 的修改
        // 如果你的数据库表名是复数，请把这里改成 'group_expirations'
        $expiredRecords = $db->table('group_expiration')
            ->where('expiration_date', '<', Carbon::now())
            ->get();

        if ($expiredRecords->isEmpty()) {
            return;
        }

        foreach ($expiredRecords as $record) {
            // 2. 移除用户的群组
            // 使用 find 而不是 findOrFail，防止用户已经被删除了导致任务报错中断
            $user = User::find($record->user_id);

            if ($user) {
                // detach 用于移除多对多关联
                $user->groups()->detach($record->group_id);

                // 可选：在这里记录日志，方便调试
                // echo "User {$user->id} removed from Group {$record->group_id}\n";
            }

            // 3. 🛠️【核心修复】删除数据库记录
            // 关联表通常没有 'id' 主键，必须用 user_id 和 group_id 联合定位
            $db->table('group_expiration') // 👈 记得确认这里也是单数/复数一致
                ->where('user_id', $record->user_id)
                ->where('group_id', $record->group_id)
                ->delete();
        }
    }
}
