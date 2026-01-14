import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/forum/app';

export default class RedeemModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.code = Stream('');
    this.loading = false;
  }

  className() {
    return 'RedeemModal Modal--small';
  }

  title() {
    return '兑换群组权益';
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form-group">
          <label>请输入您的兑换码</label>
          <input
            className="FormControl"
            placeholder="例如：VIP-8888"
            bidi={this.code}
            disabled={this.loading}
          />
        </div>

        <div className="Form-group">
          <Button
            className="Button Button--primary Button--block"
            loading={this.loading}
            onclick={this.onsubmit.bind(this)}
          >
            立即兑换
          </Button>
        </div>
      </div>
    );
  }

  onsubmit(e) {
    e.preventDefault();
    this.loading = true;

    app.request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/redemption/redeem',
      body: { code: this.code() },
      errorHandler: this.onerror.bind(this)
    })
    .then((response) => {
      this.loading = false;
      app.modal.close();
      app.alerts.show({ type: 'success' }, response.message);
      // 刷新页面以更新权限显示
      window.location.reload();
    })
    .catch(() => {
      this.loading = false;
      m.redraw();
    });
  }
}
