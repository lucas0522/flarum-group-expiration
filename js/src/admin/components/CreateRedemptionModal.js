import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/admin/app';

export default class CreateRedemptionModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    // 表单数据
    this.groupId = Stream('');
    this.days = Stream('');
    this.amount = Stream('1');

    // 状态控制
    this.loading = false;
    this.generatedCodes = null; // 存储生成后的结果
  }

  className() {
    return 'Modal--small';
  }

  title() {
    return this.generatedCodes ? '生成成功' : '生成兑换码';
  }

  content() {
    // === 场景 2：生成成功，显示导出界面 ===
    if (this.generatedCodes) {
        const codesText = this.generatedCodes.join('\n');

        return m('.Modal-body', [
            m('.Form-group', [
                m('p', {style: 'color: #109e59; font-weight: bold; text-align: center; margin-bottom: 15px;'},
                    `🎉 成功生成 ${this.generatedCodes.length} 个兑换码！`
                ),
                m('textarea.FormControl', {
                    style: 'height: 200px; font-family: monospace; font-size: 13px; line-height: 1.5;',
                    readonly: true,
                    onclick: (e) => e.target.select() // 点击自动全选
                }, codesText)
            ]),

            m('.Form-group', { style: 'display: flex; gap: 10px;' }, [
                // 复制按钮
                m(Button, {
                    className: 'Button Button--primary Button--block',
                    onclick: () => {
                        navigator.clipboard.writeText(codesText);
                        app.alerts.show({type: 'success'}, '已复制所有兑换码');
                    }
                }, '一键复制'),

                // 下载按钮
                m(Button, {
                    className: 'Button Button--block',
                    onclick: () => this.downloadTxt(codesText)
                }, '下载 TXT'),
            ]),

            // 关闭按钮（生成完了，关闭时刷新列表）
            m('.Form-group', [
                m(Button, {
                    className: 'Button Button--link Button--block',
                    onclick: () => this.closeAndRefresh()
                }, '完成并关闭')
            ])
        ]);
    }

    // === 场景 1：填写表单 ===
    return m('.Modal-body', [
      m('.Form', [
        m('.Form-group', [
          m('label', '群组 ID'),
          m('input.FormControl', { bidi: this.groupId, placeholder: '例如: 7' })
        ]),
        m('.Form-group', [
          m('label', '有效天数'),
          m('input.FormControl', { bidi: this.days, placeholder: '例如: 30' })
        ]),
        m('.Form-group', [
          m('label', '生成数量'),
          m('input.FormControl', { bidi: this.amount, type: 'number', placeholder: '1' })
        ]),
        m('.Form-group', [
          m(Button, {
            className: 'Button Button--primary Button--block',
            loading: this.loading,
            onclick: this.onsubmit.bind(this)
          }, '提交生成')
        ])
      ])
    ]);
  }

  // 辅助函数：下载 TXT 文件
  downloadTxt(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemption_codes_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 关闭并触发刷新
  closeAndRefresh() {
      this.hide();
      if (this.attrs.onSuccess) this.attrs.onSuccess();
  }

  onsubmit(e) {
    e.preventDefault();
    this.loading = true;

    app.request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/redemption/create',
      body: {
        group_id: this.groupId(),
        days: this.days(),
        amount: this.amount()
      }
    }).then((response) => {
      this.loading = false;
      // 关键：不关闭弹窗，而是将返回的 codes 存入状态，触发视图更新
      if (response.codes) {
          this.generatedCodes = response.codes;
          m.redraw();
      } else {
          // 如果后端没返回 codes (兼容旧代码)，则直接关闭
          this.hide();
          app.alerts.show({ type: 'success' }, '生成成功');
          if (this.attrs.onSuccess) this.attrs.onSuccess();
      }
    }).catch(() => {
      this.loading = false;
      m.redraw();
    });
  }
}
