import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { repository } from '../services/repository';
import { useApp } from '../store/AppContext';
import { BackupData } from '../types';
import { Button, Card } from '../components/Ui';
import { getPalette } from '../theme/theme';

export function BackupScreen({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const [busy, setBusy] = useState(false);
  const palette = getPalette(app.readingTheme);

  const exportBackup = async () => {
    setBusy(true);
    let path: string | undefined;
    try {
      const data = await repository.exportBackup();
      path = `${FileSystem.cacheDirectory}diwan-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Diwan Backup' });
      else Alert.alert('Backup', path);
    } catch (error: any) {
      Alert.alert('Backup', error.message);
    } finally {
      if (path) await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => undefined);
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const data = JSON.parse(raw) as BackupData;
      if (!data.authorProfile || !Array.isArray(data.books) || !Array.isArray(data.writings) || !Array.isArray(data.readers)) throw new Error('Invalid backup file.');
      await repository.restoreBackup(data);
      await app.refresh();
      Alert.alert('Restored', 'Your backup has been restored.');
    } catch (error: any) {
      Alert.alert('Restore', error.message);
    } finally {
      setBusy(false);
    }
  };

  return <ScrollView style={[styles.root, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={[styles.header, { borderBottomColor: palette.border }]}>
      <Button compact variant="ghost" title="Close" onPress={onClose} />
      <Text style={[styles.heading, { color: palette.text }]}>Backup & Restore</Text>
      <View style={styles.headerSpacer} />
    </View>
    <Card style={[styles.card, { borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.iconTile, { backgroundColor: palette.surface2 }]}><Ionicons name="archive-outline" size={23} color={palette.accent} /></View>
        <Text style={[styles.title, { color: palette.text }]}>Export Backup</Text>
      </View>
      <Button title={busy ? 'Please wait…' : 'Export backup'} icon="archive-outline" onPress={exportBackup} disabled={busy} />
    </Card>
    <Card style={[styles.card, { borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.iconTile, { backgroundColor: palette.surface2 }]}><Ionicons name="cloud-upload-outline" size={23} color={palette.accent} /></View>
        <Text style={[styles.title, { color: palette.text }]}>Restore Backup</Text>
      </View>
      <Button variant="secondary" title="Choose backup" icon="cloud-upload-outline" onPress={restore} disabled={busy} />
    </Card>
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 14, gap: 12, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10, marginBottom: 8 },
  headerSpacer: { width: 68 },
  heading: { flex: 1, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  card: { gap: 16, paddingTop: 18 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '800' }
});

