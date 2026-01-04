<?php

namespace HertzDev\GroupExpiration\Listeners;

use Flarum\Group\Event\Detaching;
use Illuminate\Database\ConnectionInterface;

class ClearExpiration
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function handle(Detaching $event)
    {
        // $event->users 是一个数组，包含被操作的用户对象
        // $event->group 是被操作的群组对象

        foreach ($event->users as $user) {
            // 从你的过期记录表中删除对应记录
            // 假设你的表名是 group_expiration
            $this->db->table('group_expiration')
                ->where('user_id', $user->id)
                ->where('group_id', $event->group->id)
                ->delete();
        }
    }
}
