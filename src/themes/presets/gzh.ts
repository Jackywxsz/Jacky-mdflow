import { Theme, ThemeStyles, WeChatEnhancedStyles } from '../theme-types';

interface GzhThemeTokens {
  name: string;
  description: string;
  variant: WeChatEnhancedStyles['variant'];
  accent: string;
  accentDark: string;
  accentSoft: string;
  marker: string;
  background: string;
  surface: string;
  title: string;
  body: string;
  muted: string;
  line: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  padding: string;
  serifHeadings?: boolean;
}

const SANS_FONT = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
const SERIF_FONT = "'Noto Serif SC',Georgia,'Times New Roman',serif";

function buildHeadingStyles(tokens: GzhThemeTokens): Pick<ThemeStyles, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> {
  const headingFont = tokens.serifHeadings ? SERIF_FONT : SANS_FONT;
  const shared = `font-family:${headingFont};color:${tokens.title};line-height:1.45;box-sizing:border-box;`;

  switch (tokens.variant) {
    case 'magazine':
      return {
        h1: `${shared}font-size:24px;font-weight:800;margin:12px 0 28px;padding:24px 20px;background:${tokens.surface};border-bottom:6px solid ${tokens.accent};`,
        h2: `${shared}font-size:22px;font-weight:800;margin:48px 0 20px;padding:10px 0;border-bottom:3px solid ${tokens.marker};`,
        h3: `${shared}font-size:18px;font-weight:700;margin:30px 0 14px;padding-left:12px;border-left:4px solid ${tokens.accent};`,
        h4: `${shared}font-size:17px;font-weight:700;margin:24px 0 12px;`,
        h5: `${shared}font-size:16px;font-weight:700;margin:22px 0 10px;`,
        h6: `${shared}font-size:15px;font-weight:700;margin:20px 0 10px;`,
      };
    case 'editorial':
      return {
        h1: `${shared}font-size:24px;font-weight:800;margin:12px 0 28px;padding:20px 16px;border-left:6px solid ${tokens.accent};background:${tokens.surface};`,
        h2: `${shared}font-size:22px;font-weight:800;margin:50px 0 20px;padding:8px 0;border-bottom:2px solid ${tokens.accent};`,
        h3: `${shared}font-size:18px;font-weight:700;margin:30px 0 14px;padding-left:12px;border-left:4px solid ${tokens.accent};`,
        h4: `${shared}font-size:17px;font-weight:700;margin:24px 0 12px;`,
        h5: `${shared}font-size:16px;font-weight:700;margin:22px 0 10px;`,
        h6: `${shared}font-size:15px;font-weight:700;margin:20px 0 10px;`,
      };
    case 'minimal':
      return {
        h1: `${shared}font-size:24px;font-weight:750;margin:16px 0 36px;padding:0 0 18px;border-bottom:1px solid ${tokens.line};`,
        h2: `${shared}font-size:22px;font-weight:750;margin:56px 0 22px;padding:0 0 12px;border-bottom:1px solid ${tokens.line};`,
        h3: `${shared}font-size:18px;font-weight:700;margin:32px 0 16px;padding-left:12px;border-left:2px solid ${tokens.accent};`,
        h4: `${shared}font-size:17px;font-weight:700;margin:26px 0 12px;`,
        h5: `${shared}font-size:16px;font-weight:700;margin:24px 0 10px;`,
        h6: `${shared}font-size:15px;font-weight:700;margin:22px 0 10px;`,
      };
    case 'zen':
      return {
        h1: `${shared}font-size:24px;font-weight:600;text-align:center;margin:28px 0 54px;padding:24px 8px;border-top:1px solid ${tokens.line};border-bottom:1px solid ${tokens.line};`,
        h2: `${shared}font-size:22px;font-weight:600;text-align:center;margin:64px 0 28px;padding:0 0 18px;border-bottom:1px solid ${tokens.line};`,
        h3: `${shared}font-size:18px;font-weight:600;margin:38px 0 18px;padding-bottom:8px;border-bottom:1px solid ${tokens.line};`,
        h4: `${shared}font-size:17px;font-weight:600;margin:30px 0 14px;`,
        h5: `${shared}font-size:16px;font-weight:600;margin:28px 0 12px;`,
        h6: `${shared}font-size:15px;font-weight:600;margin:26px 0 12px;`,
      };
    case 'ticket':
      return {
        h1: `${shared}font-size:24px;font-weight:800;margin:16px 4px 34px;padding:24px 20px;background:${tokens.surface};border:2px solid ${tokens.title};box-shadow:6px 6px 0 ${tokens.title};`,
        h2: `${shared}font-size:21px;font-weight:800;margin:48px 0 20px;padding:12px 14px;background:${tokens.surface};border:2px solid ${tokens.title};`,
        h3: `${shared}font-size:18px;font-weight:800;margin:30px 0 14px;padding-left:12px;border-left:5px solid ${tokens.accent};`,
        h4: `${shared}font-size:17px;font-weight:700;margin:24px 0 12px;`,
        h5: `${shared}font-size:16px;font-weight:700;margin:22px 0 10px;`,
        h6: `${shared}font-size:15px;font-weight:700;margin:20px 0 10px;`,
      };
    case 'journal':
      return {
        h1: `${shared}font-size:24px;font-weight:800;margin:8px 0 32px;padding:22px 18px;background:${tokens.title};color:${tokens.background};border-radius:6px;`,
        h2: `${shared}font-size:21px;font-weight:800;margin:44px 0 20px;padding:12px 14px;background:${tokens.surface};border-left:6px solid ${tokens.accent};border-radius:0 6px 6px 0;`,
        h3: `${shared}font-size:18px;font-weight:800;margin:30px 0 14px;padding:8px 0;border-bottom:2px solid ${tokens.accent};`,
        h4: `${shared}font-size:17px;font-weight:700;margin:24px 0 12px;`,
        h5: `${shared}font-size:16px;font-weight:700;margin:22px 0 10px;`,
        h6: `${shared}font-size:15px;font-weight:700;margin:20px 0 10px;`,
      };
  }
}

function createGzhTheme(tokens: GzhThemeTokens): Theme {
  const headings = buildHeadingStyles(tokens);
  const textFont = SANS_FONT;
  const styles: ThemeStyles = {
    container: `max-width:677px;margin:0 auto;padding:${tokens.padding};box-sizing:border-box;background:${tokens.background};font-family:${textFont};font-size:${tokens.fontSize};line-height:${tokens.lineHeight};letter-spacing:${tokens.letterSpacing};color:${tokens.body};overflow-x:hidden;word-wrap:break-word;`,
    ...headings,
    p: `margin:0 0 22px;line-height:${tokens.lineHeight};color:${tokens.body};font-size:${tokens.fontSize};`,
    strong: `font-weight:700;color:${tokens.title};`,
    em: `font-style:italic;color:${tokens.muted};`,
    a: `color:${tokens.accentDark};text-decoration:none;border-bottom:1px solid ${tokens.accent};`,
    ul: 'margin:18px 0 24px;padding-left:24px;',
    ol: 'margin:18px 0 24px;padding-left:24px;',
    li: `margin:10px 0;line-height:${tokens.lineHeight};color:${tokens.body};`,
    blockquote: `margin:26px 0;padding:16px 18px;background:${tokens.surface};border-left:4px solid ${tokens.accent};color:${tokens.body};`,
    code: `font-family:'SF Mono',Consolas,Monaco,'Courier New',monospace;font-size:13px;padding:2px 6px;background:${tokens.accentSoft};color:${tokens.accentDark};border-radius:3px;`,
    pre: `margin:24px 0;padding:18px 20px;background:#25272d;color:#e5e7eb;border-left:4px solid ${tokens.accent};border-radius:6px;overflow-x:auto;`,
    hr: `margin:44px 0;border:0;border-top:1px solid ${tokens.line};`,
    img: 'max-width:100%;height:auto;display:block;margin:24px auto;',
    table: `width:100%;margin:24px 0;border-collapse:collapse;font-size:14px;color:${tokens.body};`,
    th: `padding:10px 12px;text-align:left;background:${tokens.surface};border:1px solid ${tokens.line};font-weight:700;color:${tokens.title};`,
    td: `padding:10px 12px;border:1px solid ${tokens.line};vertical-align:top;`,
    tr: `border-bottom:1px solid ${tokens.line};`,
  };

  const h2NumberByVariant: Record<WeChatEnhancedStyles['variant'], string> = {
    magazine: `display:inline-block;margin-right:10px;padding:2px 8px;background:${tokens.accent};color:#ffffff;font-size:13px;font-weight:800;border-radius:3px;vertical-align:middle;`,
    editorial: `display:inline-block;margin-right:10px;padding:2px 8px;background:${tokens.accent};color:#ffffff;font-size:13px;font-weight:800;vertical-align:middle;`,
    minimal: `display:inline-block;margin-right:12px;color:${tokens.line};font-size:24px;font-weight:700;vertical-align:middle;`,
    zen: `display:block;margin:0 0 8px;color:${tokens.accent};font-size:12px;font-weight:600;letter-spacing:2px;`,
    ticket: `display:inline-block;margin-right:10px;padding:2px 8px;background:${tokens.title};color:${tokens.background};font-size:13px;font-weight:800;vertical-align:middle;`,
    journal: `display:inline-block;margin-right:10px;padding:2px 8px;background:${tokens.title};color:${tokens.background};font-size:13px;font-weight:800;border-radius:3px;vertical-align:middle;`,
  };

  const enhanced: WeChatEnhancedStyles = {
    variant: tokens.variant,
    accent: tokens.accent,
    accentSoft: tokens.accentSoft,
    h2Number: h2NumberByVariant[tokens.variant],
    openingQuote: `margin:12px 0 38px;padding:22px 20px;background:${tokens.surface};border-top:1px solid ${tokens.line};border-bottom:1px solid ${tokens.line};border-left:4px solid ${tokens.accent};color:${tokens.title};font-size:18px;font-weight:600;line-height:1.75;`,
    highlight: `font-weight:650;color:${tokens.title};background:linear-gradient(transparent 52%,${tokens.marker} 52%);padding:0 2px;`,
    underline: `font-weight:600;color:${tokens.title};border-bottom:2px solid ${tokens.accent};padding-bottom:1px;`,
    note: `margin:24px 0;padding:16px 18px;background:${tokens.surface};border-left:4px solid ${tokens.accent};color:${tokens.body};line-height:${tokens.lineHeight};`,
    codeFrame: `margin:24px 0;padding:18px 20px;background:#25272d;border-left:4px solid ${tokens.accent};border-radius:6px;overflow-x:auto;box-sizing:border-box;`,
    codeLine: "margin:0;color:#e5e7eb;font-family:'SF Mono',Consolas,Monaco,'Courier New',monospace;font-size:13px;line-height:1.75;",
    caption: `margin:-14px 0 26px;text-align:center;color:${tokens.muted};font-size:12px;line-height:1.6;`,
    divider: `margin:44px 0;border-top:1px solid ${tokens.line};height:0;line-height:0;`,
  };

  return {
    name: tokens.name,
    group: 'enhanced',
    description: tokens.description,
    styles,
    enhanced,
  };
}

export const GZH_PRESET_THEMES: Record<string, Theme> = {
  'gzh-moyu-green': createGzhTheme({
    name: '摸鱼绿', description: '教程、清单、工具盘点', variant: 'magazine',
    accent: '#059669', accentDark: '#047857', accentSoft: '#ECFDF5', marker: '#FDE68A',
    background: '#FFFFFF', surface: '#F0FDF4', title: '#111827', body: '#374151',
    muted: '#6B7280', line: '#D1D5DB', fontSize: '14px', lineHeight: '1.9',
    letterSpacing: '0.5px', padding: '12px 20px 28px',
  }),
  'gzh-red-white': createGzhTheme({
    name: '红白编辑', description: '观点、深度分析、人物内容', variant: 'editorial',
    accent: '#DC2626', accentDark: '#991B1B', accentSoft: '#FEE2E2', marker: '#FECACA',
    background: '#FFFFFF', surface: '#FEF2F2', title: '#1C1917', body: '#374151',
    muted: '#9CA3AF', line: '#E5E7EB', fontSize: '15px', lineHeight: '1.8',
    letterSpacing: '0.5px', padding: '12px 10px 28px',
  }),
  'gzh-graphite-minimal': createGzhTheme({
    name: '石墨极简', description: '科技评论、专业观点、高端品牌', variant: 'minimal',
    accent: '#52525B', accentDark: '#3F3F46', accentSoft: '#F4F4F5', marker: '#E4E4E7',
    background: '#FFFFFF', surface: '#FAFAFA', title: '#27272A', body: '#52525B',
    muted: '#A1A1AA', line: '#E4E4E7', fontSize: '15px', lineHeight: '1.8',
    letterSpacing: '0.3px', padding: '16px 10px 34px',
  }),
  'gzh-zen-whitespace': createGzhTheme({
    name: '留白禅意', description: '随笔、人物、生活与读书内容', variant: 'zen',
    accent: '#4A5D52', accentDark: '#3D5046', accentSoft: '#EEF3F0', marker: '#D6E4DC',
    background: '#FFFFFF', surface: '#FFFFFF', title: '#2B2B2B', body: '#525252',
    muted: '#A3A3A3', line: '#E8E8E8', fontSize: '15px', lineHeight: '1.9',
    letterSpacing: '0.3px', padding: '24px 16px 42px', serifHeadings: true,
  }),
  'gzh-moyu-ticket': createGzhTheme({
    name: '摸鱼票据', description: '测评、工具对比、创意评测', variant: 'ticket',
    accent: '#059669', accentDark: '#047857', accentSoft: '#F0FDF4', marker: '#A7F3D0',
    background: '#FFFFFF', surface: '#FFFEF8', title: '#1A1A1A', body: '#555555',
    muted: '#888888', line: '#1A1A1A', fontSize: '14px', lineHeight: '1.9',
    letterSpacing: '0.5px', padding: '16px 20px 34px',
  }),
  'gzh-olive-journal': createGzhTheme({
    name: '橄榄手记', description: '案例复盘、系统文档、深度评测', variant: 'journal',
    accent: '#ED7B2F', accentDark: '#9A4C1C', accentSoft: '#E5E7E0', marker: '#F0C7A9',
    background: '#FDFDF8', surface: '#EEEFE9', title: '#23251D', body: '#4D4F46',
    muted: '#9EA096', line: '#BFC1B7', fontSize: '14px', lineHeight: '1.9',
    letterSpacing: '0.3px', padding: '16px 12px 34px',
  }),
};
