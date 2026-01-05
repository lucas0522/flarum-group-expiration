import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {
  extend(UserControls, 'userControls', function(items, user) {

    // 1. 获取当前登录用户
    const currentUser = app.session.user;

    if (!currentUser) return;

    // 2. 【核心修改】直接读取后端计算好的属性
    const canEdit = user.attribute('canSetGroupExpiration');

    // 3. 调试一下（可选）
    // console.log('后端告诉我有权操作吗？', canEdit);

    // 4. 权限不足则退出
    if (!canEdit) return;

    // 5. 添加按钮
    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));

  });
});
// 👆 之前你的代码这里少了一个 ); 导致编译报错
