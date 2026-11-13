import zhCN from '../language/zh_cn.json';

export type I18nParams = Record<string, string | number>;

const dictionary = zhCN as Record<string, string>;

export function t(key: string, params?: I18nParams): string {
  let text = dictionary[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
