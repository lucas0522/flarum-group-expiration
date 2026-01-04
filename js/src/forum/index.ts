import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import UserCard from 'flarum/forum/components/UserCard';
import icon from 'flarum/common/helpers/icon';
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {

  // 1. 设置按钮逻辑
  extend(UserControls, 'userControls', function(items, user) {
    // 🛡️ 终极防御：如果 user 是空的，或者 user.attribute 方法丢失，直接跑路
    if (!user || typeof user.attribute !== 'function') return;

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

  // 2. 个人主页显示逻辑
  extend(UserCard.prototype, 'infoItems', function(items) {
    const user = this.attrs.user;

    // 🛡️ 终极防御：同上，没有 user 绝不执行
    if (!user || typeof user.attribute !== 'function') return;

    // 安全读取，即使后端返回空数组也没事
    const expirations = user.attribute('groupExpirations');

    // 检查是否为空对象或空数组
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
