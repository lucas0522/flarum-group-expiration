import app from 'flarum/admin/app';

app.initializers.add('hertz-dev-group-expiration', () => {
  app.extensionData
    .for('hertz-dev-flarum-group-expiration')

    // 1. 注册编辑权限 (对应 zh.yml 中的 edit_date)
    .registerPermission({
      icon: 'fas fa-clock', // 图标
      label: app.translator.trans('hertz-dev-group-expiration.admin.permissions.edit_date'),
      permission: 'hertz-dev.group-expiration.edit',
    }, 'moderate') // 建议归类到 'moderate' (版务) 或 'start' (常规)

    // 2. 注册查看权限 (对应 zh.yml 中的 view_date)
    // 只有拥有此权限的角色才能在用户卡片上看到日期
    .registerPermission({
      icon: 'fas fa-eye',
      label: app.translator.trans('hertz-dev-group-expiration.admin.permissions.view_date'),
      permission: 'hertz-group-expiration.view-date', // ⚠️ 必须与 AddUserAttributes.php 中的 key 一致
    }, 'view'); // 建议归类到 'view' (查看)
});
