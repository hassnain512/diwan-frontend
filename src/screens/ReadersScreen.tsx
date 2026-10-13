import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { Button, EmptyState, Field, Label, Urdu } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { colors } from '../theme/colors';
import { fontFamily, getPalette, layout, radii, spacing, typography } from '../theme/theme';

export function ReadersScreen() {
  const app = useApp();
  const dialog = useDialog();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const palette = getPalette(app.readingTheme);
  const dark = app.readingTheme === 'dark';
  const success = dark ? '#A8C9A4' : colors.success;
  const readers = useMemo(() => app.readers.filter(reader => `${reader.fullName} ${reader.username}`.toLowerCase().includes(query.trim().toLowerCase())), [app.readers, query]);

  const create = async () => {
    if (!name.trim() || username.trim().length < 3 || password.length < 8) {
      await dialog.alert({ title: 'Invalid details', message: 'Enter a name, a username of at least 3 characters, and a password of at least 8 characters.', tone: 'warning' });
      return;
    }
    setCreating(true);
    try {
      await app.createReader({ fullName: name.trim(), username: username.trim(), password });
      setName(''); setUsername(''); setPassword(''); setAdding(false);
    } catch (error: any) {
      await dialog.alert({ title: 'Reader', message: error.message, tone: 'danger' });
    } finally {
      setCreating(false);
    }
  };

  const showActions = async (item: (typeof app.readers)[number]) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    const choice = await dialog.choose({
      title: item.fullName,
      message: `@${item.username}`,
      tone: 'info',
      icon: 'person-outline',
      dismissible: true,
      choices: [
        { id: 'cancel', label: 'Cancel' },
        { id: 'toggle', label: item.status === 'active' ? 'Deactivate' : 'Activate', icon: item.status === 'active' ? 'pause-circle-outline' : 'checkmark-circle-outline' },
        { id: 'reset', label: 'Reset device', icon: 'phone-portrait-outline' },
        { id: 'delete', label: 'Delete reader', tone: 'danger', icon: 'trash-outline' }
      ]
    });
    if (choice === 'toggle') await app.updateReader(item.id, { status: nextStatus });
    if (choice === 'reset') await app.resetReaderDevice(item.id);
    if (choice === 'delete') {
      const confirmed = await dialog.confirm({ title: 'Delete reader?', message: item.fullName, confirmLabel: 'Delete', destructive: true, tone: 'danger', icon: 'trash-outline' });
      if (confirmed) await app.removeReader(item.id);
    }
  };

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <FlatList
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      data={readers}
      keyExtractor={reader => reader.id}
      ListHeaderComponent={<>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: palette.muted }]}>ACCESS</Text>
            <Urdu style={styles.heading}>Readers</Urdu>
            <Label style={{ color: palette.muted }}>{app.readers.length} accounts</Label>
          </View>
          <Button compact title={adding ? 'Close' : 'New reader'} icon={adding ? 'close' : 'person-add-outline'} onPress={() => setAdding(value => !value)} />
        </View>

        {adding ? <View style={[styles.addPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.addCopy}><Urdu style={styles.addTitle}>Create reader</Urdu><Label style={{ color: palette.muted }}>Private access can be restricted to one device.</Label></View>
          <Field label="Full name" rtl style={{ fontFamily }} value={name} onChangeText={setName} returnKeyType="next" />
          <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={() => void create()} />
          <Button title="Create account" icon="person-add-outline" onPress={create} loading={creating} />
        </View> : null}

        <View style={[styles.search, { backgroundColor: palette.input, borderColor: palette.border }]}>
          <Ionicons name="search-outline" size={18} color={palette.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search readers" placeholderTextColor={palette.muted} autoCapitalize="none" autoCorrect={false} style={[styles.searchInput, { color: palette.text }]} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearButton}><Ionicons name="close-circle" size={19} color={palette.muted} /></Pressable> : null}
        </View>
      </>}
      ListEmptyComponent={<EmptyState icon="people-outline" title={query ? 'No matching readers' : 'No readers yet'} message={query ? 'Try another name or username.' : 'Create a reader account to grant private library access.'} />}
      renderItem={({ item }) => <View style={[styles.readerRow, { borderBottomColor: palette.border }]}>
        <View style={[styles.avatar, { backgroundColor: palette.accentSoft }]}><Urdu style={[styles.avatarText, { color: palette.accentStrong }]}>{item.fullName.slice(0, 1)}</Urdu></View>
        <View style={styles.info}>
          <View style={styles.nameLine}>
            <Urdu style={styles.name}>{item.fullName}</Urdu>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? success : palette.muted }]} />
          </View>
          <Text style={[styles.meta, { color: palette.muted }]}>@{item.username} · {item.deviceId ? 'Device bound' : 'No device'}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>{item.lastLogin ? `Last login ${new Date(item.lastLogin).toLocaleDateString()}` : 'Never signed in'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Actions for ${item.fullName}`} onPress={() => void showActions(item)} style={({ pressed }) => [styles.moreButton, { borderColor: palette.border, backgroundColor: palette.surface }, pressed && styles.pressed]}><Ionicons name="ellipsis-horizontal" size={20} color={palette.accentStrong} /></Pressable>
      </View>}
    />
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, root: { flex: 1 }, content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 104 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg, gap: spacing.md }, headerCopy: { flex: 1, alignItems: 'flex-start' }, kicker: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginBottom: 1 }, heading: { fontSize: typography.urdu.title.fontSize, lineHeight: typography.urdu.title.lineHeight, fontWeight: '800' },
  addPanel: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.lg }, addCopy: { gap: 2 }, addTitle: { fontSize: 18, lineHeight: 34, fontWeight: '800', textAlign: 'left' },
  search: { minHeight: 50, borderWidth: 1, borderRadius: radii.control, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm }, searchInput: { flex: 1, fontSize: 14, minHeight: 48 }, clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  readerRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth }, avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 18, lineHeight: 34, fontWeight: '800' }, info: { flex: 1, minWidth: 0, alignItems: 'flex-start' }, nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { fontSize: 16, lineHeight: 31, fontWeight: '800' }, statusDot: { width: 7, height: 7, borderRadius: 999 }, meta: { fontSize: 11, lineHeight: 17, textAlign: 'left' }, moreButton: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radii.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: .72, transform: [{ scale: .97 }] }
});
