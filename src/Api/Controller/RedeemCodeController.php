<?php

namespace HertzDev\GroupExpiration\Api\Controller;

use Flarum\User\Exception\NotAuthenticatedException;
use Flarum\Http\RequestUtil;
use Illuminate\Database\ConnectionInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Illuminate\Support\Arr;
use Carbon\Carbon;
use Flarum\Foundation\ValidationException;

class RedeemCodeController implements RequestHandlerInterface
{
    protected $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // 1. 获取当前用户
        $actor = RequestUtil::getActor($request);
        if (!$actor->exists) {
            throw new NotAuthenticatedException();
        }

        // 2. 获取提交的兑换码
        $body = $request->getParsedBody();
        $codeString = Arr::get($body, 'code');

        if (empty($codeString)) {
            throw new ValidationException(['code' => '请输入兑换码']);
        }

        // 3. 查找并验证兑换码
        $codeRecord = $this->db->table('redemption_codes')->where('code', $codeString)->first();

        if (!$codeRecord) {
            throw new ValidationException(['code' => '兑换码不存在']);
        }

        if ($codeRecord->is_used) {
            throw new ValidationException(['code' => '该兑换码已被使用']);
        }

        // === 核心逻辑开始 ===
        $this->db->beginTransaction();

        try {
            // A. 将用户加入群组 (如果不在的话)
            if (!$actor->groups->contains($codeRecord->group_id)) {
                $actor->groups()->attach($codeRecord->group_id);
            }

            // B. 计算新的过期时间
            // 先去你的 group_expiration 表里查，看他是不是已经是会员了
            $currentExpiration = $this->db->table('group_expiration')
                ->where('user_id', $actor->id)
                ->where('group_id', $codeRecord->group_id)
                ->value('expiration_date');

            $now = Carbon::now(); // 使用 UTC，保持数据库一致性

            if ($currentExpiration && Carbon::parse($currentExpiration)->gt($now)) {
                // 情况1: 用户还没过期，给他“续费” (在原有时间上增加天数)
                $newDate = Carbon::parse($currentExpiration)->addDays($codeRecord->days);
            } else {
                // 情况2: 用户是新的，或者已经过期了 (从现在开始算)
                $newDate = $now->addDays($codeRecord->days);
            }

            // C. 更新或插入过期时间表
            $this->db->table('group_expiration')->updateOrInsert(
                ['user_id' => $actor->id, 'group_id' => $codeRecord->group_id],
                [
                    'expiration_date' => $newDate->toDateTimeString(),
                    'updated_at' => Carbon::now(),
                    // 如果是新插入的，created_at 也要填
                    'created_at' => Carbon::now()
                ]
            );

            // D. 标记兑换码为已使用
            $this->db->table('redemption_codes')->where('id', $codeRecord->id)->update([
                'is_used' => true,
                'used_by' => $actor->id,
                'used_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);

            $this->db->commit();

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw new ValidationException(['code' => '兑换失败：' . $e->getMessage()]);
        }
        // === 核心逻辑结束 ===

        return new JsonResponse([
            'success' => true,
            'message' => '兑换成功！群组有效期已延长至 ' . $newDate->toDateTimeString()
        ]);
    }
}
