import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import UserCard from 'flarum/forum/components/UserCard';
import icon from 'flarum/common/helpers/icon';
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {

  // ============================
  // 功能 1: 在下拉菜单添加设置按钮
  // ============================
  extend(UserControls, 'userControls', function(items, user) {
    // 🛑 防御性检查 1: 如果目标用户还没加载出来，直接跳过
    if (!user) return;

    // 🛑 防御性检查 2: 如果当前还没登录，直接跳过
    const currentUser = app.session.user;
    if (!currentUser) return;

    // 正常逻辑
    const canEdit = user.attribute('canSetGroupExpiration');
    if (!canEdit) return;

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, '设置群组过期时间'));
  });

  // ============================
  // 功能 2: 在用户卡片显示有效期
  // ============================
  extend(UserCard.prototype, 'infoItems', function(items) {
    const user = this.attrs.user;

    // 🛑 防御性检查 3: 核心修复点！
    // 页面加载瞬间 user 可能是 undefined，必须拦截，否则报错
    if (!user) return;

    const expirations = user.attribute('groupExpirations');
    if (!expirations) return;

    const groupIds = Object.keys(expirations);

    groupIds.forEach(groupId => {
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
