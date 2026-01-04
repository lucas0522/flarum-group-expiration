import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {
  extend(UserControls, 'userControls', function(items, user) {

    // 1. 获取当前用户
    const currentUser = app.session.user;

    // 2. 只要有用户（已登录），就继续，绝不退出！
    if (!currentUser) return;

    console.log('🚀 强制渲染模式启动：不管 User 对象是否损坏，均加载按钮');

    // 3. 直接添加按钮 (删除了所有的 if 检查)
    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => {
          console.log('按钮被点击，准备打开弹窗', user);
          app.modal.show(ExpirationModal, { user: user });
      },
    }, '设置群组过期时间'));

  });
});
