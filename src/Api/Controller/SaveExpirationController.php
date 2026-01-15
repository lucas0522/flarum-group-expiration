<?php

namespace HertzDev\GroupExpiration\Api\Controller;

use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Flarum\Group\Group;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Illuminate\Database\ConnectionInterface;
use Flarum\Foundation\ValidationException;
use Carbon\Carbon;

class SaveExpirationController implements RequestHandlerInterface
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // 1. 获取当前操作者及权限检查
        $actor = RequestUtil::getActor($request);
        $actor->assertCan('hertz-dev.group-expiration.edit');

        // 2. 获取前端发来的数据
        $data = $request->getParsedBody();
        $userId = Arr::get($data, 'userId');
        $groupId = Arr::get($data, 'groupId');
        // 前端传来的“目标时间”（例如前端计算出：现在+30天 = 2026-02-14）
        $inputDateStr = Arr::get($data, 'expirationDate');

        // 3. 验证参数
        if (!$userId || !$groupId || !$inputDateStr) {
            throw new ValidationException(['error' => '缺少必要参数']);
        }

        // ================= 核心修改逻辑开始 =================

        $now = Carbon::now();
        $inputDate = Carbon::parse($inputDateStr);

        // A. 计算本次要增加的时长 (秒数)
        // 逻辑：前端传来的时间 - 当前时间 = 增加的时长
        // 如果前端传的时间比现在还早，说明没有增加时长，设为0
        // $secondsToAdd = $inputDate->isPast() ? 0 : $now->diffInSeconds($inputDate);
        // 第二个参数 false 表示允许返回负数 (signed integer)
        $secondsToAdd = $now->diffInSeconds($inputDate, false);

        // B. 查询该用户在该群组现有的过期时间
        $existingRecord = $this->db->table('group_expiration')
            ->where('user_id', $userId)
            ->where('group_id', $groupId)
            ->first();

        // 解析现有时间
        $existingExpiration = $existingRecord ? Carbon::parse($existingRecord->expiration_date) : null;

        // C. 确定“计算起点”
        // 如果现有时间存在且还在未来（没过期），则在现有时间基础上叠加
        // 否则（没记录或已过期），从“现在”开始叠加
        if ($existingExpiration && $existingExpiration->isFuture()) {
            $baseDate = $existingExpiration;
        } else {
            $baseDate = $now;
        }

        // D. 算出最终的新过期时间
        // 注意：这里必须使用 copy()，否则会修改原对象
        $finalDate = $baseDate->copy()->addSeconds($secondsToAdd);

        // ================= 核心修改逻辑结束 =================

        // 4. 写入数据库
        $this->db->table('group_expiration')->updateOrInsert(
            [
                'user_id' => $userId,
                'group_id' => $groupId
            ],
            [
                'expiration_date' => $finalDate, // 使用计算后的最终时间
                'created_at' => $now,
                'updated_at' => $now
            ]
        );

        // 5. 将用户加入群组
        $user = User::find($userId);
        if ($user) {
            $user->groups()->syncWithoutDetaching([$groupId]);
        }

        return new EmptyResponse();
    }
}