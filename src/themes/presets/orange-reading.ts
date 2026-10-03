import { Theme } from '../theme-types';

// Reading typography observed in APPSO's public article, checked 2026-10-03:
// https://mp.weixin.qq.com/s/AkMSR8MnOvSSY_3N6jVO0A
// Original preset: no article text, brand assets or source HTML is bundled.
// Omit the reference's 14px side padding; WeChat supplies the reader gutter.
const BODY_FONT = "PingFangSC-Light,'PingFang SC',-apple-system,BlinkMacSystemFont,'Microsoft YaHei',sans-serif";
const HEADING_FONT = "'PingFang SC',-apple-system,BlinkMacSystemFont,'Microsoft YaHei',sans-serif";
const heading = `font-family:${HEADING_FONT};font-weight:600;color:#FD4606;line-height:1.4;letter-spacing:0.5px;padding:0;box-sizing:border-box;`;
const note = 'margin:26px 0;padding:12px 0 12px 12px;border-left:3px solid #FD4606;color:#222;line-height:1.8;font-size:15px;';
const codeFrame = 'margin:26px 0;padding:14px 12px;background:#f7f7f7;border:1px solid #eeeeee;border-radius:8px;overflow-x:auto;box-sizing:border-box;';

export const ORANGE_READING_THEME: Theme = {
  name: '橙色阅读',
  group: 'enhanced',
  description: '橙色标题、宽正文、圆角配图',
  styles: {
    container: `max-width:677px;margin:0 auto;padding:0;box-sizing:border-box;background:#ffffff;font-family:${BODY_FONT};font-size:15px;font-weight:400;line-height:1.8;letter-spacing:0.5px;color:#222;word-wrap:break-word;`,
    h1: `${heading}font-size:24px;margin:0 0 32px;`,
    h2: `${heading}font-size:20px;margin:62px 0 26px;`,
    h3: `${heading}font-size:20px;margin:62px 0 26px;`,
    h4: `${heading}font-size:18px;margin:42px 0 20px;`,
    h5: `${heading}font-size:17px;margin:36px 0 18px;`,
    h6: `${heading}font-size:16px;margin:32px 0 16px;`,
    p: 'margin:26px 0;padding:0;font-size:15px;font-weight:400;line-height:27px;color:#222;text-align:justify;',
    strong: 'font-weight:700;color:inherit;',
    em: 'font-style:italic;color:inherit;',
    a: 'color:#FD4606;text-decoration:none;border-bottom:1px solid #FD4606;',
    ul: 'margin:26px 0;padding-left:22px;',
    ol: 'margin:26px 0;padding-left:22px;',
    li: 'margin:10px 0;font-size:15px;line-height:27px;color:#222;',
    blockquote: 'margin:26px 0;padding:0 0 0 12px;border-left:3px solid #dddddd;color:#555;',
    'blockquote p': 'margin:0 0 12px;color:#555;',
    'blockquote p:last-child': 'margin-bottom:0;',
    code: "font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;padding:2px 4px;background:#f7f7f7;color:#333;border-radius:3px;",
    pre: codeFrame,
    hr: 'margin:42px 0;border:0;border-top:1px solid #eeeeee;',
    img: 'max-width:100%;height:auto;display:block;margin:26px auto;border-radius:11px;',
    table: 'width:100%;margin:26px 0;border-collapse:collapse;font-size:14px;color:#222;',
    th: 'padding:10px 8px;background:#f7f7f7;border:1px solid #eeeeee;text-align:left;font-weight:600;',
    td: 'padding:10px 8px;border:1px solid #eeeeee;vertical-align:top;',
    tr: 'border-bottom:1px solid #eeeeee;',
  },
  enhanced: {
    variant: 'editorial',
    accent: '#FD4606',
    accentSoft: '#fafafa',
    h2Number: '',
    openingQuote: 'margin:0 0 26px;padding:0 0 0 12px;border-left:3px solid #dddddd;color:#555;',
    highlight: 'font-weight:600;color:#222;background:#fff1e9;padding:0 2px;',
    underline: 'color:inherit;border-bottom:1px solid #FD4606;padding-bottom:1px;',
    note,
    codeFrame,
    codeLine: "margin:0;color:#333;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;",
    caption: 'margin:-20px 0 26px;padding:0;color:#A7A7A7;font-size:12px;line-height:1.6;letter-spacing:0;text-align:left;',
    divider: 'margin:42px 0;border-top:1px solid #eeeeee;height:0;line-height:0;',
  },
};
