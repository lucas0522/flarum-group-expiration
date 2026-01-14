import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import ItemList from 'flarum/common/utils/ItemList';
import classList from 'flarum/common/utils/classList';
import icon from 'flarum/common/helpers/icon';
import app from 'flarum/admin/app';
import GroupBadge from 'flarum/common/components/GroupBadge';
import CreateRedemptionModal from '../components/CreateRedemptionModal';

export default class RedemptionCodePage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.codes = [];
    this.stats = { total: 0 };

    this.pageNumber = 0;
    this.limit = 20;
    this.query = '';
    this.loadingPageNumber = 0;

    this.refresh();
  }

  refresh() {
    this.loading = true;
    this.loadPage(this.pageNumber);
  }

  getTotalPageCount() {
    if (this.stats.total === 0) return 1;
    return Math.ceil(this.stats.total / this.limit);
  }

  content() {
    if (this.loading && !this.codes.length) {
      return m('.container', m(LoadingIndicator));
    }

    const columns = this.columns().toArray();

    return m('.RedemptionCodePage', [
      m('.container', [

        // 1. Header
        m('.RedemptionCodePage-header', this.headerItems().toArray()),

        // 2. Grid
        m('section', {
          className: classList([
            'RedemptionCodePage-grid',
            this.loading ? 'RedemptionCodePage-grid--loadingPage' : 'RedemptionCodePage-grid--loaded'
          ]),
          role: 'table',
          'aria-rowcount': this.codes.length + 1,
          'aria-colcount': columns.length,
          style: { '--columns': columns.length }
        }, [
          columns.map((col, index) =>
            m('.RedemptionCodePage-grid-header', { role: 'columnheader', 'aria-colindex': index + 1 }, col.name)
          ),

          this.codes.length > 0 ? this.codes.map((code, rowIndex) =>
            columns.map((col, colIndex) =>
              m('.RedemptionCodePage-grid-rowItem', {
                className: rowIndex % 2 !== 0 ? 'RedemptionCodePage-grid-rowItem--shaded' : '',
                'data-column-name': col.itemName,
                role: 'cell',
                'aria-colindex': colIndex + 1
              }, col.content(code))
            )
          ) : m('.RedemptionCodePage-grid-rowItem', {
              style: 'grid-column: 1 / -1; justify-content: center; padding: 40px; color: #999;'
            }, '暂无数据')
        ]),

        // 3. Pagination
        // 优化点：当 this.loading 为 true 时，禁用所有翻页按钮，防止重复请求
        m('nav.RedemptionCodePage-gridPagination', [
          m(Button, {
            icon: 'fas fa-step-backward',
            className: 'Button Button--icon',
            disabled: this.loading || this.pageNumber === 0,
            onclick: () => this.goToPage(1),
            title: '第一页'
          }),
          m(Button, {
            icon: 'fas fa-chevron-left',
            className: 'Button Button--icon',
            disabled: this.loading || this.pageNumber === 0,
            onclick: () => this.goToPage(this.pageNumber),
            title: '上一页'
          }),

          m('span.RedemptionCodePage-pageNumber', [
            '第 ',
            m('input.FormControl.RedemptionCodePage-pageNumberInput', {
              type: 'text',
              value: this.loadingPageNumber + 1,
              disabled: this.loading, // 加载时禁用输入
              onchange: (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 1;
                val = Math.max(1, Math.min(val, this.getTotalPageCount()));
                this.goToPage(val);
              }
            }),
            ` 页 / 共 ${this.getTotalPageCount()} 页`
          ]),

          m(Button, {
            icon: 'fas fa-chevron-right',
            className: 'Button Button--icon',
            disabled: this.loading || this.pageNumber >= this.getTotalPageCount() - 1,
            onclick: () => this.goToPage(this.pageNumber + 2),
            title: '下一页'
          }),
          m(Button, {
            icon: 'fas fa-step-forward',
            className: 'Button Button--icon',
            disabled: this.loading || this.pageNumber >= this.getTotalPageCount() - 1,
            onclick: () => this.goToPage(this.getTotalPageCount()),
            title: '最后一页'
          })
        ])
      ])
    ]);
  }

  columns() {
    const columns = new ItemList();

    columns.add('id', {
      itemName: 'id',
      name: 'ID',
      content: code => code.id
    }, 100);

    columns.add('key', {
      itemName: 'key',
      name: '兑换码',
      content: code => m('span', {
        style: 'font-weight: bold; color: var(--primary-color); cursor: pointer; font-family: monospace; font-size: 1.1em;',
        onclick: () => this.copyCode(code.code),
        title: '点击复制'
      }, code.code)
    }, 90);

    columns.add('group', {
      itemName: 'group',
      name: '权益内容',
      content: code => {
        const group = app.store.getById('groups', code.group_id);
        if (group) {
            return m('div', {style: 'display: flex; align-items: center;'}, [
                m(GroupBadge, { group: group, label: null, style: 'margin-right: 6px;' }),
                m('span', {style: 'font-weight: bold; margin-right: 8px;'}, group.nameSingular()),
                m('span.Badge', {style: 'background: #e8ecf3; color: #666; font-size: 11px; padding: 2px 6px; border-radius: 4px;'}, `${code.days}天`)
            ]);
        }
        return m('span', {style: 'opacity: 0.6'}, `ID: ${code.group_id} / ${code.days}天`);
      }
    }, 80);

    columns.add('status', {
      itemName: 'status',
      name: '状态',
      content: code => code.is_used
        ? m('span', {style: 'color: #d83e3e; font-weight: bold; opacity: 0.6;'}, [icon('fas fa-times'), ' 已使用'])
        : m('span', {style: 'color: #109e59; font-weight: bold;'}, [icon('fas fa-check'), ' 有效'])
    }, 70);

    columns.add('created', {
      itemName: 'created',
      name: '创建时间',
      content: code => code.created_at ? code.created_at.substring(0, 16).replace('T', ' ') : '-'
    }, 60);

    columns.add('actions', {
      itemName: 'actions',
      name: '操作',
      content: code => m(Button, {
        className: 'Button Button--icon Button--link',
        icon: 'fas fa-copy',
        onclick: () => this.copyCode(code.code),
        title: '复制卡密'
      })
    }, 50);

    return columns;
  }

  headerItems() {
    const items = new ItemList();

    items.add('search',
      m('.Search-input',
        m('input.FormControl', {
          type: 'search',
          placeholder: '搜索兑换码...',
          value: this.query,
          oninput: e => {
            this.query = e.target.value;
            this.pageNumber = 0;
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.loadPage(0), 300);
          }
        })
      ), 100
    );

    items.add('total',
      m('p.RedemptionCodePage-total', `总数: ${this.stats.total}`),
      90
    );

    items.add('actions',
      m('.RedemptionCodePage-actions', [
        m(Button, {
          className: 'Button RedemptionCodePage-createBtn',
          icon: 'fas fa-door-open',
          onclick: () => app.modal.show(CreateRedemptionModal, {
            onSuccess: () => this.loadPage(0)
          })
        }, '生成兑换码')
      ]),
      80
    );

    return items;
  }

  // === 核心修复：增加 finally 和 catch 确保状态重置 ===
  async loadPage(pageNumber) {
    if (pageNumber < 0) pageNumber = 0; // 防止负数页码

    this.loadingPageNumber = pageNumber;
    this.pageNumber = pageNumber;

    this.loading = true;
    m.redraw();

    const params = {
      limit: this.limit,
      offset: pageNumber * this.limit,
      q: this.query
    };

    return app.request({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/redemption/codes',
      params: params
    })
    .then(result => {
      this.codes = result.data;
      this.stats = result.stats || { total: result.meta.total };
      m.redraw();
    })
    .catch(err => {
      console.error(err);
      // 出错时不做特殊处理，Flarum 会弹窗提示，我们只需确保 loading 结束
    })
    .finally(() => {
      // 无论成功还是失败，都必须结束加载状态
      this.loading = false;
      m.redraw();
    });
  }

  goToPage(page) {
    if (this.loading) return; // 防止重复点击
    this.loadPage(page - 1);
  }

  copyCode(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      app.alerts.show({type: 'success'}, '已复制');
    }
  }
}
