<?php

namespace HertzDev\GroupExpiration\Api\Controller;

use Flarum\Http\RequestUtil;
use Flarum\User\Exception\PermissionDeniedException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
// 👇 关键：引入你刚才新建的模型
use HertzDev\GroupExpiration\Model\RedemptionCode;
use Illuminate\Support\Arr;

class ListCodesController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        // 1. 权限检查
        if (!$actor->can('hertz-dev.group-expiration.edit')) {
            throw new PermissionDeniedException();
        }

        // 2. 获取前端传来的参数 (分页、搜索)
        $params = $request->getQueryParams();
        $limit = Arr::get($params, 'limit', 20);
        $offset = Arr::get($params, 'offset', 0);
        $search = Arr::get($params, 'q');

        // 3. 构建查询 (使用新的 RedemptionCode 模型)
        $query = RedemptionCode::query();

        // 如果有搜索词
        if ($search) {
            $query->where('code', 'like', "%$search%");
        }

        // 获取总数
        $total = $query->count();

        // 4. 获取数据列表
        // 关键点：orderBy('id', 'desc') 确保最新的码排在最前面
        $codes = $query->orderBy('id', 'desc')
                       ->skip($offset)
                       ->take($limit)
                       ->get();

        // 5. 返回数据
        return new JsonResponse([
            'data' => $codes,
            'meta' => [
                'total' => $total
            ]
        ]);
    }
}
