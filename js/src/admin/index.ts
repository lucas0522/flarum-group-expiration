import app from 'flarum/admin/app';

app.initializers.add('hertz-dev-group-expiration', () => {
  app.extensionData
    .for('hertz-dev-flarum-group-expiration') // 👈 必须改成这个！加上 flarum-
    .registerPermission({
      icon: 'fas fa-clock',
      label: '允许设置用户群组过期时间',
      permission: 'hertz-dev.group-expiration.edit',
    }, 'moderate');
});
