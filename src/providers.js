import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const missing='non fournie';
export const keys={pexels:'PEXELS_API_KEY',unsplash:'UNSPLASH_ACCESS_KEY',pixabay:'PIXABAY_API_KEY'};
export const policies={
 pexels:{name:'Pexels License',url:'https://www.pexels.com/license/',terms:'https://www.pexels.com/terms-of-service/',api:'https://www.pexels.com/api/documentation/',attribution:'Lien visible vers Pexels ; crédit du photographe lorsque possible.',rules:'Ne pas reproduire la banque, ne pas revendre les images sans modification ; respecter les droits de tiers.'},
 unsplash:{name:'Unsplash License',url:'https://unsplash.com/license',terms:'https://unsplash.com/api-terms',api:'https://unsplash.com/documentation',attribution:'Crédit obligatoire du photographe et d’Unsplash avec liens et utm_source=banques-images&utm_medium=referral.',rules:'Utiliser les URL images fournies par l’API (hotlinking). Signaler chaque sélection pour usage via download_location. Hébergement local non proposé par ce serveur.'},
 pixabay:{name:'Pixabay Content License',url:'https://pixabay.com/service/license-summary/',terms:'https://pixabay.com/service/terms/',api:'https://pixabay.com/api/docs/',attribution:'Licence générale : attribution non obligatoire ; afficher la provenance Pixabay dans la sélection.',rules:'Cache API de 24 heures ; aperçus distants temporaires ; téléchargement pour usage permanent ; téléchargements massifs interdits.'}
};
export function sanitize(value){
 if(typeof value==='string'){
  for(const k of Object.values(keys)) if(process.env[k]) value=value.split(process.env[k]).join('[MASQUÉ]');
  return value.replace(/([?&](?:key|api_key|access_key|client_id|token)=)[^&#\s]*/gi,'$1[MASQUÉ]');
 }
 if(Array.isArray(value))return value.map(sanitize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>! /^(authorization|api_key|access_key|client_id|token|key)$/i.test(k)).map(([k,v])=>[k,sanitize(v)]));
 return value;
}
export function attributionUrl(url){if(!url)return missing; const u=new URL(url);u.searchParams.set('utm_source','banques-images');u.searchParams.set('utm_medium','referral');return u.href;}
export function normalize(bank,p){
 const u=bank==='unsplash';const x=bank==='pixabay';
 const source=u?p.links?.html:x?p.pageURL:p.url;
 const profile=u?p.user?.links?.html:x?(p.user&&p.user_id?`https://pixabay.com/users/${encodeURIComponent(p.user)}-${p.user_id}/`:null):p.photographer_url;
 const image=u?p.urls?.regular:x?(p.largeImageURL||p.webformatURL):p.src?.original;
 if(!p.id||! /^[a-zA-Z0-9_-]{1,100}$/.test(String(p.id))||!image||!source)throw new Error('Réponse image incomplète (identifiant, source ou URL absent).');
 return sanitize({bank,id:String(p.id),source_url:u?attributionUrl(source):source,author:{name:(u?p.user?.name:x?p.user:p.photographer)||missing,profile_url:u?attributionUrl(profile):profile||missing},preview_url:(u?p.urls?.small:x?p.webformatURL:p.src?.medium)||missing,image_url:image,width:(x?p.imageWidth:p.width)||missing,height:(x?p.imageHeight:p.height)||missing,description:(u?(p.description||p.alt_description):x?p.tags:p.alt)||missing,retrieved_at:new Date().toISOString(),image_rights:{license:missing,additional_permissions:missing,person_release:missing,property_release:missing,trademarks:missing},provider_conditions:{...policies[bank],references_checked_at:'2026-10-04',scope:'Conditions générales ; pas une vérification juridique de cette image.'},local_path:missing,original:p});
}
const cacheRoot=fileURLToPath(new URL('../.cache/pixabay/',import.meta.url));
export class Providers{
 constructor(fetcher=fetch){this.fetcher=fetcher;}
 async request(bank,path,params={}){
  const key=process.env[keys[bank]];if(!key)throw new Error(`${bank} indisponible : ${keys[bank]} absente.`);
  const base={pexels:'https://api.pexels.com/v1/',unsplash:'https://api.unsplash.com/',pixabay:'https://pixabay.com/api/'}[bank];
  const url=new URL(path,base);for(const [k,v]of Object.entries(params))if(v!==undefined)url.searchParams.set(k,String(v));
  let cacheFile;
  if(bank==='pixabay'){
   cacheFile=cacheRoot+createHash('sha256').update(url.href+key).digest('hex')+'.json';
   try{const c=JSON.parse(await readFile(cacheFile,'utf8'));if(Date.now()-c.at<86400000)return c.data;}catch{}
   url.searchParams.set('key',key);
  }
  const headers=bank==='pexels'?{Authorization:key}:bank==='unsplash'?{Authorization:`Client-ID ${key}`,'Accept-Version':'v1'}:{};
  let r;try{r=await this.fetcher(url,{headers,signal:AbortSignal.timeout(15000),redirect:'error'});}catch{throw new Error(`${bank} : réseau indisponible ou délai de 15 s dépassé.`);}
  if(!r.ok)throw new Error(`${bank} : HTTP ${r.status}${[401,403].includes(r.status)?' (authentification ou accès refusé)':''}${r.status===429?' (quota atteint)':''}; quota restant ${r.headers.get('x-ratelimit-remaining')||missing}, reprise ${r.headers.get('retry-after')||r.headers.get('x-ratelimit-reset')||missing}.`);
  let data;try{data=await r.json();}catch{throw new Error(`${bank} : réponse JSON invalide.`);}
  data=sanitize(data);if(cacheFile){await mkdir(cacheRoot,{recursive:true,mode:0o700});await writeFile(cacheFile,JSON.stringify({at:Date.now(),data}),{mode:0o600});}return data;
 }
 async search(bank,{query,orientation='all',count=8,page=1}){
  if(bank==='pixabay'&&orientation==='square')throw new Error('Pixabay : filtre square non pris en charge.');
  if(bank==='pixabay'&&query.length>100)throw new Error('Pixabay : mots-clés limités à 100 caractères.');
  const o=orientation==='all'?undefined:bank==='pixabay'?{landscape:'horizontal',portrait:'vertical'}[orientation]:bank==='unsplash'&&orientation==='square'?'squarish':orientation;
  const d=await this.request(bank,bank==='pexels'?'search':bank==='unsplash'?'search/photos':'',{[bank==='pixabay'?'q':'query']:query,orientation:o,per_page:bank==='pixabay'?Math.max(3,count):count,page,...(bank==='pixabay'?{image_type:'photo',safesearch:true}:{})});
  const items=bank==='pexels'?d.photos:bank==='unsplash'?d.results:d.hits;
  if(!Array.isArray(items))throw new Error(`${bank} : liste de résultats absente.`);
  const images=[],warnings=[];for(const p of items.slice(0,count))try{images.push(normalize(bank,p));}catch(e){warnings.push(e.message);}
  if(bank==='unsplash'&&orientation==='square')warnings.push('square est adapté au filtre squarish (approximativement carré).');
  return {bank,images,warnings,page,total:d.total_results??d.total??missing};
 }
 async details(bank,id){const d=await this.request(bank,bank==='pixabay'?'':`photos/${encodeURIComponent(id)}`,bank==='pixabay'?{id}:{});const p=bank==='pixabay'?d.hits?.[0]:d;if(!p)throw new Error(`${bank} : image introuvable.`);return normalize(bank,p);}
 async track(image){await this.request('unsplash',`photos/${encodeURIComponent(image.id)}/download`);}
}
