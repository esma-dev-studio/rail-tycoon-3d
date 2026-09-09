// ============================================================================
// 「+◯円」の浮き表示 — お客さんが目的地に着いた町の上にふわっと出る。
// 出現/消滅は revision(約5Hz)で追従し、動き自体は CSS アニメーションで滑らかに。
// ============================================================================
import { Html } from '@react-three/drei';
import { fareFloats, pruneFareFloats } from '../sim/fareFloats';
import { useGameStore } from '../store/gameStore';

export function FareFloats() {
  useGameStore((s) => s.revision);
  pruneFareFloats();

  return (
    <group>
      {fareFloats.map((f) => (
        <Html
          key={f.id}
          position={[f.x, 1.15, f.z]}
          center
          zIndexRange={[14, 0]}
          wrapperClass="html-pass-through"
        >
          <div className="fare-float">+{f.amount.toLocaleString()}円</div>
        </Html>
      ))}
    </group>
  );
}
