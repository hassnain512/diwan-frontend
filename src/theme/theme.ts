import { ReadingTheme } from '../types';
import { colors } from './colors';

export function getPalette(theme: ReadingTheme) {
  return theme === 'dark'
    ? {
      dark: true,
      bg: colors.darkBg,
      surface: colors.darkSurface,
      surface2: colors.darkSurface2,
      elevated: colors.darkElevated,
      text: colors.darkText,
      muted: colors.darkMuted,
      accent: colors.darkAccent,
      accentStrong: '#E0E1BD',
      accentSoft: colors.darkAccentSoft,
      gold: colors.darkGold,
      border: colors.darkBorder,
      borderStrong: colors.darkBorderStrong,
      input: '#20211D',
      success: '#91BD98',
      successBg: '#213026',
      warning: '#D4B56C',
      warningBg: '#332B1D',
      danger: '#E49A92',
      dangerBg: '#3B2422',
      shadow: '#000000'
    }
    : {
      dark: false,
      bg: colors.bg,
      surface: colors.surface,
      surface2: colors.surface2,
      elevated: colors.elevated,
      text: colors.text,
      muted: colors.muted,
      accent: colors.accent,
      accentStrong: colors.accentDark,
      accentSoft: colors.accentSoft,
      gold: colors.gold,
      border: colors.border,
      borderStrong: colors.borderStrong,
      input: '#FFFEFC',
      success: colors.success,
      successBg: colors.successBg,
      warning: colors.warning,
      warningBg: colors.warningBg,
      danger: colors.danger,
      dangerBg: colors.dangerBg,
      shadow: '#3B3327'
    };
}

export const fontFamilies = {
  noto: 'NotoNastaliqUrdu_400Regular',
  jameel: 'NotoNastaliqUrdu_400Regular',
  mehr: 'NotoNastaliqUrdu_400Regular'
} as const;

export const fontFamily = fontFamilies.noto;

export const nastaliqWeights = {
  regular: 'NotoNastaliqUrdu_400Regular',
  medium: 'NotoNastaliqUrdu_500Medium',
  semibold: 'NotoNastaliqUrdu_600SemiBold',
  bold: 'NotoNastaliqUrdu_700Bold'
} as const;

export function nastaliqForWeight(weight?: string | number) {
  if (weight === 'bold') return nastaliqWeights.bold;
  const numeric = typeof weight === 'number' ? weight : Number.parseInt(String(weight || '400'), 10);
  if (numeric >= 700) return nastaliqWeights.bold;
  if (numeric >= 600) return nastaliqWeights.semibold;
  if (numeric >= 500) return nastaliqWeights.medium;
  return nastaliqWeights.regular;
}

export type AppPalette = ReturnType<typeof getPalette>;

export const layout = {
  contentMaxWidth: 760,
  pagePadding: 16,
  pagePaddingWide: 24,
  touchTarget: 44
} as const;

export const radii = { small: 10, medium: 15, large: 22, pill: 999 } as const;
