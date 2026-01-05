import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/forum/app';

export default class ExpirationModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.user = this.attrs.user;
    this.groupId = Stream('');
    this.days = Stream('');
    this.date = Stream('');
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
            <option value="" disabled>请选择...</option>
            {app.store.all('groups')
              .filter(g => !['2', '3'].includes(g.id()))
              .map(group => (
                <option key={group.id()} value={group.id()}>
                  {group.namePlural()}
                </option>
              ))}
          </select>
        </div>

        <div className="Form-group">
          <label>过期时长 (天数)</label>
          <input
            type="number"
            className="FormControl"
            placeholder="例如: 30"
            value={this.days()}
            oninput={e => {
              this.days(e.target.value);
              this.updateDate();
            }}
          />
        </div>

        <div className="Form-group">
          <label>结果预览</label>
          <input
            type="text"
            className="FormControl"
            disabled
            value={this.date() ? `将于 ${this.date()} 过期` : ''}
          />
        </div>

        <div className="Form-group">
          <Button
            type="submit"
            className="Button Button--primary"
            disabled={!this.groupId() || !this.days()}
          >
            保存设置
          </Button>
        </div>
      </div>
    );
  }

  updateDate() {
    const days = parseInt(this.days());
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      this.date(date.toISOString().split('T')[0]);
    } else {
      this.date('');
    }
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
        expirationDate: this.date()
      }
    }).then(() => {
      this.hide();
      app.alerts.show({ type: 'success' }, '设置成功！');
    }).catch(() => {
      this.loading = false;
      m.redraw();
    });
  }
}
