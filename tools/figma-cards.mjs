import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('packages/ui/src/Icon.tsx','utf8');const match=source.match(/const paths:Record<string,string>=({.*?});/s);const icons=Function(`return (${match[1]})`)();
const code=String.raw`
const ids=[];const page=figma.root.children.find(p=>p.name==='03_Cards_All_Types');await figma.setCurrentPageAsync(page);
await Promise.all([{family:'Inter',style:'Regular'},{family:'Inter',style:'Semi Bold'},{family:'Barlow Condensed',style:'Bold'},{family:'Source Serif 4',style:'Regular'}].map(f=>figma.loadFontAsync(f)));
const vars=Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v=>[v.name,v]));
function fill(node,name){node.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',vars[name])];}
function txt(parent,str,size=12,font='Inter',style='Regular',color='ink'){const t=figma.createText();ids.push(t.id);t.fontName={family:font,style};t.characters=str;t.fontSize=size;t.lineHeight={unit:'PERCENT',value:140};fill(t,color);parent.appendChild(t);t.textAutoResize='HEIGHT';t.resize(parent.width-32,20);return t;}
const types=['Country','Leader','Organization','Supply','Logistics','Contact','Contract','World Event','Unrest','Investigation','Objective','Alliance/Agreement'];
const paths=${JSON.stringify(icons)};const exampleIcons=['country','leader','government','medical','logistics','diplomacy','contract','government','unrest','investigation','reputation','coalition'];const sets=[];
for(let i=0;i<types.length;i++){
 const variants=[];
 for(const face of ['Front','Back','Print']){
 const c=figma.createComponent();ids.push(c.id);c.name='Face='+face;c.resize(189,264);c.layoutMode='VERTICAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.paddingTop=16;c.paddingBottom=16;c.paddingLeft=16;c.paddingRight=16;c.itemSpacing=8;fill(c,face==='Back'?'charcoal':'paper');for(const prop of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])c.setBoundVariable(prop,vars['radius/6']);c.description='Poker card '+types[i]+'; trim63x88mm, bleed3mm, safe5mm. Experimental template. SVG baseline189x264. Editable text/vector. Export assets need printer dielines.';
 const color=face==='Back'?'parchment':'ink';txt(c,'MW / '+types[i].toUpperCase(),9,'Inter','Semi Bold',color);
 const svg=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="'+(face==='Back'?'#C5A56A':'#49352C')+'" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[exampleIcons[i]]+'"/></svg>');c.appendChild(svg);ids.push(svg.id,...svg.findAll().map(n=>n.id));
 txt(c,face==='Back'?'MERCHANTS OF WAR':types[i],22,'Barlow Condensed','Bold',color);
 txt(c,face==='Back'?'Every deal has consequences.':types[i]==='Contract'?'Regional supply accord':types[i]==='Leader'?'Astrid Vester':types[i]==='Supply'?'Medical cargo':'Field office / '+String(i+1).padStart(2,'0'),13,'Source Serif 4','Regular',color);
 txt(c,face==='Back'?'Experimental tabletop edition':types[i]==='Contract'?'2 medical · 1 logistics\nPayout 8M · deadline R2\nFailure3M · prestige2':types[i]==='Leader'?'Fictional prime minister\nSuccession: relations −1\nShared baseline traits':types[i]==='Unrest'?'Pay3M · stability−2\nDemand+1 · investigation+2\nReputation−1':'Timing: '+(i===7?'World phase':'Player action')+'\nSee experimental rulebook.',11,'Inter','Regular',color);
 c.exportSettings=[{format:'SVG',suffix:'-'+face.toLowerCase()}];variants.push(c);
 }
 const set=figma.combineAsVariants(variants,page);ids.push(set.id);set.name='Card / '+types[i];set.description='Source: packages/game-core/src/content.ts. Front / back / print variants. Card effects not fully authored for every proposed deck.';set.x=120+(i%3)*690;set.y=120+Math.floor(i/3)*340;variants.forEach((c,j)=>{c.x=16+j*205;c.y=32;});set.resize(647,312);sets.push({id:set.id,name:set.name,variants:variants.map(c=>c.id)});
}
const buttons=[];for(const state of ['Default','Hover','Disabled','Focus']){const c=figma.createComponent();ids.push(c.id);c.name='State='+state;c.resize(220,48);c.layoutMode='HORIZONTAL';c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';fill(c,state==='Hover'?'brassHover':'brass');c.cornerRadius=6;if(state==='Disabled')c.opacity=.4;if(state==='Focus'){c.strokes=[{type:'SOLID',color:{r:.9,g:.8,b:.6}}];c.strokeWeight=3;}txt(c,'Seal offers',14,'Inter','Semi Bold');buttons.push(c);}const buttonSet=figma.combineAsVariants(buttons,page);ids.push(buttonSet.id);buttonSet.name='Button / Primary';buttonSet.x=2250;buttonSet.y=120;buttons.forEach((c,i)=>{c.x=16;c.y=32+i*64;});buttonSet.resize(252,300);
return {createdNodeIds:ids,cardSets:sets,buttonSet:buttonSet.id,componentCount:40,imageNodes:0};
`;
writeFileSync('/tmp/mw-figma-cards.js',code);
