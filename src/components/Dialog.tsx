import React from 'react';
import { Animated, BackHandler, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { getPalette, spacing, typography } from '../theme/theme';
import { Urdu } from './Ui';

type DialogTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

type DialogChoice = {
  id: string;
  label: string;
  tone?: 'default' | 'primary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
};

type DialogRequest = {
  title: string;
  message?: string;
  tone?: DialogTone;
  icon?: keyof typeof Ionicons.glyphMap;
  choices: DialogChoice[];
  dismissible?: boolean;
  requiredText?: string;
  resolve: (id: string | null) => void;
};

type ChooseOptions = Omit<DialogRequest, 'resolve'>;

type DialogApi = {
  choose: (options: ChooseOptions) => Promise<string | null>;
  alert: (options: { title: string; message?: string; tone?: DialogTone; icon?: keyof typeof Ionicons.glyphMap; buttonLabel?: string }) => Promise<void>;
  confirm: (options: { title: string; message?: string; tone?: DialogTone; icon?: keyof typeof Ionicons.glyphMap; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; requiredText?: string }) => Promise<boolean>;
};

const DialogContext = React.createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const [request, setRequest] = React.useState<DialogRequest | null>(null);
  const [confirmation, setConfirmation] = React.useState('');
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(.96)).current;

  const finish = React.useCallback((id: string | null) => {
    const current = request;
    if (!current) return;
    if (id === 'confirm' && current.requiredText && confirmation !== current.requiredText) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(scale, { toValue: .97, duration: 130, useNativeDriver: true })
    ]).start(() => {
      setRequest(null);
      current.resolve(id);
    });
  }, [confirmation, opacity, request, scale]);

  const choose = React.useCallback((options: ChooseOptions) => new Promise<string | null>(resolve => {
    opacity.setValue(0);
    scale.setValue(.96);
    setConfirmation('');
    setRequest({ ...options, resolve });
    requestAnimationFrame(() => Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 18, stiffness: 220, mass: .8, useNativeDriver: true })
    ]).start());
  }), [opacity, scale]);

  const alert = React.useCallback(async ({ title, message, tone = 'default', icon, buttonLabel = 'OK' }: { title: string; message?: string; tone?: DialogTone; icon?: keyof typeof Ionicons.glyphMap; buttonLabel?: string }) => {
    await choose({ title, message, tone, icon, dismissible: true, choices: [{ id: 'ok', label: buttonLabel, tone: 'primary' }] });
  }, [choose]);

  const confirm = React.useCallback(async ({ title, message, tone = 'warning', icon, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, requiredText }: { title: string; message?: string; tone?: DialogTone; icon?: keyof typeof Ionicons.glyphMap; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; requiredText?: string }) => {
    const result = await choose({
      title,
      message,
      tone,
      icon,
      requiredText,
      dismissible: true,
      choices: [
        { id: 'cancel', label: cancelLabel },
        { id: 'confirm', label: confirmLabel, tone: destructive ? 'danger' : 'primary' }
      ]
    });
    return result === 'confirm';
  }, [choose]);

  React.useEffect(() => {
    if (!request) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (request.dismissible !== false) finish(null);
      return true;
    });
    return () => subscription.remove();
  }, [finish, request]);

  const value = React.useMemo<DialogApi>(() => ({ choose, alert, confirm }), [alert, choose, confirm]);
  const tone = request?.tone || 'default';
  const toneStyle = dialogTone(palette, tone);

  return <DialogContext.Provider value={value}>
    <View style={styles.providerRoot}>
      {children}
      {request ? <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
          disabled={request.dismissible === false}
          onPress={() => request.dismissible !== false && finish(null)}
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.dark ? 'rgba(0,0,0,.30)' : 'rgba(33,30,24,.16)' }]}
        />
        <Animated.View style={[styles.dialog, { backgroundColor: palette.elevated, borderColor: palette.borderStrong, opacity, transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: toneStyle.background }]}>
            <Ionicons name={request.icon || toneStyle.icon} size={24} color={toneStyle.foreground} />
          </View>
          <View style={styles.copy}>
            <Urdu style={[styles.title, { color: palette.text }]}>{request.title}</Urdu>
            {request.message ? <Text style={[styles.message, { color: palette.muted }]}>{request.message}</Text> : null}
          </View>
          {request.requiredText ? <View style={styles.confirmationBlock}>
            <Text style={[styles.confirmationHelp, { color: palette.muted }]}>Type the title exactly to enable deletion:</Text>
            <Text selectable style={[styles.requiredText, { color: palette.text }]}>{request.requiredText}</Text>
            <TextInput
              accessibilityLabel="Confirmation text"
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter the exact title"
              placeholderTextColor={palette.muted}
              selectionColor={palette.accent}
              style={[styles.confirmationInput, { color: palette.text, backgroundColor: palette.input, borderColor: confirmation === request.requiredText ? palette.success : palette.borderStrong }]}
            />
          </View> : null}
          <View style={[styles.actions, request.choices.length === 2 && styles.actionsRow]}>
            {request.choices.map(choice => {
              const destructive = choice.tone === 'danger';
              const primary = choice.tone === 'primary';
              const filled = primary || destructive;
              const disabled = choice.id === 'confirm' && Boolean(request.requiredText) && confirmation !== request.requiredText;
              return <Pressable
                key={choice.id}
                accessibilityRole="button"
                accessibilityLabel={choice.label}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => finish(choice.id)}
                android_ripple={{ color: palette.border }}
                style={({ pressed }) => [
                  styles.action,
                  request.choices.length === 2 && styles.actionRowItem,
                  !filled && { borderColor: palette.borderStrong, borderWidth: 1, backgroundColor: palette.surface },
                  primary && { backgroundColor: palette.accent },
                  destructive && { backgroundColor: palette.dangerBg, borderColor: palette.danger, borderWidth: StyleSheet.hairlineWidth },
                  disabled && styles.disabled,
                  pressed && styles.pressed
                ]}
              >
                {choice.icon ? <Ionicons name={choice.icon} size={18} color={destructive ? palette.danger : primary ? (palette.dark ? '#11120F' : '#FFFCF7') : palette.accentStrong} /> : null}
                <Text style={[styles.actionText, { color: destructive ? palette.danger : primary ? (palette.dark ? '#11120F' : '#FFFCF7') : palette.accentStrong }]}>{choice.label}</Text>
              </Pressable>;
            })}
          </View>
        </Animated.View>
      </KeyboardAvoidingView> : null}
    </View>
  </DialogContext.Provider>;
}

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used inside DialogProvider');
  return context;
}

export function AppSheet({ visible, onDismiss, children }: { visible: boolean; onDismiss?: () => void; children: React.ReactNode }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, damping: 22, stiffness: 240, mass: .8, useNativeDriver: true }).start();
  }, [progress, visible]);

  React.useEffect(() => {
    if (!visible || !onDismiss) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [onDismiss, visible]);

  if (!visible) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  return <View style={styles.sheetOverlay} accessibilityViewIsModal>
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: progress, backgroundColor: palette.dark ? 'rgba(0,0,0,.30)' : 'rgba(33,30,24,.16)' }]}
    />
    {onDismiss ? <Pressable accessibilityRole="button" accessibilityLabel="Close modal" onPress={onDismiss} style={StyleSheet.absoluteFill} /> : null}
    <Animated.View style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.borderStrong, opacity: progress, transform: [{ translateY }] }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.sheetSafe}>{children}</SafeAreaView>
    </Animated.View>
  </View>;
}

function dialogTone(palette: ReturnType<typeof getPalette>, tone: DialogTone) {
  if (tone === 'success') return { foreground: palette.success, background: palette.successBg, icon: 'checkmark-circle-outline' as const };
  if (tone === 'warning') return { foreground: palette.warning, background: palette.warningBg, icon: 'warning-outline' as const };
  if (tone === 'danger') return { foreground: palette.danger, background: palette.dangerBg, icon: 'alert-circle-outline' as const };
  if (tone === 'info') return { foreground: palette.accentStrong, background: palette.accentSoft, icon: 'information-circle-outline' as const };
  return { foreground: palette.accentStrong, background: palette.accentSoft, icon: 'sparkles-outline' as const };
}

const styles = StyleSheet.create({
  providerRoot: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10000, elevation: 10000, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  dialog: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 24, padding: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: .14, shadowRadius: 24, elevation: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: spacing.xs },
  title: { fontSize: typography.urdu.section.fontSize, lineHeight: typography.urdu.section.lineHeight, fontWeight: '800' },
  message: { ...typography.latin.body },
  confirmationBlock: { gap: spacing.xs },
  confirmationHelp: { fontSize: 12, lineHeight: 18 },
  requiredText: { fontSize: 14, lineHeight: 22, fontWeight: '800' },
  confirmationInput: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: spacing.md, fontSize: 14 },
  actions: { gap: 10 },
  actionsRow: { flexDirection: 'row' },
  action: { minHeight: 46, paddingHorizontal: spacing.md, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, overflow: 'hidden' },
  actionRowItem: { flex: 1 },
  actionText: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  pressed: { opacity: .82 },
  disabled: { opacity: .42 },
  sheetOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9000, elevation: 9000, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 14 },
  sheetBackdrop: { zIndex: 0 },
  sheet: { flex: 1, zIndex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: .16, shadowRadius: 28, elevation: 22 },
  sheetSafe: { flex: 1, width: '100%' }
});
