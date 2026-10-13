import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies, getPalette, layout, nastaliqForWeight, radii, spacing, typography } from '../theme/theme';
import { useApp } from '../store/AppContext';

type KeyboardScrollContextValue = {
  scrollFocusedInput: (target: unknown) => void;
};

const KeyboardScrollContext = React.createContext<KeyboardScrollContextValue | null>(null);

export function Screen({ children, scroll = false, style, keyboard = false }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>; keyboard?: boolean }) {
  const palette = getPalette(useApp().readingTheme);
  const { width } = useWindowDimensions();
  const horizontal = width >= 700 ? layout.pagePaddingWide : layout.pagePadding;
  const scrollRef = React.useRef<ScrollView | null>(null);
  const focusedInputRef = React.useRef<unknown>(null);
  const revealFocusedInput = React.useCallback(() => {
    const target = focusedInputRef.current;
    if (!keyboard || !scrollRef.current || target == null) return;
    const responder = (scrollRef.current as any).getScrollResponder?.();
    responder?.scrollResponderScrollNativeHandleToKeyboard?.(target, spacing.xxxl + spacing.lg, true);
  }, [keyboard]);
  const keyboardScroll = React.useMemo<KeyboardScrollContextValue>(() => ({
    scrollFocusedInput: target => {
      focusedInputRef.current = target;
      // Start moving immediately, then correct the position once the keyboard has
      // finished animating (important for Android password/autofill toolbars).
      requestAnimationFrame(revealFocusedInput);
    }
  }), [revealFocusedInput]);
  React.useEffect(() => {
    if (!keyboard) return;
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(revealFocusedInput);
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      focusedInputRef.current = null;
    });
    return () => { shown.remove(); hidden.remove(); };
  }, [keyboard, revealFocusedInput]);
  const body = scroll
    ? <KeyboardScrollContext.Provider value={keyboardScroll}><ScrollView
        ref={scrollRef}
        style={styles.fill}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontal, paddingBottom: keyboard ? spacing.xxxl * 4 : spacing.xxl }, style]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >{children}</ScrollView></KeyboardScrollContext.Provider>
    : <View style={[styles.fill, style]}>{children}</View>;
  const content = keyboard
    ? <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{body}</KeyboardAvoidingView>
    : body;
  return <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: palette.bg }]}>{content}</SafeAreaView>;
}

export function Urdu({ children, style, numberOfLines }: { children: React.ReactNode; style?: any; numberOfLines?: number }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const requestedWeight = flat.fontWeight;
  const requestedFamily = flat.fontFamily;
  const { fontWeight: _fontWeight, fontFamily: _fontFamily, ...safeStyle } = flat;
  let rawText = '';
  React.Children.forEach(children, child => { if (typeof child === 'string' || typeof child === 'number') rawText += String(child); });
  const isUrdu = /[\u0600-\u06FF\u0750-\u077F]/.test(rawText);
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const requestedLineHeight = typeof flat.lineHeight === 'number' ? flat.lineHeight : 0;
  const requestedPaddingTop = typeof flat.paddingTop === 'number' ? flat.paddingTop : 0;
  const requestedPaddingBottom = typeof flat.paddingBottom === 'number' ? flat.paddingBottom : 0;
  const typography = isUrdu
    ? {
        fontFamily: requestedFamily || nastaliqForWeight(requestedWeight),
        writingDirection: 'rtl' as const,
        includeFontPadding: true,
        lineHeight: Math.max(requestedLineHeight, Math.ceil(fontSize * 1.9)),
        paddingTop: Math.max(requestedPaddingTop, Math.ceil(fontSize * 0.08)),
        paddingBottom: Math.max(requestedPaddingBottom, Math.ceil(fontSize * 0.24))
      }
    : { fontFamily: requestedFamily, fontWeight: requestedWeight, writingDirection: 'ltr' as const };
  return <Text numberOfLines={numberOfLines} style={[styles.urdu, { color: palette.text }, safeStyle, typography]}>{children}</Text>;
}

export function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  const palette = getPalette(useApp().readingTheme);
  return <Text style={[styles.label, { color: palette.text }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }, style]}>{children}</View>;
}

export function Button({ title, onPress, icon, variant = 'primary', disabled = false, compact = false, loading = false }: { title: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean; compact?: boolean; loading?: boolean }) {
  const palette = getPalette(useApp().readingTheme);
  const buttonColors = { primary: { backgroundColor: palette.accent, borderColor: palette.accent, foreground: palette.dark ? colors.darkBg : colors.surface }, secondary: { backgroundColor: palette.surface, borderColor: palette.borderStrong, foreground: palette.accentStrong }, danger: { backgroundColor: palette.dangerBg, borderColor: palette.danger, foreground: palette.danger }, ghost: { backgroundColor: 'transparent', borderColor: 'transparent', foreground: palette.accentStrong } }[variant];
  const inactive = disabled || loading;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress} android_ripple={{ color: variant === 'primary' ? palette.accentSoft : palette.border }} style={({ pressed }) => [styles.button, buttonColors, variant === 'primary' && styles.primaryShadow, compact && styles.compact, pressed && styles.pressed, inactive && styles.disabled]}>
    {loading ? <ActivityIndicator size="small" color={buttonColors.foreground} /> : icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={buttonColors.foreground} /> : null}
    <Urdu style={[styles.buttonText, compact && styles.compactText, { color: buttonColors.foreground }]}>{title}</Urdu>
  </Pressable>;
}

export function Field({ label, rtl = false, ...props }: TextInputProps & { label?: string; rtl?: boolean }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const keyboardScroll = React.useContext(KeyboardScrollContext);
  const [focused, setFocused] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const isSecure = props.secureTextEntry === true;
  const input = <TextInput
    placeholderTextColor={palette.muted}
    {...props}
    secureTextEntry={isSecure ? !revealed : props.secureTextEntry}
    onFocus={event => {
      setFocused(true);
      keyboardScroll?.scrollFocusedInput(event.target);
      props.onFocus?.(event);
    }}
    onBlur={event => { setFocused(false); props.onBlur?.(event); }}
    selectionColor={palette.accent}
    style={[styles.input, isSecure && styles.inputWithAccessory, { color: palette.text, backgroundColor: palette.input, borderColor: focused ? palette.accent : palette.border }, focused && styles.inputFocused, rtl && styles.rtlInput, rtl && { fontFamily: fontFamilies[app.fontId] }, props.style]}
  />;
  return <View style={styles.fieldWrap}>
    {label ? <Urdu style={[styles.fieldLabel, { color: focused ? palette.accentStrong : palette.muted }]}>{label}</Urdu> : null}
    {isSecure ? <View style={styles.inputAccessoryWrap}>
      {input}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
        hitSlop={10}
        android_ripple={{ color: palette.border, borderless: true }}
        onPress={() => setRevealed(value => !value)}
        style={({ pressed }) => [styles.inputAccessory, pressed && styles.pressed]}
      ><Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.muted} /></Pressable>
    </View> : input}
  </View>;
}

export function IconButton({ name, onPress, danger = false, label }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; danger?: boolean; label?: string }) {
  const palette = getPalette(useApp().readingTheme);
  return <Pressable accessibilityRole="button" accessibilityLabel={label || String(name)} hitSlop={8} android_ripple={{ color: palette.border, borderless: true }} onPress={onPress} style={({ pressed }) => [styles.iconButton, { borderColor: palette.border, backgroundColor: palette.surface }, pressed && styles.pressed]}><Ionicons name={name} size={19} color={danger ? palette.danger : palette.accentStrong} /></Pressable>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={styles.sectionCopy}><Urdu style={styles.sectionTitle}>{title}</Urdu>{subtitle ? <Label style={{ color: palette.muted, lineHeight: 18 }}>{subtitle}</Label> : null}</View>;
}

export function ScreenHeader({ title, subtitle, onClose, action }: { title: string; subtitle?: string; onClose?: () => void; action?: React.ReactNode }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={[styles.screenHeader, { borderBottomColor: palette.border }]}>
    <View style={styles.headerSide}>{onClose ? <IconButton name="close" label="Close" onPress={onClose} /> : null}</View>
    <View style={styles.headerCopy}><Urdu numberOfLines={1} style={styles.headerTitle}>{title}</Urdu>{subtitle ? <Label style={{ color: palette.muted }}>{subtitle}</Label> : null}</View>
    <View style={[styles.headerSide, styles.headerAction]}>{action}</View>
  </View>;
}

export function EmptyState({ icon = 'folder-open-outline', title, message, action }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message?: string; action?: React.ReactNode }) {
  const palette = getPalette(useApp().readingTheme);
  return <Card style={styles.emptyCard}><View style={[styles.emptyIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name={icon} size={26} color={palette.accentStrong} /></View><Urdu style={styles.emptyTitle}>{title}</Urdu>{message ? <Label style={[styles.emptyMessage, { color: palette.muted }]}>{message}</Label> : null}{action}</Card>;
}

export function Loading({ label = 'Loading Raza…' }: { label?: string }) {
  const palette = getPalette(useApp().readingTheme);
  return <SafeAreaView style={[styles.center, { backgroundColor: palette.bg }]}><View style={[styles.loadingMark, { backgroundColor: palette.accentSoft }]}><ActivityIndicator color={palette.accentStrong} /></View><Urdu style={{ color: palette.muted, marginTop: 10, lineHeight: 24 }}>{label}</Urdu></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, fill: { flex: 1 },
  scroll: { flexGrow: 1, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingMark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  urdu: { includeFontPadding: true }, label: { fontSize: 12 },
  card: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, shadowOffset: { width: 0, height: 5 }, shadowOpacity: .045, shadowRadius: 12, elevation: 1 },
  button: { minHeight: 50, borderRadius: radii.control, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, borderWidth: 1, overflow: 'hidden' },
  primaryShadow: { shadowColor: '#111', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .12, shadowRadius: 8, elevation: 2 },
  compact: { minHeight: layout.touchTarget, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.control },
  pressed: { opacity: .82, transform: [{ scale: .98 }] }, disabled: { opacity: .48 },
  buttonText: { fontSize: 15, lineHeight: 29, fontWeight: '700' }, compactText: { fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight },
  fieldWrap: { gap: spacing.xs }, fieldLabel: { fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight },
  input: { minHeight: 54, borderWidth: 1, borderRadius: radii.control, paddingHorizontal: spacing.md, fontSize: 15 },
  inputAccessoryWrap: { position: 'relative' },
  inputWithAccessory: { paddingRight: 52 },
  inputAccessory: { position: 'absolute', right: 6, top: 5, width: 44, height: 44, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rtlInput: { minHeight: 62, textAlign: 'right', writingDirection: 'rtl', lineHeight: 32, paddingTop: 9, paddingBottom: 9, includeFontPadding: true },
  inputFocused: { borderWidth: 1.5, shadowColor: '#555', shadowOpacity: .06, shadowRadius: 6 },
  iconButton: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radii.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sectionCopy: { gap: spacing.xxs }, sectionTitle: { fontSize: typography.urdu.section.fontSize, lineHeight: typography.urdu.section.lineHeight, fontWeight: '800' },
  screenHeader: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerSide: { width: 78, alignItems: 'flex-start' }, headerAction: { alignItems: 'flex-end' }, headerCopy: { minWidth: 0, flex: 1, alignItems: 'center' }, headerTitle: { fontSize: 19, lineHeight: 32, fontWeight: '700', textAlign: 'center' },
  emptyCard: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 18, lineHeight: 32, fontWeight: '700', textAlign: 'center' }, emptyMessage: { maxWidth: 300, textAlign: 'center', lineHeight: 19, marginBottom: 4 }
});

