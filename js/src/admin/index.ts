import app from 'flarum/admin/app';

app.initializers.add('hertz-dev-group-expiration', () => {
  // 注册一个新的权限
  app.extensionData
    .for('hertz-dev-group-expiration') // 你的扩展ID (composer.json里的 name，去掉 @ /)
    .registerPermission({
      icon: 'fas fa-clock', // 图标
      label: '允许设置用户群组过期时间', // 权限名称
      permission: 'hertz-dev.group-expiration.edit', // 🔑 关键：权限的唯一标识符
    }, 'moderate'); // 'moderate' 表示把这个选项放在“版务”栏目里
});
