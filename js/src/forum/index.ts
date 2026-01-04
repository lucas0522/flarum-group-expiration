import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import ExpirationModal from './components/ExpirationModal.js';

app.initializers.add('hertz-dev-group-expiration', () => {
  extend(UserControls, 'userControls', function(items, user) {

    // 👇 新增：如果没有权限，直接结束，不添加按钮
    if (!app.session.user || !app.session.user.can('hertz-dev.group-expiration.edit')) {
      return;
    }

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));

  });
});
