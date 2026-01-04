import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import UserCard from 'flarum/forum/components/UserCard'; // 确保引入了 UserCard
import icon from 'flarum/common/helpers/icon';         // 确保引入了 icon
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {

  // 1. 下拉菜单按钮
  extend(UserControls, 'userControls', function(items, user) {
    // 🛡️【核心修复】防弹衣：如果 user 是空的，直接退出，防止报错
    if (!user) return;

    const currentUser = app.session.user;
    if (!currentUser) return;

    // 安全读取
    const canEdit = user.attribute('canSetGroupExpiration');
    if (!canEdit) return;

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));
  });

  // 2. 个人主页显示
  extend(UserCard.prototype, 'infoItems', function(items) {
    const user = this.attrs.user;

    // 🛡️【核心修复】防弹衣：同上
    if (!user) return;

    const expirations = user.attribute('groupExpirations');
    if (!expirations || Object.keys(expirations).length === 0) return;

    Object.keys(expirations).forEach(groupId => {
      const group = app.store.getById('groups', groupId);
      if (group) {
        items.add(`expiration-${groupId}`, m('span.UserCard-expiration', {
            style: { margin: '5px 0', display: 'block' }
        }, [
          icon('fas fa-hourglass-half'),
          ' ',
          group.nameSingular(),
          ': ',
          m('strong', expirations[groupId]),
          ' 到期'
        ]));
      }
    });
  });
});
