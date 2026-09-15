import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Button, Card, Field, Screen, Urdu } from '../components/Ui';
import { useApp } from '../store/AppContext';
import { getPalette } from '../theme/theme';

export function AuthScreen({ onBack }: { onBack: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const [mode, setMode] = useState<'reader' | 'admin'>('reader');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('hassnainmaitla313@gmail.com');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const readerLogin = async () => {
    if (!username.trim() || !password) return Alert.alert('Missing details', 'Enter your username and password.');
    setLoading(true);
    try { await app.loginReader(username.trim(), password); }
    catch (e: any) { Alert.alert(e?.code === 'DEVICE_LOCKED' ? 'Device locked' : 'Unable to sign in', e?.message || 'Check your credentials.'); }
    finally { setLoading(false); }
  };
  const sendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try { await app.sendAdminOtp(email.trim()); setOtp(''); setOtpSent(true); }
    catch (e: any) { Alert.alert('Verification code', e.message); }
    finally { setLoading(false); }
  };
  const verify = async () => {
    setLoading(true);
    try { await app.verifyAdminOtp(email.trim(), otp.trim()); }
    catch (e: any) { Alert.alert('Verification code', e.message); }
    finally { setLoading(false); }
  };
  const onAccent = palette.dark ? '#11120F' : '#FFFCF7';

  return <Screen scroll keyboard style={styles.root}>
    <StatusBar style={palette.dark ? 'light' : 'dark'} />
    <View style={styles.topbar}>
      <Pressable accessibilityLabel="Back" onPress={onBack} style={[styles.topButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Ionicons name="arrow-back" size={18} color={palette.accent} />
      </Pressable>
      <Pressable accessibilityLabel="Change theme" onPress={() => app.setTheme(palette.dark ? 'classic' : 'dark')} style={[styles.topButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Ionicons name={palette.dark ? 'sunny-outline' : 'moon-outline'} size={18} color={palette.accent} />
      </Pressable>
    </View>

    <View style={styles.frame}>
      <Card style={[styles.portal, { backgroundColor: palette.elevated, borderColor: palette.border, shadowColor: palette.shadow }]}>
        <View style={[styles.corner, styles.cornerRight, { borderColor: palette.gold }]} />
        <View style={[styles.corner, styles.cornerLeft, { borderColor: palette.gold }]} />
        <View style={[styles.seal, { backgroundColor: palette.surface, borderColor: palette.borderStrong }]}>
          <Ionicons name="shield-checkmark-outline" size={29} color={palette.accent} />
        </View>
        <Urdu style={styles.brand}>Kalam E Raza</Urdu>
        <Text style={[styles.english, { color: palette.gold }]}>CONTROLLED ACCESS POETRY PORTAL</Text>
        <View style={[styles.flourish, { backgroundColor: palette.gold }]}><View style={[styles.flourishDot, { backgroundColor: palette.gold }]} /></View>

        <View style={[styles.tabs, { backgroundColor: palette.surface2, borderColor: palette.border }]}>
          <Pressable onPress={() => setMode('reader')} style={[styles.tab, mode === 'reader' && { backgroundColor: palette.accent }]}>
            <Ionicons name="book-outline" size={16} color={mode === 'reader' ? onAccent : palette.muted} />
            <Urdu style={[styles.tabText, { color: mode === 'reader' ? onAccent : palette.muted }]}>Reader</Urdu>
          </Pressable>
          <Pressable onPress={() => setMode('admin')} style={[styles.tab, mode === 'admin' && { backgroundColor: palette.accent }]}>
            <Ionicons name="person-outline" size={16} color={mode === 'admin' ? onAccent : palette.muted} />
            <Urdu style={[styles.tabText, { color: mode === 'admin' ? onAccent : palette.muted }]}>Author</Urdu>
          </Pressable>
        </View>

        {mode === 'reader' ? <View style={styles.form}>
          <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="e.g. ali" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          <Button title="Open Library" icon="arrow-forward" onPress={readerLogin} loading={loading} />
          {/* {!hasRemoteApi ? <View style={[styles.demo, { borderColor: palette.border }]}>
            <Urdu style={[styles.demoLabel, { color: palette.muted }]}>Demo accounts</Urdu>
            <View style={styles.demoRow}>
              <Pressable onPress={() => { setUsername('ahmed'); setPassword('urdu123'); }} style={[styles.credential, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.credentialText, { color: palette.text }]}>ahmed / urdu123</Text></Pressable>
              <Pressable onPress={() => { setUsername('fatima'); setPassword('shair786'); }} style={[styles.credential, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.credentialText, { color: palette.text }]}>fatima / shair786</Text></Pressable>
            </View>
          </View> : null} */}
        </View> : <View style={styles.form}>
          {!otpSent ? <>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <Button title="Send verification code" icon="mail-outline" onPress={sendOtp} loading={loading} />
          </> : <>
            <Field label="6-digit code" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
            <Button title="Open Dashboard" icon="shield-checkmark-outline" onPress={verify} loading={loading} />
            <Button title="Request another code" variant="ghost" onPress={() => setOtpSent(false)} />
          </>}
        </View>}
      </Card>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  root: { padding: 18, paddingBottom: 34 },
  topbar: { width: '100%', maxWidth: 520, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  topButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  portal: { overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 28, shadowOffset: { width: 0, height: 14 }, shadowOpacity: .12, shadowRadius: 26, elevation: 5 },
  corner: { position: 'absolute', top: 13, width: 24, height: 24, opacity: .45 },
  cornerRight: { right: 13, borderTopWidth: 1, borderRightWidth: 1, borderTopRightRadius: 8 },
  cornerLeft: { left: 13, borderTopWidth: 1, borderLeftWidth: 1, borderTopLeftRadius: 8 },
  seal: { alignSelf: 'center', width: 58, height: 58, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  brand: { textAlign: 'center', fontSize: 30, lineHeight: 49, fontWeight: '700' },
  english: { textAlign: 'center', fontSize: 9, letterSpacing: 2.2, marginTop: -4 },
  flourish: { width: 50, height: 1, alignSelf: 'center', marginTop: 16, marginBottom: 18, alignItems: 'center', justifyContent: 'center' },
  flourishDot: { width: 5, height: 5, borderRadius: 3 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 44, borderRadius: 11, paddingHorizontal: 6, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tabText: { fontSize: 13, lineHeight: 25, fontWeight: '700' },
  form: { marginTop: 18, gap: 14 },
  notice: { minHeight: 62, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  help: { flex: 1, textAlign: 'right', fontSize: 11, lineHeight: 23 },
  secureLine: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, paddingHorizontal: 3 },
  secureText: { flex: 1, fontSize: 9, lineHeight: 20, textAlign: 'right' },
  demo: { borderTopWidth: 1, paddingTop: 13, marginTop: 2, gap: 8 },
  demoLabel: { fontSize: 10, lineHeight: 22, textAlign: 'right' },
  demoRow: { flexDirection: 'row-reverse', gap: 7, flexWrap: 'wrap' },
  credential: { flexGrow: 1, borderWidth: 1, borderRadius: 11, minHeight: 38, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  credentialText: { fontSize: 11 },
  privacy: { textAlign: 'center', fontSize: 9, lineHeight: 22, marginTop: 15 }
});


