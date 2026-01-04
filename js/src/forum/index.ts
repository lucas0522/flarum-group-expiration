import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {
  extend(UserControls, 'userControls', function(items, user) {

    const currentUser = app.session.user;

    // 🔍 调试探针：让我们看看这个“假用户”到底长什么样
    if (currentUser && typeof currentUser.can !== 'function') {
      console.error('😱 严重错误：当前用户对象丢失了 Model 方法！', currentUser);
      return; // 遇到这种情况直接跑路，防止页面崩溃
    }

    // 🛡️ 标准检查：现在安全了
    if (!currentUser || !currentUser.can('hertz-dev.group-expiration.edit')) {
      return;
    }

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));

  });
});
