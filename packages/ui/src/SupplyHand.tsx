import {useState} from 'react';
import {useDraggable} from '@dnd-kit/core';
import {GOODS,type Good} from '../../game-core/src/content';
import {Icon} from './Icon';

function CargoCard({good,index,title,political,selected,reserved,inspect,total=1}:{
 good:Good;index:number;title:string;political:boolean;selected:boolean;reserved:boolean;inspect:()=>void;total?:number;
}){
 const {attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:`${good}-${index}`,data:{good},disabled:reserved});
 return <div className="hand-card-slot"><button ref={setNodeRef} {...attributes} {...listeners} onClick={inspect}
  className={`supply-card ${political?'political-equipment':''} ${good} ${selected?'selected':''} ${isDragging?'dragging':''} ${reserved?'reserved':''}`}
  style={{transform:transform?`translate3d(${transform.x}px,${transform.y}px,0) rotate(3deg)`:undefined}}
  aria-pressed={selected} aria-label={`${title}, ${reserved?'reserved':'available'} cargo ${index+1}. Enter to inspect; Space to pick up.`}>
  <span className="card-kicker">{reserved?'RESERVED':'EQUIPMENT'} / {String(index+1).padStart(2,'0')}</span>
  <div className={`supply-art illustrated ${good}`}><Icon name={political&&good==='medical'?'supply':good} size={24}/></div>
  <strong>{title}</strong><span className="card-line">ONE CARGO TOKEN</span>{total>1&&<span className="stack-count" aria-label={`${total} cards in stack`}>{total}</span>}
 </button></div>;
}
export function SupplyHand({inventory,free,political,selectedId,label,inspect,contracts}:{
 inventory:Record<Good,number>;free:Record<Good,number>;political:boolean;selectedId:string|null;
 label:(good:Good)=>string;inspect:(good:Good,id:string)=>void;contracts:()=>void;
}){
 const [stacked,setStacked]=useState(false);
 const cards=GOODS.flatMap(g=>Array.from({length:inventory[g]},(_,index)=>({good:g,index,reserved:index>=free[g]})));
 const shown=stacked?cards.filter((c,i)=>cards.findIndex(x=>x.good===c.good&&x.reserved===c.reserved)===i):cards;
 return <><div className="hand-controls"><button onClick={()=>setStacked(v=>!v)} aria-pressed={stacked}>{stacked?'Fan cards':'Stack by equipment'}</button><span>Enter: inspect · Space: pick up · Esc: return</span></div>
  <div className={`hand ${stacked?'stacked-hand':'fanned-hand'}`} aria-label="Your equipment hand">
   {shown.map(c=><CargoCard key={`${c.good}-${c.index}`} {...c} title={label(c.good)} political={political} selected={selectedId===`${c.good}-${c.index}`} total={stacked?cards.filter(x=>x.good===c.good&&x.reserved===c.reserved).length:1} inspect={()=>c.reserved?contracts():inspect(c.good,`${c.good}-${c.index}`)}/>)}
   {cards.length===0&&<p className="empty">Your hand is empty. Acquire cargo from the finite market during Player Actions.</p>}
  </div>
 </>;
}
