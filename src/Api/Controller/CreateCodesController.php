<?php

namespace HertzDev\GroupExpiration\Api\Controller;

use Flarum\Http\RequestUtil;
use Flarum\User\Exception\PermissionDeniedException;
use Illuminate\Support\Arr;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
use HertzDev\GroupExpiration\Model\RedemptionCode;
use Illuminate\Support\Str;

class CreateCodesController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        // 1. 权限检查
        if (!$actor->can('hertz-dev.group-expiration.edit')) {
            throw new PermissionDeniedException();
        }

        $data = $request->getParsedBody();
        $groupId = Arr::get($data, 'group_id');
        $days = Arr::get($data, 'days');
        $amount = (int) Arr::get($data, 'amount', 1);

        // 简单的验证
        if (!$groupId || !$days || $amount < 1) {
            return new JsonResponse(['error' => 'Invalid parameters'], 400);
        }

        $createdCodes = []; // 用于存储生成的码

        // 2. 批量生成
        for ($i = 0; $i < $amount; $i++) {
            $code = new RedemptionCode();
            // 生成随机唯一码 (12位随机字符)
            $code->code = strtoupper(Str::random(12));
            $code->group_id = $groupId;
            $code->days = $days;
            $code->is_used = false;
            $code->created_at =  date('Y-m-d H:i:s'); // Flarum 可能自动处理，显式加一下保险

            $code->save();

            // 将生成的纯文本码放入数组
            $createdCodes[] = $code->code;
        }

        // 3. 返回生成的码列表给前端
        return new JsonResponse([
            'status' => 'success',
            'count' => count($createdCodes),
            'codes' => $createdCodes // 关键修改：返回具体数据
        ]);
    }
}
