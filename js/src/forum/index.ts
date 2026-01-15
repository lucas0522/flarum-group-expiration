import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import Button from 'flarum/common/components/Button';
import UserCard from 'flarum/forum/components/UserCard'; // 👈 新增引入
import icon from 'flarum/common/helpers/icon'; // 👈 新增引入
import fullTime from 'flarum/common/helpers/fullTime'; // 👈 新增引入：用于格式化时间
import ExpirationModal from './components/ExpirationModal';

app.initializers.add('hertz-dev-group-expiration', () => {

  // ============================
  // 1. 现有的功能：添加“设置”按钮
  // ============================
  extend(UserControls, 'userControls', function(items, user) {
    const currentUser = app.session.user;
    if (!currentUser) return;

    const canEdit = user.attribute('canSetGroupExpiration');

    if (!canEdit) return;

    items.add('expiration', Button.component({
      icon: 'fas fa-clock',
      onclick: () => app.modal.show(ExpirationModal, { user: user }),
    }, app.translator.trans('hertz-dev-group-expiration.forum.user_controls.edit_button')));
    // ↑ 建议这里也换成翻译 key，如果暂时没有，保留你原来的中文字符串 '设置群组过期时间' 也可以
  });

  // ============================
  // 2. 新增功能：在用户卡片显示到期时间
  // ============================
  extend(UserCard.prototype, 'infoItems', function(items) {
    const user = this.attrs.user;

    // 获取后端传来的 groupExpiration 属性
    // 如果没有权限查看，后端不会返回这个字段，这里就是 undefined，逻辑自动跳过
    const expiration = user.attribute('groupExpiration');

    if (expiration) {
      items.add('groupExpiration', m('span', { className: 'UserCard-group-expiration' }, [
        icon('fas fa-hourglass-half'), // 图标，可以自己换
        ' ',
        // 这里使用翻译文件，格式为 "群组到期：{date}"
        app.translator.trans('hertz-dev-group-expiration.forum.user_card.expiration_label', {
          // date: fullTime(expiration)
          date: expiration.split('T')[0]
        })
      ]));
    }
  });

});
