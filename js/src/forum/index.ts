import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import UserCard from 'flarum/forum/components/UserCard';
import SettingsPage from 'flarum/forum/components/SettingsPage';
import icon from 'flarum/common/helpers/icon';
import fullTime from 'flarum/common/helpers/fullTime';

// 引入你的两个 Modal 组件
import ExpirationModal from './components/ExpirationModal';
import RedeemModal from './components/RedeemModal';

app.initializers.add('hertz-dev-group-expiration', () => {

  // ============================
  // 1. 用户设置页面：添加“兑换权益”按钮
  // ============================
  extend(SettingsPage.prototype, 'accountItems', function(items) {
    items.add('redeem-code', Button.component({
      className: 'Button',
      icon: 'fas fa-gift',
      onclick: () => app.modal.show(RedeemModal)
    }, '兑换权益'));
  });

  // ============================
  // 2. 管理员视角：添加“设置过期时间”按钮
  // ============================
  extend(UserControls, 'userControls', function(items, user) {
    const currentUser = app.session.user;
    if (!currentUser) return;

    // 检查权限
    const canEdit = user.attribute('canSetGroupExpiration');
    if (!canEdit) return;

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, app.translator.trans('hertz-dev-group-expiration.forum.user_controls.edit_button')));
  });

  // ============================
  // 3. 用户卡片：显示到期时间
  // ============================
  extend(UserCard.prototype, 'infoItems', function(items) {
    const user = this.attrs.user;
    const expiration = user.attribute('groupExpiration');

    if (expiration) {
      items.add('groupExpiration', m('span', { className: 'UserCard-group-expiration' }, [
        icon('fas fa-hourglass-half'),
        ' ',
        app.translator.trans('hertz-dev-group-expiration.forum.user_card.expiration_label', {
          date: fullTime(expiration)
        })
      ]));
    }
  });

});
