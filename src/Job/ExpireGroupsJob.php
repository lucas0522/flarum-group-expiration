<?php

namespace HertzDev\GroupExpiration\Job;

use Flarum\Queue\AbstractJob;
use Illuminate\Database\ConnectionInterface;
use Flarum\User\User;
use Carbon\Carbon;

class ExpireGroupsJob extends AbstractJob
{
    // 这里不需要传参数，因为我们是去数据库全量扫描
    // 如果你是针对单个用户，可以在构造函数里传 userId
    public function __construct()
    {
    }

    public function handle(ConnectionInterface $db)
    {
        // === 这里放原来 Command 里的逻辑 ===

        // 1. 找出过期记录
        $expiredRecords = $db->table('group_expiration')
            ->where('expiration_date', '<', Carbon::now())
            ->get();

        if ($expiredRecords->isEmpty()) {
            return;
        }

        foreach ($expiredRecords as $record) {
            $user = User::find($record->user_id);

            if ($user) {
                $user->groups()->detach($record->group_id);
            }

            // 删除记录
            $db->table('group_expiration')->where('id', $record->id)->delete();
        }
    }
}
