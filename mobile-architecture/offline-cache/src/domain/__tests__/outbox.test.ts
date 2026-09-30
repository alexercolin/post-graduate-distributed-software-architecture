import { describe, expect, it } from 'vitest';

import { RETRY_POLICY } from '../../config';
import {
  backoffDelayMs,
  isReadyToSend,
  partitionOrphans,
  recordFailure,
  selectSendable,
} from '../outbox';
import { deriveLikeState } from '../post';
import { iso, makeEntry, T0 } from './factories';

describe('backoff exponencial', () => {
  it('cresce por potência e respeita o teto', () => {
    expect(backoffDelayMs(0, RETRY_POLICY)).toBe(0);
    expect(backoffDelayMs(1, RETRY_POLICY)).toBe(2_000);
    expect(backoffDelayMs(2, RETRY_POLICY)).toBe(4_000);
    expect(backoffDelayMs(3, RETRY_POLICY)).toBe(8_000);
    expect(backoffDelayMs(50, RETRY_POLICY)).toBe(RETRY_POLICY.maxDelayMs);
  });
});

describe('isReadyToSend', () => {
  it('entrada nunca tentada vai imediatamente', () => {
    expect(isReadyToSend(makeEntry({ id: 'o1' }), T0, RETRY_POLICY)).toBe(true);
  });

  it('entrada em backoff espera o intervalo vencer', () => {
    const entry = makeEntry({ id: 'o1', attempts: 2, lastAttemptAt: T0 });
    expect(isReadyToSend(entry, T0 + 3_999, RETRY_POLICY)).toBe(false);
    expect(isReadyToSend(entry, T0 + 4_000, RETRY_POLICY)).toBe(true);
  });

  it('entrada morta nunca mais é enviada', () => {
    const entry = makeEntry({ id: 'o1', status: 'dead', attempts: 5, lastAttemptAt: T0 });
    expect(isReadyToSend(entry, T0 + 10 * 60 * 1000, RETRY_POLICY)).toBe(false);
  });
});

describe('selectSendable', () => {
  it('ordena por criação — like antes de unlike do mesmo post', () => {
    const entries = [
      makeEntry({ id: 'o2', kind: 'unlike', createdAt: iso(T0 + 2000) }),
      makeEntry({ id: 'o1', kind: 'like', createdAt: iso(T0 + 1000) }),
    ];
    expect(selectSendable(entries, T0 + 5000, RETRY_POLICY).map((entry) => entry.id)).toEqual([
      'o1',
      'o2',
    ]);
  });

  it('exclui as que ainda estão em backoff', () => {
    const entries = [
      makeEntry({ id: 'o1' }),
      makeEntry({ id: 'o2', attempts: 3, lastAttemptAt: T0 }),
    ];
    expect(selectSendable(entries, T0 + 1_000, RETRY_POLICY).map((entry) => entry.id)).toEqual([
      'o1',
    ]);
  });
});

describe('recordFailure', () => {
  it('incrementa tentativas e guarda o erro', () => {
    const failed = recordFailure(makeEntry({ id: 'o1' }), 'timeout', T0, RETRY_POLICY);
    expect(failed).toMatchObject({ attempts: 1, lastError: 'timeout', status: 'pending' });
    expect(failed.lastAttemptAt).toBe(T0);
  });

  it('mata a entrada ao atingir o teto de tentativas', () => {
    const entry = makeEntry({ id: 'o1', attempts: RETRY_POLICY.maxAttempts - 1 });
    const failed = recordFailure(entry, 'HTTP 500', T0, RETRY_POLICY);
    expect(failed.status).toBe('dead');
    expect(failed.attempts).toBe(RETRY_POLICY.maxAttempts);
  });

  it('entrada morta some do estado visível — o coração volta ao do servidor', () => {
    const entry = makeEntry({ id: 'o1', kind: 'like', attempts: RETRY_POLICY.maxAttempts - 1 });
    const before = deriveLikeState({ likesCount: 7, likedByMe: false }, [entry]);
    const after = deriveLikeState(
      { likesCount: 7, likedByMe: false },
      [recordFailure(entry, 'HTTP 500', T0, RETRY_POLICY)],
    );

    expect(before).toMatchObject({ likesCount: 8, likedByMe: true });
    expect(after).toMatchObject({ likesCount: 7, likedByMe: false, pendingCount: 0 });
  });
});

describe('partitionOrphans', () => {
  it('separa curtida pendente de post que não existe mais localmente', () => {
    const entries = [
      makeEntry({ id: 'o1', entityId: 'p1' }),
      makeEntry({ id: 'o2', entityId: 'apagado' }),
    ];
    const { keep, orphans } = partitionOrphans(entries, new Set(['p1']));

    expect(keep.map((entry) => entry.id)).toEqual(['o1']);
    expect(orphans.map((entry) => entry.id)).toEqual(['o2']);
  });
});
