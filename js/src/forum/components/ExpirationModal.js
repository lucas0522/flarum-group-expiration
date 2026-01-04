import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/forum/app';

export default class ExpirationModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.user = this.attrs.user;

    // 获取后端传来的现有过期数据 (JSON对象: {groupId: '2025-10-01'})
    this.existingExpirations = this.user.attribute('groupExpirations') || {};

    this.groupId = Stream('');
    this.mode = Stream('set'); // 'set' = 覆盖, 'add' = 加减
    this.date = Stream(''); // 最终提交给后端的日期
    this.days = Stream(''); // 输入框里的天数
    this.currentExpiration = Stream(null); // 当前选中群组的旧过期时间
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
        {/* 1. 选择群组 */}
        <div className="Form-group">
          <label>选择群组</label>
          <select
            className="FormControl"
            value={this.groupId()}
            onchange={e => this.onGroupChange(e.target.value)}
          >
            <option value="" disabled>请选择...</option>
            {app.store.all('groups')
              .filter(g => !['2', '3'].includes(g.id())) // 排除游客和普通会员
              .map(group => (
                <option key={group.id()} value={group.id()}>
                  {group.namePlural()}
                  {/* 如果该群组已有过期时间，显示一个小标记 */}
                  {this.existingExpirations[group.id()] ? ' (生效中)' : ''}
                </option>
              ))}
          </select>
        </div>

        {/* 显示当前状态 */}
        {this.groupId() && (
          <div className="Form-group">
            <label>当前状态</label>
            <div className="HelpText" style={{ marginTop: 0 }}>
              {this.currentExpiration()
                ? `📅 当前过期时间: ${this.currentExpiration()}`
                : '⚪ 该群组目前没有设置过期时间 (永久或未加入)'}
            </div>
          </div>
        )}

        {/* 2. 模式选择 (只有当存在旧日期时才显示) */}
        {this.currentExpiration() && (
          <div className="Form-group">
            <label>操作模式</label>
            <div className="Select">
              <select
                className="FormControl"
                value={this.mode()}
                onchange={e => {
                  this.mode(e.target.value);
                  this.recalculate(); // 切换模式时重新计算
                }}
              >
                <option value="set">🔄 重新设置 (覆盖旧日期)</option>
                <option value="add">➕ / ➖ 增加或减少天数</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. 输入天数 */}
        <div className="Form-group">
          <label>
            {this.mode() === 'add' && this.currentExpiration() ? '增加天数 (输入负数为减少)' : '过期时长 (天数)'}
          </label>
          <input
            type="number"
            className="FormControl"
            placeholder={this.mode() === 'add' ? "例如: 30 (续费30天) 或 -5 (扣除5天)" : "例如: 30 (从今天起算)"}
            value={this.days()}
            oninput={e => {
              this.days(e.target.value);
              this.recalculate();
            }}
          />
        </div>

        {/* 4. 结果预览 */}
        <div className="Form-group">
          <label>结果预览 (提交后的日期)</label>
          <input
            type="date"
            className="FormControl"
            disabled // 这个框设为只读，防止手动改乱了
            value={this.date()}
          />
          <div className="HelpText">
             {this.date() ? `提交后，用户将在 ${this.date()} 过期` : '请输入天数...'}
          </div>
        </div>

        <div className="Form-group">
          {Button.component({
            type: 'submit',
            className: 'Button Button--primary',
            disabled: !this.groupId() || !this.date()
          }, '保存设置')}
        </div>
      </div>
    );
  }

  // 当群组改变时
  onGroupChange(groupId) {
    this.groupId(groupId);
    // 从后端数据中查找该群组的过期时间
    const oldDate = this.existingExpirations[groupId] || null;
    this.currentExpiration(oldDate);

    // 如果没有旧日期，强制切换回“设置”模式
    if (!oldDate) {
      this.mode('set');
    }

    // 清空输入
    this.days('');
    this.date('');
  }

  // 核心计算逻辑
  recalculate() {
    const daysInput = parseInt(this.days());
    if (isNaN(daysInput)) {
      this.date('');
      return;
    }

    let baseDate;

    // 逻辑分支
    if (this.mode() === 'add' && this.currentExpiration()) {
      // 模式 A: 续费 (基于旧日期)
      baseDate = new Date(this.currentExpiration());
    } else {
      // 模式 B: 覆盖 (基于今天)
      baseDate = new Date();
    }

    // 执行加减法
    baseDate.setDate(baseDate.getDate() + daysInput);

    // 格式化输出 YYYY-MM-DD
    const result = baseDate.toISOString().split('T')[0];
    this.date(result);
  }

  onsubmit(e) {
    e.preventDefault();
    this.loading = true;

    app.request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/group-expiration',
      body: {
        userId: this.user.id(),
        groupId: this.groupId(),
        expirationDate: this.date() // 我们直接提交计算好的最终日期
      }
    }).then(() => {
      this.hide();
      app.alerts.show({ type: 'success' }, '设置成功！');
      window.location.reload();
    }).catch(() => {
      this.loading = false;
      m.redraw();
    });
  }
}
