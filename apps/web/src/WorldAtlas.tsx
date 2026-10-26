import {useState} from 'react';
import {COUNTRIES,type Country} from '../../../packages/game-core/src';
import map from '../../../packages/assets/src/map.json';

export const project=(lon:number,lat:number)=>[(lon+180)*3,(85-lat)*3];
function path(geometry:typeof map[number]['geometry']){
 const rings=geometry.type==='Polygon'?geometry.coordinates:geometry.coordinates.flat();
 return (rings as number[][][]).map(ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${project(x,y).map(n=>n.toFixed(1)).join(',')}`).join('')+'Z').join('');
}
export const mapPaths=map.filter(f=>f.name!=='Antarctica').map(f=>({name:f.name,d:path(f.geometry)}));
const regions={World:[0,0,1080,510],Europe:[475,50,200,120],Africa:[460,180,230,200],Asia:[670,85,360,220],Americas:[100,75,390,380]} as const;
type Region=keyof typeof regions;
export function WorldAtlas({countries,selected,inspect}:{countries:Country[];selected:string;inspect:(id:string)=>void}){
 const [region,setRegion]=useState<Region>('World');const view=regions[region];const scale=view[2]/1080;
 return <div className="atlas-surface"><nav className="atlas-controls" aria-label="Map region">{Object.keys(regions).map(name=><button key={name} aria-pressed={region===name} onClick={()=>setRegion(name as Region)}>{name}</button>)}</nav>
  <div className="map-wrapper"><svg className="world-map" viewBox={view.join(' ')} role="group" aria-label="Select a country">
   <defs><pattern id="atlas-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="currentColor" strokeOpacity=".06"/></pattern></defs>
   <rect width="1080" height="510" fill="url(#atlas-grid)"/>
   {mapPaths.map(f=><path className="land" d={f.d} key={f.name}/>)}
   <path className="trade-route" d="M243 138 Q360 -20 576 87 Q657 124 777 186 Q850 260 948 144 M576 87 Q602 260 390 325"/>
   {countries.map(c=>{const info=COUNTRIES.find(x=>x[0]===c.id)!;const [x,y]=project(info[5],info[6]);const visible=x>=view[0]&&x<=view[0]+view[2]&&y>=view[1]&&y<=view[1]+view[3];return <g key={c.id} role="button" tabIndex={visible?0:-1} aria-hidden={!visible} aria-label={`${c.name}, stability ${c.stability}, demand ${c.demand}${c.sanctions?', sanctioned':''}`} className={`country-target ${selected===c.id?'chosen':''} ${c.stability<3?'fragile':''}`} onClick={()=>inspect(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(c.id);}}}>
    <circle cx={x} cy={y} r={18*scale} className="target-hit"/><circle cx={x} cy={y} r={7*scale} style={{strokeWidth:2*scale}}/>
    <text x={x+12*scale} y={y+4*scale} style={{fontSize:12*scale,strokeWidth:3*scale}}>{c.id}</text>
    {c.sanctions&&<text className="sanction-label" x={x-5*scale} y={y-13*scale} style={{fontSize:14*scale}}>!</text>}
   </g>;})}
  </svg></div>
  <label className="atlas-country-select">Country dossier<select aria-label="Country dossier" value={selected} onChange={e=>inspect(e.target.value)}>{countries.map(c=><option value={c.id} key={c.id}>{c.name} · stability {c.stability}/6</option>)}</select></label>
 </div>;
}
