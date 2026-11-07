'use strict';
// Runtime URLs change with their bytes. Keep canonical files for legacy links,
// downloads, and source-level checks; newly built HTML never uses stale URLs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function fingerprintAssets(directory){
 const assets={};
 const pages=fs.readdirSync(directory).filter(name=>name.endsWith('.html')&&!name.startsWith('qa-')).sort();
 for(const page of pages){
  const file=path.join(directory,page),html=fs.readFileSync(file,'utf8');
  const rewritten=html.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=")(?![a-z]+:|\/\/)([^"?#]+\.(?:js|css))(")/g,(match,before,ref,after)=>{
   // Repeated calls are idempotent, including unchanged builds.
   if(/\.[a-f0-9]{16}\.(?:js|css)$/.test(ref))return match;
   const absolute=path.resolve(directory,ref);
   if(!absolute.startsWith(path.resolve(directory)+path.sep))throw Error('Runtime asset escapes output: '+ref);
   const bytes=fs.readFileSync(absolute),sha256=digest(bytes),ext=path.extname(ref);
   const versioned=ref.slice(0,-ext.length)+'.'+sha256.slice(0,16)+ext;
   fs.writeFileSync(path.join(directory,versioned),bytes);
   assets[ref]={file:versioned,sha256};
   return before+versioned+after;
  });
  fs.writeFileSync(file,rewritten);
 }
 // An unchanged second invocation must not erase the last valid manifest.
 if(Object.keys(assets).length)fs.writeFileSync(path.join(directory,'asset-manifest.json'),JSON.stringify({algorithm:'sha256',assets:Object.fromEntries(Object.entries(assets).sort(([a],[b])=>a.localeCompare(b)))},null,2)+'\n');
 return assets;
}
module.exports={fingerprintAssets,digest};
