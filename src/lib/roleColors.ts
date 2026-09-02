export const ROLE_COLORS = {
  writer: '#4994DF',
  technician: '#47D198',
  producer: '#9E5FDD',
  presenter: '#86dcc9',
  marketing: '#E467A6',
  amplifier: '#E47E44',
} as const;

/** Same hues, lower lightness — for dark surfaces only. */
export const ROLE_COLORS_DARK = {
  writer: '#3A76B8',
  technician: '#2C9A6E',
  producer: '#7A44C2',
  presenter: '#359A86',
  marketing: '#C04882',
  amplifier: '#C05628',
} as const;

export const ROLE_ON_COLORS = {
  writer: '#fffdf7',
  technician: '#171717',
  producer: '#fffdf7',
  presenter: '#171717',
  marketing: '#fffdf7',
  amplifier: '#fffdf7',
} as const;

export const ROLE_ON_COLORS_DARK = {
  writer: '#fffdf7',
  technician: '#fffdf7',
  producer: '#fffdf7',
  presenter: '#fffdf7',
  marketing: '#fffdf7',
  amplifier: '#fffdf7',
} as const;

export type RoleColorId = keyof typeof ROLE_COLORS;
export type RoleTheme = 'light' | 'dark';

export function roleColor(id: RoleColorId, theme: RoleTheme = 'light'): string {
  return theme === 'dark' ? ROLE_COLORS_DARK[id] : ROLE_COLORS[id];
}

export function roleOnColor(id: RoleColorId, theme: RoleTheme = 'light'): string {
  return theme === 'dark' ? ROLE_ON_COLORS_DARK[id] : ROLE_ON_COLORS[id];
}
