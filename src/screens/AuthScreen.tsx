import React, { useRef, useState } from 'react';
import { Image, NativeSyntheticEvent, Pressable, StyleSheet, Text, TextInput, TextInputKeyPressEventData, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Button, Field, Screen, Urdu } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { useApp } from '../store/AppContext';
import { getPalette, layout, radii, spacing } from '../theme/theme';

function OtpBoxes({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  const setDigits = (next: string) => onChange(next.replace(/\D/g, '').slice(0, 6));
  const changeDigit = (index: number, raw: string) => {
    const numeric = raw.replace(/\D/g, '');
    if (numeric.length > 1) {
      const pasted = numeric.slice(0, 6);
      setDigits(pasted);
      refs.current[Math.min(pasted.length, 6) - 1]?.focus();
      return;
    }
    const current = digits.slice();
    current[index] = numeric.slice(-1);
    const next = current.join('').slice(0, 6);
    setDigits(next);
    if (numeric && index < 5) refs.current[index + 1]?.focus();
  };
  const keyPress = (index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  };

  return <View style={styles.otpWrap}>
    <Text style={[styles.otpLabel, { color: palette.muted }]}>6-digit code</Text>
    <View style={styles.otpRow}>
      {digits.map((digit, index) => <TextInput
        key={index}
        ref={ref => { refs.current[index] = ref; }}
        accessibilityLabel={`Verification code digit ${index + 1}`}
        value={digit}
        onChangeText={text => changeDigit(index, text)}
        onKeyPress={event => keyPress(index, event)}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={index === 0 ? 6 : 1}
        selectTextOnFocus
        selectionColor={palette.accent}
        style={[styles.otpBox, { color: palette.text, backgroundColor: palette.input, borderColor: digit ? palette.accent : palette.border }]}
      />)}
    </View>
  </View>;
}

export function AuthScreen({ onBack }: { onBack: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const palette = getPalette(app.readingTheme);
  const [mode, setMode] = useState<'reader' | 'admin'>('reader');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const readerLogin = async () => { if (!username.trim() || !password) { await dialog.alert({ title: 'Missing details', message: 'Enter your username and password.', tone: 'warning' }); return; } setLoading(true); try { await app.loginReader(username.trim(),password); } catch(e:any){ await dialog.alert({ title: e?.code==='DEVICE_LOCKED'?'Device locked':'Unable to sign in', message: e?.message||'Check your credentials.', tone: e?.code==='DEVICE_LOCKED'?'warning':'danger', icon: e?.code==='DEVICE_LOCKED'?'lock-closed-outline':undefined }); } finally { setLoading(false); } };
  const sendOtp = async () => { if(!email.trim()) { await dialog.alert({ title: 'Email required', message: 'Enter the author email address.', tone: 'warning' }); return; } setLoading(true); try { await app.sendAdminOtp(email.trim()); setOtp(''); setOtpSent(true); } catch(e:any){ setOtp(''); setOtpSent(false); await dialog.alert({ title: e?.code === 'AUTHOR_NOT_REGISTERED' ? 'Email not registered' : 'Verification code', message: e.message, tone: 'danger' }); } finally { setLoading(false); } };
  const verify = async () => { if (otp.length !== 6) { await dialog.alert({ title: 'Verification code', message: 'Enter all 6 digits.', tone: 'warning' }); return; } setLoading(true); try { await app.verifyAdminOtp(email.trim(),otp); } catch(e:any){ await dialog.alert({ title: 'Verification code', message: e.message, tone: 'danger' }); } finally { setLoading(false); } };
  const activeForeground = palette.dark ? '#11120F' : '#FFFCF7';

  return <Screen scroll keyboard style={styles.root}>
    <StatusBar style={palette.dark?'light':'dark'}/>
    <View style={styles.topbar}>
      <Pressable accessibilityLabel="Back" onPress={onBack} style={({pressed})=>[styles.iconButton,{borderColor:palette.border,backgroundColor:palette.surface},pressed&&styles.pressed]}><Ionicons name="arrow-back" size={19} color={palette.accentStrong}/></Pressable>
      <Pressable accessibilityLabel="Change theme" onPress={()=>app.setTheme(palette.dark?'classic':'dark')} style={({pressed})=>[styles.iconButton,{borderColor:palette.border,backgroundColor:palette.surface},pressed&&styles.pressed]}><Ionicons name={palette.dark?'sunny-outline':'moon-outline'} size={19} color={palette.accentStrong}/></Pressable>
    </View>

    <View style={styles.shell}>
      <View style={styles.brandBlock}>
        <Image source={require('../../assets/Raza  Logo.png')} resizeMode="contain" style={styles.logo}/>
        <Urdu style={styles.brand}>Kalam e Raza</Urdu>
        <Text style={[styles.tagline,{color:palette.muted}]}>Private poetry library</Text>
      </View>

      <View style={[styles.panel,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <View style={[styles.tabs,{backgroundColor:palette.surface2,borderColor:palette.border}]}>
          {([['reader','Reader','book-outline'],['admin','Author','person-outline']] as const).map(([value,label,icon])=><Pressable key={value} onPress={()=>{setMode(value);setOtpSent(false);setOtp('');}} style={({pressed})=>[styles.tab,mode===value&&{backgroundColor:palette.accent},pressed&&styles.pressed]}><Ionicons name={icon} size={16} color={mode===value?activeForeground:palette.muted}/><Text style={[styles.tabText,{color:mode===value?activeForeground:palette.muted}]}>{label}</Text></Pressable>)}
        </View>

        {mode==='reader'?<View style={styles.form}>
          <View><Text style={[styles.formTitle,{color:palette.text}]}>Welcome back</Text><Text style={[styles.formSub,{color:palette.muted}]}>Sign in to open your private library.</Text></View>
          <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="Your username" returnKeyType="next"/>
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" returnKeyType="done" onSubmitEditing={readerLogin}/>
          <Button title="Enter library" icon="arrow-forward" onPress={readerLogin} loading={loading}/>
          <View style={styles.secure}><Ionicons name="lock-closed-outline" size={14} color={palette.muted}/><Text style={[styles.secureText,{color:palette.muted}]}>This library is private and device access may be restricted.</Text></View>
        </View>:<View style={styles.form}>
          <View><Text style={[styles.formTitle,{color:palette.text}]}>Author access</Text><Text style={[styles.formSub,{color:palette.muted}]}>Verify your author account to open the studio.</Text></View>
          {!otpSent?<><Field label="Author email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="off" importantForAutofill="no" textContentType="none" placeholder="Enter author email" returnKeyType="send" onSubmitEditing={sendOtp}/><Button title="Send verification code" icon="mail-outline" onPress={sendOtp} loading={loading}/></>:<><OtpBoxes value={otp} onChange={setOtp}/><Button title="Open Author Studio" icon="shield-checkmark-outline" onPress={verify} loading={loading} disabled={otp.length!==6}/><Button title="Use another email" variant="ghost" onPress={()=>{setOtpSent(false);setOtp('');}}/></>}
        </View>}
      </View>
    </View>
  </Screen>;
}

const styles=StyleSheet.create({root:{paddingHorizontal:spacing.lg},topbar:{width:'100%',maxWidth:layout.readerMaxWidth,alignSelf:'center',flexDirection:'row',justifyContent:'space-between'},iconButton:{width:44,height:44,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},shell:{width:'100%',maxWidth:500,alignSelf:'center',paddingTop:24,gap:28},brandBlock:{alignItems:'center'},logo:{width:74,height:74},brand:{fontSize:30,lineHeight:57,fontWeight:'700',marginTop:2},tagline:{fontSize:12,letterSpacing:.2,marginTop:-7},panel:{borderWidth:1,borderRadius:20,padding:16},tabs:{flexDirection:'row',gap:4,padding:4,borderWidth:1,borderRadius:14},tab:{flex:1,minHeight:44,borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},tabText:{fontSize:12,fontWeight:'700'},form:{gap:15,paddingTop:22},formTitle:{fontSize:19,fontWeight:'800'},formSub:{fontSize:11,lineHeight:17,marginTop:3},secure:{flexDirection:'row',alignItems:'center',gap:7,justifyContent:'center',paddingHorizontal:8},secureText:{fontSize:10,lineHeight:16,flexShrink:1,textAlign:'center'},otpWrap:{gap:spacing.sm},otpLabel:{fontSize:12,fontWeight:'600'},otpRow:{flexDirection:'row',justifyContent:'space-between',gap:spacing.xs},otpBox:{flex:1,maxWidth:50,minWidth:36,height:52,borderWidth:1,borderRadius:radii.control,textAlign:'center',fontSize:21,fontWeight:'700',paddingVertical:0},pressed:{opacity:.72,transform:[{scale:.98}]}});
