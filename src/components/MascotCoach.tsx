import { MISSIONS } from '../data/missions';
import { useGameStore } from '../store/gameStore';

export function ConductorMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={`conductor-mark ${compact ? 'is-compact' : ''}`}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#173f66" />
          <stop offset="1" stopColor="#08253e" />
        </linearGradient>
        <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#28dfc2" />
          <stop offset="1" stopColor="#10a990" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="62" r="48" fill="#d9fbff" opacity=".35" />
      <path d="M24 99c6-21 19-31 36-31s30 10 36 31" fill="url(#coat)" />
      <path d="M49 73l11 13 11-13" fill="#fff" />
      <circle cx="60" cy="51" r="27" fill="#ffd9bb" />
      <path d="M37 47c2-19 13-28 27-28 12 0 22 7 25 22-14-3-30-1-52 6Z" fill="#3b271e" />
      <path d="M32 31c7-14 18-21 31-21 15 0 26 7 32 21H32Z" fill="url(#cap)" />
      <path d="M28 31h69c-3 8-12 10-34 10S31 39 28 31Z" fill="#0a2d4a" />
      <circle cx="63" cy="24" r="6" fill="#ffcc46" />
      <path d="m63 19 1.7 3.4 3.8.6-2.7 2.6.6 3.7-3.4-1.8-3.4 1.8.6-3.7-2.7-2.6 3.8-.6Z" fill="#fff4bd" />
      <circle cx="50" cy="52" r="2.8" fill="#22334b" />
      <circle cx="71" cy="52" r="2.8" fill="#22334b" />
      <path d="M51 61c5 5 13 5 18 0" fill="none" stroke="#d86f6f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="42" cy="59" r="4" fill="#ff9a9a" opacity=".45" />
      <circle cx="78" cy="59" r="4" fill="#ff9a9a" opacity=".45" />
      <path d="M52 89h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="96" r="3" fill="#ffd34d" />
    </svg>
  );
}

function coachMessage(
  missionIndex: number,
  buildMode: string,
  hasStart: boolean,
  hasEnd: boolean,
): { title: string; text: string } {
  if (buildMode === 'route') {
    if (!hasStart) return { title: 'まずは 1つめ！', text: 'すきな町の 名前を おしてね。' };
    if (!hasEnd) return { title: 'いいね！', text: 'つなぎたい もう1つの町を おそう。' };
    return { title: 'できあがりを かくにん！', text: 'お金を見て、オレンジのボタンを おそう。' };
  }
  const messages = [
    { title: 'てつくんから ヒント', text: '下の「新しいせんろ」から はじめよう！' },
    { title: 'もう うごいてるよ！', text: '電車の中には 3人。とうちゃくを 見てみよう。' },
    { title: '町へ プレゼント！', text: '「ごほうびの町」で すきな かざりを えらべるよ。' },
    { title: 'どこへ のばす？', text: 'まだ線路がない町を 1つ えらんでみよう。' },
    { title: '町が にぎやか！', text: '人を はこぶと、町の たてものが ふえていくよ。' },
    { title: 'あと ひといき！', text: 'スタンプがない町へ せんろを とどけよう。' },
  ];
  return messages[Math.min(missionIndex, messages.length - 1)] ?? {
    title: 'きみが しゃちょう！',
    text: 'ためたお金で、すきな町を つくってね。',
  };
}

export function MascotCoach() {
  const missionIndex = useGameStore((state) => state.missionIndex);
  const buildMode = useGameStore((state) => state.buildMode);
  const routeStartTown = useGameStore((state) => state.routeStartTown);
  const routeEndTown = useGameStore((state) => state.routeEndTown);
  const celebration = useGameStore((state) => state.celebration);

  if (celebration) return null;

  const message = coachMessage(
    Math.min(missionIndex, MISSIONS.length),
    buildMode,
    Boolean(routeStartTown),
    Boolean(routeEndTown),
  );

  return (
    <aside className="mascot-coach" aria-live="polite">
      <div className="mascot-coach__person">
        <ConductorMark compact />
        <span>てつくん</span>
      </div>
      <div className="mascot-coach__bubble">
        <b>{message.title}</b>
        <span>{message.text}</span>
      </div>
    </aside>
  );
}
