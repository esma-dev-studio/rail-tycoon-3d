// ============================================================================
// 「+◯円」の浮き表示イベント — React の外に保持し、描画側が定期的に読む。
// 同じ町で短時間に連続した運賃はまとめて1つの表示にする。
// ============================================================================
export interface FareFloat {
  id: number;
  townId: string;
  x: number;
  z: number;
  amount: number;
  born: number; // performance.now()
}

export const fareFloats: FareFloat[] = [];
let seq = 0;

const MERGE_WINDOW_MS = 400;
export const FLOAT_LIFETIME_MS = 1500;

export function pushFareFloat(townId: string, x: number, z: number, amount: number): void {
  const now = performance.now();
  const recent = fareFloats.find((f) => f.townId === townId && now - f.born < MERGE_WINDOW_MS);
  if (recent) {
    recent.amount += amount;
    return;
  }
  fareFloats.push({ id: ++seq, townId, x, z, amount, born: now });
}

/** 寿命切れの表示を取り除く */
export function pruneFareFloats(): void {
  const now = performance.now();
  for (let i = fareFloats.length - 1; i >= 0; i--) {
    if (now - fareFloats[i].born > FLOAT_LIFETIME_MS) fareFloats.splice(i, 1);
  }
}
