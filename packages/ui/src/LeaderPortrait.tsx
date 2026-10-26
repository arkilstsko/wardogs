import portraits from '../../assets/src/portrait-manifest.json';
import {Icon} from './Icon';
import {assetUrl} from '../../assets/src/asset-url';

/** Individual original artwork cells. Rights review: docs/production/portrait-provenance.json. */
export function LeaderPortrait({leaderId,name,className=''}:{leaderId?:string;name:string;className?:string}) {
 const portrait=leaderId?portraits[leaderId as keyof typeof portraits]:undefined;
 if(!portrait)return <div className={`portrait legacy-portrait ${className}`} role="img" aria-label={`Legacy leader token: ${name}`}><Icon name="leader" size={80}/></div>;
 return <div className={`portrait illustrated-portrait ${className}`} role="img" aria-label={`Illustration of fictional leader ${name}`}
  style={{backgroundImage:`url(${assetUrl(`/art/portraits/${portrait.sheet}.png`)})`,backgroundPosition:`${portrait.column*50}% ${portrait.row*50}%`}}>
  <span>FICTIONAL LEADER</span>
 </div>;
}
