import {useState} from 'react';
import {equipmentCards} from '../../shared/src/equipment-cards';
import type {Good} from '../../game-core/src/content';
import type {Locale} from '../../shared/src/i18n';
import {Icon} from './Icon';

export function EquipmentInspector({good,locale,political,price,available,owned,select,close,market}:{
 good:Good;locale:Locale;political:boolean;price:number;available:number;owned:number;
 select:()=>void;close:()=>void;market:()=>void;
}){
 const [flipped,setFlipped]=useState(false);const card=equipmentCards[good];
 const title=political?card.name[locale]:good==='medical'?'Medical supplies':good==='vehicles'?'Vehicles':card.name[locale];
 return <div className="equipment-inspector">
  <section><div className={`inspection-card ${flipped?'is-flipped':''}`}>
   <div className="inspection-card-inner">
    <article className={`inspection-front ${political?'political-equipment':''}`} aria-hidden={flipped}>
     <span className="eyebrow">EQUIPMENT · {good==='medical'?'EQ-01':good==='communications'?'EQ-02':'EQ-03'}</span>
     <div className={`supply-art illustrated ${good}`} role="img" aria-label={political?card.description[locale]:`Illustrated ${title} cargo`}/>
     <h3>{title}</h3><p>1 CARGO TOKEN</p>
     <div className="inspection-seal"><Icon name={political&&good==='medical'?'supply':good}/><span>RESERVABLE<br/>TRADE CARGO</span></div>
    </article>
    <article className="inspection-back" aria-hidden={!flipped}><Icon name="supply" size={64}/><h3>House inventory</h3><p>Face down conceals equipment type. Public cargo count stays visible.</p><p>Flipping this inspection card changes presentation only.</p></article>
   </div>
  </div><div className="modal-actions"><button onClick={()=>setFlipped(v=>!v)} aria-pressed={flipped}>Flip card</button><button onClick={close}>Return to hand</button></div></section>
  <section className="inspection-rules"><span className="eyebrow">CARGO DOSSIER</span><h3>{title}</h3>
   <p>{available} unreserved · {owned-available} reserved · {owned} owned</p>
   <div className="modal-actions"><button className="primary" disabled={available===0} onClick={select}>Select for contract</button><button onClick={market}>Open market</button></div>
   <dl><dt>Acquire / Player Actions</dt><dd>Pay the current market price ({price}M), spend 1 action, take 1 cargo, then increase its price by 1 (maximum 8).</dd>
    <dt>Sell / Player Actions</dt><dd>Spend 1 action and return 1 unreserved cargo to stock. Receive price −1 ({Math.max(0,price-1)}M); price decreases by 1 (minimum 1).</dd>
    <dt>Pledge / Negotiation</dt><dd>Match the contract’s equipment. A submitted bid or fully signed agreement reserves all pledged cargo and logistics. A draft reserves nothing.</dd>
    <dt>Deliver / Player Actions</dt><dd>An awarded contract consumes its reserved cargo when delivered. Payment and shared liabilities follow the signed terms.</dd>
   </dl><p className="muted">Storage: 6 cargo, or 8 for Redwood. Reserved cargo cannot be sold or pledged again. Inspecting and flipping spend no actions.</p>
  </section>
 </div>;
}
