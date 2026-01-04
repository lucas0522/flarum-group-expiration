import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import UserCard from 'flarum/forum/components/UserCard'; // 👈 新增引入
import icon from 'flarum/common/helpers/icon';         // 👈 新增引入
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {

  // ============================
  // 功能 1: 在下拉菜单添加设置按钮
  // ============================
  extend(UserControls, 'userControls', function(items, user) {
    // 1. 获取当前登录用户
    const currentUser = app.session.user;
    if (!currentUser) return;

    // 2. 读取后端权限属性
    const canEdit = user.attribute('canSetGroupExpiration');

    // 3. 权限不足则退出
    if (!canEdit) return;

    // 4. 添加按钮
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

    // 获取后端传来的过期数据
    const expirations = user.attribute('groupExpirations');

    // 如果没有数据（或者是别人在看你的主页且没权限），直接结束
    if (!expirations) return;

    const groupIds = Object.keys(expirations);

    // 遍历每一个有过期时间的群组
    groupIds.forEach(groupId => {
      // 从 Flarum 本地缓存获取群组详情（为了拿群组名字）
      const group = app.store.getById('groups', groupId);

      // 如果群组存在
      if (group) {
        items.add(`expiration-${groupId}`, m('span.UserCard-expiration', {
            style: { margin: '5px 0', display: 'block' } // 稍微加点样式防止挤在一起
        }, [
          icon('fas fa-hourglass-half'), // 图标
          ' ',
          group.nameSingular(), // 群组名 (例如 "VIP")
          ': ',
          m('strong', expirations[groupId]), // 日期 (例如 "2026-05-20")
          ' 到期'
        ]));
      }
    });
  });

});
