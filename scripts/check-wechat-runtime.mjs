import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Exercise the installed plugin in Obsidian's real DOM, so a successful source
// build cannot hide stale installed artifacts. The test does not edit notes.
const vault = process.argv.find((arg) => arg.startsWith('--vault='))?.slice(8);

async function checkRuntime() {
  const view = window.app.workspace.getLeavesOfType('mdflow-publisher-view')[0]?.view;
  if (!view) throw new Error('请先打开 Jacky-mdflow 面板，再运行公众号检查。');
  const manager = new view.themeManager.constructor();
  const currentExporter = view.exporters.get('wechat');
  const exporter = new currentExporter.constructor(manager, view.imageResolver);
  const fixture = '<h2>阅读宽度检查</h2><p>正文不应因为主题外层留白而比公众号原生阅读区更窄。<strong>重点文字</strong>与++下划线++保持清楚可读。</p><blockquote><p>引用内部仍保留必要间距。</p></blockquote><p><img alt="测试图片说明" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2240%22%3E%3C/svg%3E"></p><pre><code>const result = 1;\n  console.log(result);</code></pre>';
  const host = document.createElement('section');
  host.setCssStyles({ position: 'fixed', left: '-10000px', top: '0', padding: '0 20px', boxSizing: 'border-box', visibility: 'hidden' });
  document.body.appendChild(host);
  let widthCases = 0;
  const themes = manager.getThemeIds();
  const require = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    for (const id of themes) {
      manager.setCurrentTheme(id);
      const content = await exporter.prepare(fixture, { sourceFile: view.activeFile });
      require(content.previewHtml === content.exportHtml, `${id}：预览和复制 HTML 不一致。`);
      const doc = new DOMParser().parseFromString(content.exportHtml, 'text/html');
      host.replaceChildren(...Array.from(doc.body.childNodes));
      const outer = host.firstElementChild;
      const paragraph = outer?.querySelector(':scope > p');
      require(outer && paragraph, `${id}：正文结构缺失。`);
      const outerStyle = getComputedStyle(outer);
      require(outerStyle.paddingLeft === '0px' && outerStyle.paddingRight === '0px',
        `${id}：已安装插件仍有左右内边距 ${outerStyle.paddingLeft}/${outerStyle.paddingRight}；请构建、部署并重载插件。`);
      for (const width of [320, 375, 390, 430, 750]) {
        host.style.width = `${width}px`;
        require(Math.abs(paragraph.getBoundingClientRect().width - Math.min(width - 40, 677)) < 0.5,
          `${id}：${width}px 阅读区的正文宽度不正确。`);
        require(host.scrollWidth <= host.clientWidth, `${id}：${width}px 阅读区横向溢出。`);
        widthCases += 1;
      }
      const heading = outer.querySelector('h2');
      if (id === 'wechat-orange-reading') {
        require(manager.getCurrentTheme().name === '暖橙', '暖橙主题名称未更新。');
        require(heading.textContent === '阅读宽度检查', '暖橙不应自动添加章节编号。');
        require(getComputedStyle(heading).color === 'rgb(253, 70, 6)', '橙色标题颜色丢失。');
        require(getComputedStyle(paragraph).fontSize === '15px', '暖橙正文不是 15px。');
        require(getComputedStyle(paragraph).lineHeight === '27px', '暖橙行高不是 27px。');
        require(paragraph.querySelector('u'), '++下划线++ 未转换。');
        require(getComputedStyle(outer.querySelector('img')).borderRadius === '11px', '图片圆角丢失。');
        require(outer.textContent.includes('测试图片说明'), '图片说明遗漏。');
      } else if (manager.getCurrentTheme().enhanced) {
        require(heading.textContent.startsWith('01'), `${id}：原有章节编号丢失。`);
      }
      require(!doc.querySelector('div, style, script, [class], [id]'), `${id}：复制 HTML 存在不兼容标签或属性。`);
    }
    require(themes.includes('wechat-orange-reading'), '已安装插件缺少暖橙主题。');
    return { ok: true, themes: themes.length, widthCases, installedRuntime: true };
  } finally {
    host.remove();
  }
}

function evaluate(code) {
  const args = [...(vault ? [`vault=${vault}`] : []), 'eval', `code=${code}`];
  const result = spawnSync('obsidian', args, { encoding: 'utf8', timeout: 10000 });
  if (result.error) throw result.error;
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  assert.equal(result.status, 0, output);
  return output;
}

// Some Obsidian CLI versions return before a multi-step async eval settles.
// Poll an explicit completion state instead of treating an empty reply as a pass.
const key = JSON.stringify(`__mdflowWechatCheck_${Date.now()}`);
try {
  evaluate(`globalThis[${key}]={status:'running'};(${checkRuntime.toString()})().then(report=>globalThis[${key}]={status:'done',report},error=>globalThis[${key}]={status:'error',message:error.message});'started'`);
  const deadline = Date.now() + 30000;
  let state;
  do {
    const output = evaluate(`JSON.stringify(globalThis[${key}])`);
    const match = output.match(/=> (\{[^\n]+\})/);
    assert.ok(match, `Obsidian 运行检查无状态：\n${output}`);
    state = JSON.parse(match[1]);
    if (state.status === 'running') await delay(200);
  } while (state.status === 'running' && Date.now() < deadline);
  assert.equal(state.status, 'done', state.message || 'Obsidian 检查超时。');
  const report = state.report;
  assert.equal(report.ok, true);
  assert.ok(report.themes >= 14);
  assert.equal(report.widthCases, report.themes * 5);
  process.stdout.write(`已安装公众号插件：${report.themes} 套主题、${report.widthCases} 个宽度检查通过。\n`);
} finally {
  evaluate(`delete globalThis[${key}]`);
}
