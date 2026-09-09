import type { TownProject } from '../data/development';
type Position = [number, number, number];
function Block({ at, size, color }: { at: Position; size: Position; color: string }) {
  return <mesh position={at} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.7} /></mesh>;
}
export function ProjectLandmark({ project, completed }: { project: TownProject; completed: boolean }) {
  const c = project.color;
  return <group position={[.98, .04, -.9]} scale={.86}>
    <mesh position={[0, .035, 0]} receiveShadow><cylinderGeometry args={[.7, .74, .09, 32]} /><meshStandardMaterial color="#e8dbb5" /></mesh>
    {!completed ? <group>
      <Block at={[0, .18, 0]} size={[.7, .24, .6]} color="#d0d6c0" />
      <Block at={[-.4, .6, 0]} size={[.05, 1.1, .05]} color="#d5a94e" />
      <Block at={[-.04, 1.13, 0]} size={[.9, .05, .05]} color="#d5a94e" />
      <Block at={[.35, .9, 0]} size={[.016, .42, .016]} color="#738274" />
      {[-.55, .55].map((x) => <Block key={x} at={[x, .17, .4]} size={[.05, .27, .05]} color="#c5a25d" />)}
      <Block at={[0, .24, .4]} size={[1.15, .06, .03]} color="#e5c777" />
    </group> : project.kind === 'park' ? <group>
      <mesh position={[0, .48, 0]}><torusGeometry args={[.37, .065, 8, 24, Math.PI]} /><meshStandardMaterial color="#d9a554" /></mesh>
      <mesh position={[0, .48, -.03]}><torusGeometry args={[.27, .06, 8, 24, Math.PI]} /><meshStandardMaterial color="#8dbb9d" /></mesh>
      <Block at={[0, .28, 0]} size={[.07, .5, .07]} color="#aa9c74" />
      <Block at={[-.3, .2, .35]} size={[.4, .08, .16]} color="#b98053" />
      {[-.45, .43].map((x) => <mesh key={x} position={[x, .3, -.26]} castShadow><sphereGeometry args={[.2, 12, 10]} /><meshStandardMaterial color="#7fa378" /></mesh>)}
    </group> : project.kind === 'camp' ? <group>
      <mesh position={[0, .35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[.56, .65, 4]} /><meshStandardMaterial color="#c89560" /></mesh>
      <Block at={[0, .2, .39]} size={[.2, .3, .03]} color="#675c45" />
      <mesh position={[.4, .15, .36]}><coneGeometry args={[.1, .22, 6]} /><meshStandardMaterial color="#d88143" emissive="#d88143" emissiveIntensity={.3} /></mesh>
    </group> : project.kind === 'lighthouse' ? <group>
      {[0,1,2,3].map((i) => <mesh key={i} position={[0, .18 + i * .21, 0]} castShadow><cylinderGeometry args={[.17 - i*.015, .19 - i*.015, .21, 16]} /><meshStandardMaterial color={i % 2 ? '#bd7860' : '#fff4da'} /></mesh>)}
      <mesh position={[0,.99,0]}><cylinderGeometry args={[.24,.24,.12,16]} /><meshStandardMaterial color="#7b9893" /></mesh>
      <mesh position={[0,1.09,0]}><coneGeometry args={[.27,.15,16]} /><meshStandardMaterial color="#537b78" /></mesh>
    </group> : <group>
      <Block at={[0,.28,0]} size={[.94,.45,.62]} color={project.kind === 'aquarium' ? '#85b4b3' : '#f5edd7'} />
      {project.kind === 'music' || project.kind === 'aquarium' ? <mesh position={[0,.51,0]} scale={[1,.6,.7]} castShadow><sphereGeometry args={[.52,20,12,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color={c} /></mesh> : <Block at={[0,.55,0]} size={[1.06,.12,.73]} color={c} />}
      {[-.3,0,.3].map((x) => <Block key={x} at={[x,.33,.318]} size={[.15,.18,.018]} color="#638c8b" />)}
      <Block at={[0,.17,.325]} size={[.17,.25,.03]} color="#bda478" />
      {project.kind === 'market' && [-.4,-.2,0,.2,.4].map((x,i) => <Block key={x} at={[x,.43,.43]} size={[.2,.08,.33]} color={i%2 ? '#fff2d9' : '#d79158'} />)}
      {project.kind === 'airport' && <group position={[.39,.7,-.2]}>
        <Block at={[0,0,0]} size={[.13,.8,.13]} color="#d5decc" /><Block at={[0,.35,0]} size={[.33,.2,.32]} color="#719caa" />
        <Block at={[-.35,.28,.25]} size={[.62,.05,.08]} color="#faf6e7" /><Block at={[-.35,.28,.25]} size={[.09,.05,.4]} color="#faf6e7" />
      </group>}
    </group>}
  </group>;
}
