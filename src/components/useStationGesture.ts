import { useRef, type PointerEvent, type MouseEvent } from 'react';
import { useGameStore } from '../store/gameStore';

/** A tap selects a station; one-finger drawing previews a route, never purchases it. */
export function useStationGesture(id: string) {
  const gesture=useRef<{x:number;y:number;moved:boolean;start:string|null;end:string|null}|null>(null);
  const suppress=useRef(false);
  return {
    onPointerDown:(e:PointerEvent<HTMLButtonElement>)=>{
      e.stopPropagation();
      if(!e.isPrimary||useGameStore.getState().buildMode!=='route')return;
      const s=useGameStore.getState();
      suppress.current=false;
      gesture.current={x:e.clientX,y:e.clientY,moved:false,start:s.routeStartTown,end:s.routeEndTown};
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove:(e:PointerEvent<HTMLButtonElement>)=>{
      const g=gesture.current;if(!g)return;
      if(Math.hypot(e.clientX-g.x,e.clientY-g.y)<12&&!g.moved)return;
      g.moved=true;suppress.current=true;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-town-id]')?.dataset.townId;
      const valid=useGameStore.getState().towns.some(t=>t.id===target);
      useGameStore.setState({routeStartTown:id,routeEndTown:target!==id&&valid?target!:null});
    },
    onPointerUp:(e:PointerEvent<HTMLButtonElement>)=>{
      const g=gesture.current;
      if(g?.moved&&!useGameStore.getState().routeEndTown)useGameStore.setState({routeStartTown:g.start,routeEndTown:g.end});
      gesture.current=null;
      if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onPointerCancel:()=>{const g=gesture.current;if(g?.moved)useGameStore.setState({routeStartTown:g.start,routeEndTown:g.end});gesture.current=null;suppress.current=false;},
    onClick:(e:MouseEvent<HTMLButtonElement>)=>{e.stopPropagation();if(suppress.current){suppress.current=false;return;}useGameStore.getState().townClick(id);},
  };
}
