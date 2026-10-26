import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const root='dist';let html=readFileSync(root+'/index.html','utf8');const assets=readdirSync(root+'/assets');let css=readFileSync(root+'/assets/'+assets.find(p=>p.endsWith('.css')),'utf8');
css=css.replace(/url\((['"]?)(\/(?:fonts|art)\/[^)'"\s]+)\1\)/g,(_all,_quote,path)=>{const mime=path.endsWith('.png')?'image/png':'font/ttf';return `url(data:${mime};base64,${readFileSync(root+path).toString('base64')})`;});
const portraits=Object.fromEntries(readdirSync(root+'/art/portraits').filter(n=>n.endsWith('.png')).map(name=>[`/art/portraits/${name}`,`data:image/png;base64,${readFileSync(root+'/art/portraits/'+name).toString('base64')}`]));
const js=('globalThis.__MOW_ART_URLS__='+JSON.stringify(portraits)+';\n'+readFileSync(root+'/assets/'+assets.find(p=>p.endsWith('.js')),'utf8')).replace(/<\/script/gi,'<\\/script');
html=html.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/,'').replace(/<link[^>]+href="[^"]+\.css"[^>]*>/,'');html=html.replace('</head>',()=>'<style>'+css+'</style></head>').replace('</body>',()=>'<script type="module">'+js+'</script></body>');
writeFileSync('/workspace/Merchants-of-War-play.html',html);console.log({path:'/workspace/Merchants-of-War-play.html',bytes:Buffer.byteLength(html),embeddedPortraitSheets:Object.keys(portraits).length,externalCssFontsOrArt:/url\(['"]?\/(fonts|art)/.test(css)});
