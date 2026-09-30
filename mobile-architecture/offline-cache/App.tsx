/**
 * Raiz do app.
 *
 * Ordem de partida, e ela importa:
 *   1. migrar o schema local (sem banco não há SSOT, e sem SSOT não há tela)
 *   2. bootstrap do repositório: cache de imagens, expiração de TTL, sync inicial
 *   3. instalar os gatilhos de sync (foreground, rede, background)
 */

import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import migrations from './drizzle/migrations';
import { getContainer } from './src/container';
import { db } from './src/data/local/db';
import { FeedScreen } from './src/ui/FeedScreen';
import { theme } from './src/ui/theme';

export default function App() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    const { repository, connectivity } = getContainer();
    void repository.bootstrap();

    // Import tardio: `triggers` toca em AppState e no TaskManager, e nada disso
    // deve rodar antes de o banco existir.
    let stop: (() => void) | null = null;
    void import('./src/sync/triggers').then(({ installSyncTriggers }) => {
      stop = installSyncTriggers(repository, connectivity).stop;
    });

    return () => stop?.();
  }, [success]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Falha ao migrar o banco local</Text>
          <Text style={styles.errorBody}>{error.message}</Text>
        </View>
      ) : !success ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
          <Text style={styles.muted}>preparando banco local…</Text>
        </View>
      ) : (
        <FeedScreen />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, paddingTop: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  muted: { color: theme.textMuted },
  errorTitle: { color: theme.danger, fontWeight: '700' },
  errorBody: { color: theme.textMuted, textAlign: 'center' },
});
