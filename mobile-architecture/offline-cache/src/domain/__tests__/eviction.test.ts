import { describe, expect, it } from 'vitest';

import { CACHE_BUDGET_BYTES } from '../../config';
import { planEviction, toMegabytes, totalBytes, type CacheEntry } from '../eviction';

const MB = 1024 * 1024;

const entry = (key: string, sizeMb: number, lastAccessAt: number): CacheEntry => ({
  key,
  sizeBytes: sizeMb * MB,
  lastAccessAt,
});

describe('planEviction', () => {
  it('não remove nada quando cabe no budget', () => {
    const entries = [entry('a', 10, 1), entry('b', 10, 2)];
    const plan = planEviction({ entries, budgetBytes: 100 * MB });

    expect(plan.remove).toEqual([]);
    expect(plan.fitsBudget).toBe(true);
    expect(plan.bytesAfter).toBe(plan.bytesBefore);
  });

  it('remove os menos recentemente usados primeiro, e só o necessário', () => {
    const entries = [entry('velho', 30, 1), entry('medio', 30, 5), entry('novo', 30, 9)];
    const plan = planEviction({ entries, budgetBytes: 70 * MB });

    expect(plan.remove).toEqual(['velho']);
    expect(toMegabytes(plan.bytesAfter)).toBe(60);
    expect(plan.fitsBudget).toBe(true);
  });

  it('reserva espaço para o download que ainda vai acontecer', () => {
    const entries = [entry('velho', 30, 1), entry('novo', 30, 9)];
    const plan = planEviction({ entries, budgetBytes: 70 * MB, reserveBytes: 20 * MB });

    expect(plan.remove).toEqual(['velho']);
    expect(toMegabytes(plan.bytesAfter)).toBe(30);
  });

  it('não evicta o que está protegido, mesmo sendo o mais antigo', () => {
    const entries = [entry('visivel', 30, 1), entry('outro', 30, 9)];
    const plan = planEviction({
      entries,
      budgetBytes: 40 * MB,
      protectedKeys: new Set(['visivel']),
    });

    expect(plan.remove).toEqual(['outro']);
  });

  it('budget menor que um único item: remove tudo e admite que não coube', () => {
    const entries = [entry('unico', 10, 1)];
    const plan = planEviction({ entries, budgetBytes: 1 * MB });

    expect(plan.remove).toEqual(['unico']);
    expect(plan.bytesAfter).toBe(0);
    // 0 <= 1 MB, então cabe depois de esvaziar.
    expect(plan.fitsBudget).toBe(true);
  });

  it('budget zero com item protegido: reporta que o teto não é atingível', () => {
    const entries = [entry('protegido', 10, 1)];
    const plan = planEviction({
      entries,
      budgetBytes: 0,
      protectedKeys: new Set(['protegido']),
    });

    expect(plan.remove).toEqual([]);
    expect(plan.fitsBudget).toBe(false);
  });

  it('cache vazio é um no-op', () => {
    const plan = planEviction({ entries: [], budgetBytes: 0 });
    expect(plan).toEqual({ remove: [], bytesBefore: 0, bytesAfter: 0, fitsBudget: true });
  });

  it('desempate por chave torna o plano determinístico', () => {
    const entries = [entry('b', 30, 1), entry('a', 30, 1), entry('c', 30, 9)];
    const plan = planEviction({ entries, budgetBytes: 40 * MB });

    expect(plan.remove).toEqual(['a', 'b']);
  });

  it('mantém o uso sob o teto de 200 MB do RNF', () => {
    const entries = Array.from({ length: 40 }, (_unused, index) =>
      entry(`p${index}`, 8, index),
    );
    const plan = planEviction({ entries, budgetBytes: CACHE_BUDGET_BYTES });

    expect(toMegabytes(totalBytes(entries))).toBe(320);
    expect(plan.bytesAfter).toBeLessThanOrEqual(CACHE_BUDGET_BYTES);
    expect(plan.remove).toContain('p0');
    expect(plan.remove).not.toContain('p39');
  });
});
