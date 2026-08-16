export interface ThemeStyles {
  container: string;
  h1: string;
  h2: string;
  h3: string;
  h4?: string;
  h5?: string;
  h6?: string;
  p: string;
  strong: string;
  em: string;
  a: string;
  ul: string;
  ol: string;
  li: string;
  blockquote: string;
  code: string;
  pre: string;
  hr: string;
  img: string;
  table: string;
  th: string;
  td: string;
  tr: string;
  [key: string]: string | undefined;
}

export type ThemeGroup = 'enhanced' | 'classic';

/**
 * Styles that cannot be expressed by the legacy selector-to-CSS theme model.
 * They are consumed only by the WeChat semantic renderer.
 */
export interface WeChatEnhancedStyles {
  variant: 'magazine' | 'editorial' | 'minimal' | 'zen' | 'ticket' | 'journal';
  accent: string;
  accentSoft: string;
  h2Number: string;
  openingQuote: string;
  highlight: string;
  underline: string;
  note: string;
  codeFrame: string;
  codeLine: string;
  caption: string;
  divider: string;
}

export interface Theme {
  name: string;
  group?: ThemeGroup;
  description?: string;
  styles: ThemeStyles;
  enhanced?: WeChatEnhancedStyles;
}

export type ThemeId = string;
