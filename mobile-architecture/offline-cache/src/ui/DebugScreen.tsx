/**
 * Tela de debug — o instrumento da apresentação.
 *
 * Mostra o que normalmente fica invisível (uso do cache, outbox, cursor, última
 * sync) e permite provocar cada caminho da arquitetura ao vivo: forçar offline,
 * deletar um post no servidor, estourar o budget, limpar tudo.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { getContainer } from '../container';
import { CACHE_BUDGET_MB, MAX_POSTS, TTL_DAYS } from '../config';
import type { Diagnostics } from '../data/repository/feedRepository';
import { triggerBackgroundSyncForTesting } from '../sync/backgroundSync';
import { theme } from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DebugScreen({ visible, onClose }: Props) {
  const { repository, server } = getContainer();
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [note, setNote] = useState<string>('');
  const [latency, setLatency] = useState(server.controls.latencyMs);
  const [errorRate, setErrorRate] = useState(server.controls.errorRate);

  const reload = useCallback(async () => {
    setDiagnostics(await repository.diagnostics());
  }, [repository]);

  useEffect(() => {
    if (!visible) return;
    void reload();
    const id = setInterval(() => void reload(), 1_000);
    return () => clearInterval(id);
  }, [visible, reload]);

  const run = (label: string, action: () => Promise<unknown> | unknown) => async () => {
    const result = await action();
    setNote(`${label}${typeof result === 'string' ? `: ${result}` : ''}`);
    await reload();
  };

  const usageMb = diagnostics?.cache.megabytes ?? 0;
  const ratio = Math.min(1, diagnostics?.cache.ratio ?? 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>fechar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Section title={`Cache de imagens · teto ${CACHE_BUDGET_MB} MB`}>
            <Row label="uso" value={`${usageMb.toFixed(2)} MB`} />
            <Row label="itens" value={`${diagnostics?.cache.count ?? 0}`} />
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${ratio * 100}%`, backgroundColor: ratio > 0.9 ? theme.warn : theme.ok },
                ]}
              />
            </View>
          </Section>

          <Section title="Sincronização">
            <Row label="cursor" value={diagnostics?.cursor ?? '—'} mono />
            <Row label="última sync ok" value={diagnostics?.lastSuccessAt ?? 'nunca'} mono />
            <Row label="posts locais" value={`${diagnostics?.postCount ?? 0} / ${MAX_POSTS}`} />
            <Row label="janela offline" value={`${TTL_DAYS} dias`} />
            <Row label="online" value={diagnostics?.isOnline ? 'sim' : 'não'} />
            <Row label="sync em curso" value={diagnostics?.isSyncing ? 'sim' : 'não'} />
          </Section>

          <Section title={`Outbox · ${diagnostics?.pendingWrites ?? 0} pendentes`}>
            {diagnostics && diagnostics.outbox.length > 0 ? (
              diagnostics.outbox.map((entry) => (
                <View key={entry.id} style={styles.outboxRow}>
                  <Text style={styles.outboxKind}>
                    {entry.kind === 'like' ? '♥' : '♡'} {entry.entityId}
                  </Text>
                  <Text style={styles.outboxMeta}>
                    {entry.status} · {entry.attempts} tent.
                    {entry.lastError !== null ? ` · ${entry.lastError}` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>vazio</Text>
            )}
          </Section>

          <Section title="Rede simulada">
            <View style={styles.switchRow}>
              <Text style={styles.label}>forçar offline</Text>
              <Switch
                value={diagnostics?.isForcedOffline ?? false}
                onValueChange={(value) => {
                  repository.setForcedOffline(value);
                  void reload();
                }}
              />
            </View>
            <Row label="latência" value={`${latency} ms`} />
            <View style={styles.buttonRow}>
              {[0, 250, 1500].map((ms) => (
                <Button
                  key={ms}
                  label={`${ms}ms`}
                  onPress={run(`latência ${ms}ms`, () => {
                    server.setLatency(ms);
                    setLatency(ms);
                  })}
                />
              ))}
            </View>
            <Row label="taxa de erro" value={`${Math.round(errorRate * 100)}%`} />
            <View style={styles.buttonRow}>
              {[0, 0.5, 1].map((rate) => (
                <Button
                  key={rate}
                  label={`${Math.round(rate * 100)}%`}
                  onPress={run(`erro ${Math.round(rate * 100)}%`, () => {
                    server.setErrorRate(rate);
                    setErrorRate(rate);
                  })}
                />
              ))}
            </View>
          </Section>

          <Section title="Ações">
            <View style={styles.buttonRow}>
              <Button
                label="sincronizar"
                onPress={run('sync disparada', () => repository.sync('manual'))}
              />
              <Button
                label="baixar thumbs"
                onPress={run('download disparado', () => repository.warmImages())}
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                label="deletar post no servidor"
                onPress={run('tombstone criado', () => {
                  const first = diagnostics?.outbox[0]?.entityId;
                  const target = first ?? firstLocalPostId(diagnostics);
                  return target !== null && server.deletePost(target)
                    ? `${target} deletado no servidor`
                    : 'nenhum post para deletar';
                })}
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                label="publicar post"
                onPress={run('post publicado', () => server.publishPost().id)}
              />
              <Button
                label="task de background"
                onPress={run('background', async () =>
                  (await triggerBackgroundSyncForTesting()) ? 'disparada' : 'indisponível',
                )}
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                label="limpar cache de imagens"
                tone={theme.warn}
                onPress={run('cache limpo', () => repository.clearImageCache())}
              />
              <Button
                label="limpar tudo"
                tone={theme.danger}
                onPress={run('banco e cache limpos', () => repository.clearAll())}
              />
            </View>
          </Section>

          {note !== '' ? <Text style={styles.note}>{note}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function firstLocalPostId(diagnostics: Diagnostics | null): string | null {
  return diagnostics?.cacheEntries[0]?.key ?? null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, mono === true && styles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Button({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={[styles.buttonText, tone !== undefined && { color: tone }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.space,
    paddingBottom: theme.space,
  },
  title: { color: theme.text, fontSize: 22, fontWeight: '700' },
  close: { color: theme.accent },
  body: { padding: theme.space, gap: theme.space, paddingBottom: 48 },
  section: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    padding: theme.space,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  sectionTitle: { color: theme.text, fontWeight: '700', marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: theme.textMuted, fontSize: 13 },
  value: { color: theme.text, fontSize: 13, flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: 'Courier', fontSize: 11 },
  muted: { color: theme.textMuted, fontSize: 13 },
  barTrack: {
    height: 8,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: '100%' },
  outboxRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingTop: 6 },
  outboxKind: { color: theme.text, fontSize: 13 },
  outboxMeta: { color: theme.textMuted, fontSize: 11 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buttonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  button: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: { color: theme.accent, fontSize: 12, fontWeight: '600' },
  note: { color: theme.ok, fontSize: 12, textAlign: 'center' },
});
