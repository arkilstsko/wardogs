/** The offline export supplies an explicit local image map; normal builds use same-origin files. */
export function assetUrl(path:string){
 const local=(globalThis as typeof globalThis&{__MOW_ART_URLS__?:Record<string,string>}).__MOW_ART_URLS__;
 return local?.[path]??path;
}
