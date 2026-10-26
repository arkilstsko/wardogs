export const GOODS = ['medical','communications','vehicles'] as const;
export type Good = typeof GOODS[number];
export const PHASES = ['world','income','negotiation','actions','delivery','scoring'] as const;
export type Phase = typeof PHASES[number];
export const FIRMS = [
 {id:'meridian',name:'Meridian & Co.',motto:'Every route has a price.',bonus:'logistics',color:'#C5A56A'},
 {id:'northstar',name:'Northstar Union',motto:'Trust travels further.',bonus:'reputation',color:'#6EACBA'},
 {id:'vesper',name:'Vesper Exchange',motto:'Opportunity after dusk.',bonus:'cash',color:'#AD91BC'},
 {id:'atlas',name:'Atlas Cooperative',motto:'A shared stake in tomorrow.',bonus:'contact',color:'#87AD8A'},
 {id:'redwood',name:'Redwood Trading',motto:'Built to weather the storm.',bonus:'storage',color:'#DB9278'}
] as const;
export const COUNTRIES = [
 ['DK','Denmark','Danmark','prime minister','Astrid Vester',12,56],
 ['GB','United Kingdom','Storbritannien','prime minister','Eleanor Vale',-2,54],
 ['FR','France','Frankrig','president','Camille Delorme',2,47],
 ['DE','Germany','Tyskland','chancellor','Mara Feld',10,51],
 ['PL','Poland','Polen','president','Irena Wilk',20,52],
 ['ES','Spain','Spanien','prime minister','Inés Ladera',-4,40],
 ['IT','Italy','Italien','prime minister','Luca Bellori',12,43],
 ['TR','Türkiye','Tyrkiet','president','Deniz Arven',35,39],
 ['EG','Egypt','Egypten','president','Nadia Elwan',30,27],
 ['NG','Nigeria','Nigeria','president','Ada Okorie',8,9],
 ['IN','India','Indien','prime minister','Kavya Sen',79,23],
 ['BR','Brazil','Brasilien','president','Clara Monteiro',-50,-12],
 ['US','United States','USA','president','Morgan Hale',-99,39],
 ['JP','Japan','Japan','prime minister','Hana Mizuno',138,37],
 ['ZA','South Africa','Sydafrika','president','Lindiwe Maseko',25,-29]
] as const;
export const EVENTS = [
 {id:'open-ports',name:'Open ports',da:'Åbne havne',text:'New shipping accords ease the pressure. All countries gain 1 stability.',effect:'calm'},
 {id:'supply-shock',name:'Supply shock',da:'Forsyningschok',text:'Communications prices rise by 1. Finite stock remains in play.',effect:'price'},
 {id:'public-scrutiny',name:'Public scrutiny',da:'Offentlig kontrol',text:'Each house with investigation 3 or higher loses 1 reputation.',effect:'scrutiny'},
 {id:'relief-window',name:'Relief window',da:'Hjælpevindue',text:'All countries gain 1 demand. New tenders are open to every house.',effect:'demand'},
 {id:'quiet-diplomacy',name:'Quiet diplomacy',da:'Stille diplomati',text:'A pause in tensions. The least stable country gains 2 stability.',effect:'relief'},
 {id:'credit-tightens',name:'Credit tightens',da:'Kreditstramning',text:'Houses carrying debt pay 1 additional unit in upkeep.',effect:'credit'}
] as const;
export const ACTION_RULES = {
 acquire:{phase:'actions',cost:'market price',target:'good',cap: 'storage 6; Redwood 8',visibility:'public'},
 sell:{phase:'actions',cost:'one unreserved supply',target:'good',cap:'buyback at price minus 1, minimum 0',visibility:'public'},
 bid:{phase:'negotiation',cost:'one action and 1 escrow',target:'open tender',cap:'one per house per tender; full resources reserved',visibility:'sealed until award'},
 influence:{phase:'actions',cost:'2 money',target:'country',cap:'relationship 3',visibility:'public'},
 network:{phase:'actions',cost:'2 money',target:'self',cap:'3 contacts / 3 logistics',visibility:'public'},
 transport:{phase:'actions',cost:'one action; consumes reserved cargo',target:'awarded contract',cap:'once per contract',visibility:'public'},
 audit:{phase:'actions',cost:'1 money',target:'self',cap:'reduce investigation by 2; minimum 0',visibility:'public'},
 unrest:{phase:'actions',cost:'3 money and +2 investigation; -1 reputation',target:'country',cap:'stability minus 2; demand plus 1; sanctions at stability 1',visibility:'public'},
 consortium:{phase:'negotiation',cost:'proposer action and 1 escrow on final acceptance',target:'open tender',cap:'2–5 explicit signatures; revenue and liability each total 100',visibility:'participants; signed public'},
 refinance:{phase:'actions',cost:'one action',target:'self',cap:'borrow 3 with debt capped at 9, or repay 3',visibility:'public'},
 pass:{phase:'actions',cost:'one action',target:'self',cap:'no effect',visibility:'public'}
} as const;
export const CARD_TYPES = ['Country','Leader','Organization','Supply','Logistics','Contact','Contract','World Event','Unrest','Investigation','Objective','Alliance/Agreement'] as const;
export const CARD_CATALOG = CARD_TYPES.flatMap((type,i)=>Array.from({length:type==='Leader'?30:type==='Country'?15:type==='Supply'?36:12},(_,n)=>({
 id:`${type.toLowerCase().replace(/\W/g,'')}-${n+1}`,type,timing:type==='World Event'?'world':type==='Objective'?'scoring':'action',effectKey:`${type}.effect.${n%3}`,localizationKey:`cards.${i}.${n}`,icon:type.toLowerCase().split('/')[0],artProvenance:'Original vector treatment; no external portrait',dimensions:{widthMm:63,heightMm:88,bleedMm:3,safeMm:5},printFriendly:true
})));
