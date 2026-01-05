import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {
  extend(UserControls, 'userControls', function(items, user) {

    // 1. 基础防空检查
    if (!user) return;
    const currentUser = app.session.user;
    if (!currentUser) return;

    // 2. 读取后端权限属性 (如果没有这个属性，说明没权限或没登录)
    // 使用可选链写法 ?. 防止 DPlayer 破坏 User 对象导致的报错
    const canEdit = user.attribute?.('canSetGroupExpiration');

    if (!canEdit) return;

    // 3. 添加按钮
    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));
  });
});
