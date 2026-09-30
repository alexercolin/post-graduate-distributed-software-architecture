/**
 * Tela do feed.
 *
 * Observa o banco local via `useFeedView`. Nunca chama rede, nunca espera rede
 * para a primeira pintura. O botão "debug" abre a tela usada na apresentação.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MAX_POSTS, TTL_DAYS } from '../config';
import { useFeedActions, useFeedView } from '../data/repository/useFeedView';
import { DebugScreen } from './DebugScreen';
import { OfflineBanner } from './OfflineBanner';
import { PostCard } from './PostCard';
import { theme } from './theme';

export function FeedScreen() {
  const snapshot = useFeedView();
  const { toggleLike, refresh } = useFeedActions();
  const [debugOpen, setDebugOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Feed</Text>
        <Pressable onPress={() => setDebugOpen(true)} hitSlop={10} style={styles.debugButton}>
          <Text style={styles.debugButtonText}>debug</Text>
        </Pressable>
      </View>

      <OfflineBanner
        isOnline={snapshot.isOnline}
        isSyncing={snapshot.isSyncing}
        lastSyncLabel={snapshot.lastSyncLabel}
        pendingWrites={snapshot.pendingWrites}
        deadWrites={snapshot.deadWrites}
      />

      {snapshot.status === 'cold-loading' ? (
        // Único caso de spinner em todo o app: cache vazio E sync em curso.
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
          <Text style={styles.muted}>primeira carga</Text>
        </View>
      ) : snapshot.status === 'cold-empty' ? (
        <EmptyState isOnline={snapshot.isOnline} onRetry={refresh} />
      ) : (
        <FlatList
          data={snapshot.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard item={item} onToggleLike={toggleLike} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.textMuted}
            />
          }
          ListFooterComponent={
            <Text style={styles.footerNote}>
              últimos {MAX_POSTS} posts · válidos por {TTL_DAYS} dias sem conexão
            </Text>
          }
        />
      )}

      <DebugScreen visible={debugOpen} onClose={() => setDebugOpen(false)} />
    </View>
  );
}

/** Cache frio sem rede: explicar, não mostrar erro. */
function EmptyState({ isOnline, onRetry }: { isOnline: boolean; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>Nada em cache ainda</Text>
      <Text style={styles.emptyBody}>
        {isOnline
          ? 'Não há posts salvos neste dispositivo. Puxe para sincronizar.'
          : `Sem conexão e sem cache local. O feed offline guarda os últimos ${MAX_POSTS} posts por ${TTL_DAYS} dias — conecte-se uma vez para preenchê-lo.`}
      </Text>
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>tentar sincronizar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space,
    paddingBottom: 8,
  },
  title: { color: theme.text, fontSize: 24, fontWeight: '700' },
  debugButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  debugButtonText: { color: theme.textMuted, fontSize: 12 },
  list: { padding: theme.space, gap: theme.space },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  muted: { color: theme.textMuted },
  emptyTitle: { color: theme.text, fontSize: 18, fontWeight: '600' },
  emptyBody: { color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
  retry: {
    marginTop: 8,
    backgroundColor: theme.surfaceAlt,
    borderRadius: theme.radius,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: theme.accent, fontWeight: '600' },
  footerNote: { color: theme.textMuted, fontSize: 11, textAlign: 'center', paddingVertical: 16 },
});
