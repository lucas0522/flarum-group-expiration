import app from 'flarum/admin/app';
import RedemptionCodePage from './pages/RedemptionCodePage';

app.initializers.add('hertz-dev-group-expiration', () => {
  app.extensionData
    .for('hertz-dev-group-expiration')
    .registerPermission({
      icon: 'fas fa-clock',
      label: '允许编辑会员过期时间',
      permission: 'hertz-dev.group-expiration.edit',
    }, 'moderate')
    // 👇 核心改变：注册为扩展的自定义页面，而不是简单的 Setting
    .registerPage(RedemptionCodePage);
});
