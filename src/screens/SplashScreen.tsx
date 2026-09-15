import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Button, Screen } from '../components/Ui';
import { useApp } from '../store/AppContext';
import { getPalette } from '../theme/theme';

export function SplashScreen({ onEnter, authorName = 'Hassnain Raza Maitla', penName = 'رضا' }: { onEnter: () => void; authorName?: string; penName?: string }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, friction: 9, useNativeDriver: true })
    ]);
    animation.start();
    return () => animation.stop();
  }, [fade, rise]);

  return <Screen style={styles.root}>
    <StatusBar style={palette.dark ? 'light' : 'dark'} />
    <View style={[styles.corner, styles.topLeft, { borderColor: palette.gold }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: palette.gold }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: palette.gold }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: palette.gold }]} />

    <Animated.View style={[styles.frame, { opacity: fade, transform: [{ translateY: rise }] }]}>
      <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: palette.elevated, borderColor: palette.border, shadowColor: palette.shadow }]}>
        <View style={[styles.emblem, { backgroundColor: palette.accentSoft, borderColor: palette.borderStrong }]}>
          <Ionicons name="book-outline" size={44} color={palette.accentStrong} />
        </View>
        <View style={styles.ruleRow}><View style={[styles.rule, { backgroundColor: palette.gold }]} /><View style={[styles.dot, { backgroundColor: palette.gold }]} /><View style={[styles.rule, { backgroundColor: palette.gold }]} /></View>
        <Text style={[styles.title, { color: palette.text }]}>Kalam E Raza</Text>
        <Text style={[styles.subtitle, { color: palette.gold }]}>PRIVATE POETRY LIBRARY</Text>
        <View style={[styles.author, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
          <Text style={[styles.authorName, { color: palette.text }]}>{authorName}</Text>
          <Text style={[styles.penName, { color: palette.muted }]}>{penName}</Text>
        </View>
      </View>
      <Button title="Enter Library" icon="arrow-forward" onPress={onEnter} />
    </Animated.View>
  </Screen>;
}

const baseCorner = { position: 'absolute' as const, width: 42, height: 42, opacity: .45 };
const styles = StyleSheet.create({
  root: { padding: 22, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '100%', maxWidth: 430, gap: 16 },
  card: { minHeight: 430, borderWidth: 1, borderRadius: 30, padding: 30, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 16 }, shadowOpacity: .11, shadowRadius: 28, elevation: 5 },
  cardCompact: { minHeight: 370, padding: 24 },
  emblem: { width: 104, height: 104, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ruleRow: { width: 106, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  rule: { flex: 1, height: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { fontSize: 22, lineHeight: 52, fontWeight: '300', letterSpacing: 8, marginLeft: 8 },
  subtitle: { fontSize: 10, lineHeight: 16, fontWeight: '600', letterSpacing: 2.4, marginTop: 4 },
  author: { width: '100%', marginTop: 28, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  authorName: { fontSize: 16, fontWeight: '600' },
  penName: { fontSize: 10, letterSpacing: 1.8, marginTop: 4 },
  corner: baseCorner,
  topLeft: { left: 22, top: 22, borderLeftWidth: 1, borderTopWidth: 1, borderTopLeftRadius: 9 },
  topRight: { right: 22, top: 22, borderRightWidth: 1, borderTopWidth: 1, borderTopRightRadius: 9 },
  bottomLeft: { left: 22, bottom: 22, borderLeftWidth: 1, borderBottomWidth: 1, borderBottomLeftRadius: 9 },
  bottomRight: { right: 22, bottom: 22, borderRightWidth: 1, borderBottomWidth: 1, borderBottomRightRadius: 9 }
});
