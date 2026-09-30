/**
 * Item do feed. Só renderiza: não faz fetch, não conhece o cache, não sabe se
 * está online. Recebe um `FeedItem` já composto pelo domínio.
 */

import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeedItem } from '../domain';
import { theme } from './theme';

interface Props {
  item: FeedItem;
  onToggleLike: (postId: string) => void;
}

function PostCardComponent({ item, onToggleLike }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>@{item.author}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>

      {item.thumbUri !== null ? (
        // `expo-image` aqui é só o renderizador: o arquivo já está em disco, sob
        // o budget que nós controlamos.
        <Image
          source={{ uri: item.thumbUri }}
          style={styles.thumb}
          contentFit="cover"
          transition={120}
          cachePolicy="none"
        />
      ) : (
        // Placeholder gracioso: thumbnail evictado pelo LRU ou ainda não baixado.
        // Não é erro — o post continua legível.
        <View style={[styles.thumb, styles.placeholder]}>
          <Text style={styles.placeholderIcon}>▨</Text>
          <Text style={styles.placeholderText}>imagem fora do cache</Text>
        </View>
      )}

      <Text style={styles.caption}>{item.caption}</Text>

      <View style={styles.footer}>
        <Pressable
          onPress={() => onToggleLike(item.id)}
          hitSlop={8}
          style={styles.likeButton}
          accessibilityRole="button"
          accessibilityLabel={item.likedByMe ? 'Descurtir' : 'Curtir'}
        >
          <Text style={[styles.heart, item.likedByMe && styles.heartOn]}>
            {item.likedByMe ? '♥' : '♡'}
          </Text>
          <Text style={styles.likes}>{item.likesCount}</Text>
        </Pressable>

        {item.hasPendingWrite ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>pendente de envio</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const PostCard = memo(PostCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.space,
    paddingVertical: 10,
  },
  author: { color: theme.text, fontWeight: '600' },
  date: { color: theme.textMuted, fontSize: 12 },
  thumb: { width: '100%', aspectRatio: 1, backgroundColor: theme.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderIcon: { color: theme.border, fontSize: 44 },
  placeholderText: { color: theme.textMuted, fontSize: 12 },
  caption: { color: theme.text, paddingHorizontal: theme.space, paddingTop: 10, fontSize: 14 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.space,
    paddingVertical: 10,
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heart: { color: theme.textMuted, fontSize: 20 },
  heartOn: { color: theme.danger },
  likes: { color: theme.text, fontVariant: ['tabular-nums'] },
  badge: {
    marginLeft: 'auto',
    backgroundColor: theme.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: theme.warn, fontSize: 11 },
});
