<?php

namespace HertzDev\GroupExpiration\Console;

use Illuminate\Console\Command;
use Illuminate\Contracts\Queue\Queue; // 引入队列接口
use HertzDev\GroupExpiration\Job\ExpireGroupsJob; // 引入刚才写的 Job

class ExpireGroupsCommand extends Command
{
    protected $signature = 'group-expiration:expire';
    protected $description = '将过期清理任务推送到 Redis 队列';

    public function handle(Queue $queue)
    {
        $this->info('正在将清理任务推送到队列...');

        // 核心动作：推送到队列
        $queue->push(new ExpireGroupsJob());

        $this->info('任务已推送！Redis (Horizon) 将会在后台处理它。');
    }
}
