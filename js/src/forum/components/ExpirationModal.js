import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/forum/app';

export default class ExpirationModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.user = this.attrs.user;

    this.groupId = Stream('');
    this.date = Stream(''); // 最终提交的日期 (YYYY-MM-DD)
    this.days = Stream(''); // 辅助用的天数
  }

  className() {
    return 'ExpirationModal Modal--small';
  }

  title() {
    return '设置群组过期时间';
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form-group">
          <label>选择群组</label>
          <select
            className="FormControl"
            value={this.groupId()}
            onchange={e => this.groupId(e.target.value)}
          >
            {/* 修复1：删除了 selected 属性，只保留 disabled */}
            <option value="" disabled>请选择...</option>

            {app.store.all('groups')
              .filter(g => g.id() !== '2' && g.id() !== '3')
              .map(group => (
                // 修复2：加上 key 属性，防止渲染混乱
                <option key={group.id()} value={group.id()}>
                  {group.namePlural()}
                </option>
              ))}
          </select>
        </div>

        {/* 核心改动：增加了两个输入框的联动 */}
        <div className="Form-group">
          <label>过期时长 (天数)</label>
          <input
            type="number"
            className="FormControl"
            placeholder="例如: 30"
            value={this.days()}
            oninput={e => this.syncDate(e.target.value)} // 输入天数 -> 自动算日期
          />
        </div>

        <div className="Form-group">
          <label>过期日期 (自动计算)</label>
          <input
            type="date"
            className="FormControl"
            value={this.date()}
            onchange={e => this.syncDays(e.target.value)} // 选日期 -> 自动算天数
          />
        </div>

        <div className="Form-group">
          {Button.component({
            type: 'submit',
            className: 'Button Button--primary',
            disabled: !this.groupId() || !this.date() // 没填完禁止提交
          }, '保存设置')}
        </div>
      </div>
    );
  }

  // 输入天数，自动计算日期
  syncDate(days) {
    this.days(days);
    if (!days) {
      this.date('');
      return;
    }

    const date = new Date();
    date.setDate(date.getDate() + parseInt(days));

    // 格式化为 YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];
    this.date(dateString);
  }

  // 选择日期，自动反推天数
  syncDays(dateString) {
    this.date(dateString);
    if (!dateString) {
      this.days('');
      return;
    }

    const today = new Date();
    const targetDate = new Date(dateString);

    // 计算时间差 (毫秒 -> 天)
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.days(diffDays > 0 ? diffDays : 0);
  }

  onsubmit(e) {
    e.preventDefault();

    // 按钮变更为加载状态
    this.loading = true;

    // 发送请求
    app.request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/group-expiration',
      body: {
        userId: this.user.id(),
        groupId: this.groupId(),
        expirationDate: this.date()
      }
    }).then(() => {
      // 成功后：
      this.hide(); // 关闭弹窗
      app.alerts.show({ type: 'success' }, '设置成功！用户已加入群组并设定了过期时间。');
      window.location.reload(); // 刷新页面看效果
    }).catch(() => {
      this.loading = false;
      m.redraw();
    });
  }
}
