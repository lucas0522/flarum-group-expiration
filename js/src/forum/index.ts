import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import ExpirationModal from './components/ExpirationModal'; // <--- 1. 引入新文件

app.initializers.add('hertz-dev-group-expiration', () => {
  extend(UserControls, 'userControls', function(items, user) {

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      // 2. 修改点击事件：显示弹窗，并把当前 user 传进去
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));

  });
});
