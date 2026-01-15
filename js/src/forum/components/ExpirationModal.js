import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/forum/app';

export default class ExpirationModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.user = this.attrs.user;
    
    // 获取后端传来的过期时间映射表
    this.expirations = this.user.attribute('groupExpirations') || {};

    this.groupId = Stream('');
    this.days = Stream(''); // 只保留天数作为输入
    
    // 界面显示用的流
    this.currentExpirationLabel = Stream('请选择群组查看');
    this.newExpirationLabel = Stream('-'); 
    
    // 最终提交给后端的数据
    this.computedDate = ''; 
  }

  className() {
    return 'ExpirationModal Modal--small';
  }

  title() {
    return '延长群组有效期';
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
              .filter(g => g.id() !== '2' && g.id() !== '3')
              .map(group => (
                <option key={group.id()} value={group.id()}>
                  {group.namePlural()}
                </option>
              ))}
          </select>
        </div>

        {/* 2. 信息展示区：当前状态 */}
        <div className="Form-group" style="background: #f9f9f9; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
            <label style="font-size: 12px; color: #666; margin-bottom: 2px;">当前有效期</label>
            <div style="font-weight: bold; color: #333;">
                {this.currentExpirationLabel()}
            </div>
        </div>

        {/* 3. 操作区：充值天数 */}
        <div className="Form-group">
          <label>增加时长 (天数)</label>
          <input
            type="number"
            className="FormControl"
            placeholder="例如: 30"
            value={this.days()}
            oninput={e => this.calcNewDate(e.target.value)}
            disabled={!this.groupId()} // 没选群组不能填
          />
          <div className="helpText">输入负数可以减少时长。</div>
        </div>

        {/* 4. 预览区：结果预览 */}
        <div className="Form-group" style="background: #e8f3ff; padding: 10px; border-radius: 5px; border: 1px solid #d0e3f5;">
            <label style="font-size: 12px; color: #4d698e; margin-bottom: 2px;">预计新有效期</label>
            <div style="font-weight: bold; color: #2b4566; font-size: 1.1em;">
                {this.newExpirationLabel()}
            </div>
        </div>

        <div className="Form-group">
          {Button.component({
            type: 'submit',
            className: 'Button Button--primary',
            disabled: !this.groupId() || !this.days(),
            loading: this.loading
          }, '确认保存')}
        </div>
      </div>
    );
  }

  // 切换群组时
  onGroupChange(groupId) {
    this.groupId(groupId);
    
    // 更新“当前有效期”显示
    const existingDateStr = this.expirations[groupId];
    if (existingDateStr) {
        const d = new Date(existingDateStr);
        // this.currentExpirationLabel(d.toLocaleDateString() + ' ' + d.toLocaleTimeString());
        // 只显示日期
        this.currentExpirationLabel(d.toLocaleDateString());
    } else {
        this.currentExpirationLabel('当前无有效期 (将从现在开始计算)');
    }

    // 如果天数框里有数字，重新计算预览
    this.calcNewDate(this.days());
  }

  // 计算新的日期（仅用于预览和提交）
  calcNewDate(days) {
    this.days(days);
    
    if (!days || !this.groupId()) {
      this.newExpirationLabel('-');
      this.computedDate = '';
      return;
    }

    // 1. 确定基准时间
    const now = new Date();
    let baseDate = now;
    
    // 如果有现有记录，且在未来，则以现有记录为基准
    if (this.expirations[this.groupId()]) {
        const existing = new Date(this.expirations[this.groupId()]);
        if (existing > now) {
            baseDate = existing;
        }
    }

    // 2. 加上天数
    const targetDate = new Date(baseDate.getTime());
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    // 3. 更新预览文字
    this.newExpirationLabel(targetDate.toLocaleDateString()); // 显示友好格式
    
    // 4. 保存 ISO 格式用于提交 (后端逻辑需要这个)
    // 即使后端现在做差值计算，我们发给它算好的日期也是最安全的，
    // 因为这符合 Controller 里 $inputDate->isPast() 的判断逻辑。
    this.computedDate = targetDate.toISOString();
  }

  onsubmit(e) {
    e.preventDefault();
    this.loading = true;

    // 我们这里要稍微“欺骗”一下后端逻辑
    // 为了配合之前的 Controller (它计算 InputDate - Now = Duration)，
    // 我们需要把前端算出来的“新日期”发给它。
    
    // 但是！Controller 的逻辑是：新日期 = Max(现有, Now) + (Input - Now)
    // 这会导致双重计算。
    
    // 为了不改动后端复杂的逻辑，最简单的方法是：
    // 前端直接发一个日期，让后端算出差值即可。
    // 我们在这个 calcNewDate 里算出的 targetDate 其实就是 result。
    // 但后端会用 (Target - Now) 作为增量。
    
    // 让我们再看一眼后端代码：
    // $secondsToAdd = $inputDate->isPast() ? 0 : $now->diffInSeconds($inputDate);
    // $finalDate = $baseDate->copy()->addSeconds($secondsToAdd);
    
    // 这是一个巧妙的数学题：
    // 如果我们发给后端的是 "Now + 30 days" 的日期。
    // 后端算出 secondsToAdd = 30 days。
    // 后端 baseDate = Existing Date。
    // Result = Existing Date + 30 days。
    // 完美！逻辑通顺。
    
    // 所以，我们只需要构造一个 "基于现在 + days" 的日期发给后端即可
    // 而不是 "基于 Existing + days" 的日期。
    
    const now = new Date();
    const submissionDate = new Date(now.getTime());
    submissionDate.setDate(submissionDate.getDate() + parseInt(this.days()));

    app.request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/group-expiration',
      body: {
        userId: this.user.id(),
        groupId: this.groupId(),
        expirationDate: submissionDate.toISOString() // 发送基于今天的增量日期
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