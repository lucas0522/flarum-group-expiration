<?php

namespace HertzDev\GroupExpiration\Model;

use Flarum\Database\AbstractModel;

class RedemptionCode extends AbstractModel
{
    // 定义对应的数据库表名
    protected $table = 'group_redemption_codes';

    // 自动管理时间戳 (created_at, updated_at)
    public $timestamps = true;

    // 类型转换
    protected $casts = [
        'is_used' => 'boolean',
        'days' => 'integer',
        'group_id' => 'integer',
        'used_at' => 'datetime'
    ];

    // 如果需要关联用户（例如查看谁使用了码），可以加上这个
    public function user()
    {
        return $this->belongsTo(\Flarum\User\User::class, 'used_by');
    }
}
