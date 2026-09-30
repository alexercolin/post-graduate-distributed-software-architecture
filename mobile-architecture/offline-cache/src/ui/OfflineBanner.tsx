/**
 * Banner de estado. Não é enfeite: é o que torna a consistência eventual honesta.
 * Se o dado pode estar velho, o usuário precisa ver quão velho.
 */

import { StyleSheet, Text, View } from 'react-native';

import { theme } from './theme';

interface Props {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncLabel: string;
  pendingWrites: number;
  deadWrites: number;
}

export function OfflineBanner({
  isOnline,
  isSyncing,
  lastSyncLabel,
  pendingWrites,
  deadWrites,
}: Props) {
  const tone = !isOnline ? theme.warn : isSyncing ? theme.accent : theme.ok;
  const label = !isOnline ? 'Offline' : isSyncing ? 'Sincronizando…' : 'Online';

  return (
    <View style={[styles.container, { borderLeftColor: tone }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: tone }]} />
        <Text style={styles.status}>{label}</Text>
        <Text style={styles.timestamp}>{lastSyncLabel}</Text>
      </View>

      {pendingWrites > 0 ? (
        <Text style={styles.pending}>
          {pendingWrites} {pendingWrites === 1 ? 'curtida pendente' : 'curtidas pendentes'} de envio
        </Text>
      ) : null}

      {deadWrites > 0 ? (
        <Text style={styles.dead}>
          {deadWrites} {deadWrites === 1 ? 'escrita desistiu' : 'escritas desistiram'} após o teto de
          tentativas
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderLeftWidth: 3,
    paddingHorizontal: theme.space,
    paddingVertical: 10,
    gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { color: theme.text, fontWeight: '600', fontSize: 13 },
  timestamp: { color: theme.textMuted, fontSize: 13, marginLeft: 'auto' },
  pending: { color: theme.warn, fontSize: 12 },
  dead: { color: theme.danger, fontSize: 12 },
});
