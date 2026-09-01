export const ROLE_COLORS = {
  writer: '#4994DF',
  technician: '#47D198',
  producer: '#9E5FDD',
  presenter: '#86dcc9',
  marketing: '#E467A6',
  amplifier: '#E47E44',
} as const;

export const ROLE_ON_COLORS = {
  writer: '#fffdf7',
  technician: '#171717',
  producer: '#fffdf7',
  presenter: '#171717',
  marketing: '#fffdf7',
  amplifier: '#fffdf7',
} as const;

export type RoleColorId = keyof typeof ROLE_COLORS;
