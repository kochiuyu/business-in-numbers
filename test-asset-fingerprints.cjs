'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {fingerprintAssets,digest}=require('./scripts/fingerprint-assets.cjs');
const manifest=JSON.parse(fs.readFileSync('dist/asset-manifest.json','utf8'));let count=0;
assert.equal(manifest.algorithm,'sha256');
for(const[original,{file,sha256}]of Object.entries(manifest.assets)){
 const canonical=fs.readFileSync(path.join('dist',original)),versioned=fs.readFileSync(path.join('dist',file));
 assert.equal(digest(canonical),sha256);assert.equal(digest(versioned),sha256);assert(file.includes('.'+sha256.slice(0,16)+'.'));count+=3;
}
for(const page of fs.readdirSync('dist').filter(x=>x.endsWith('.html')&&!x.startsWith('qa-'))){
 const html=fs.readFileSync(path.join('dist',page),'utf8');
 for(const [,ref]of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+\.(?:js|css))"/g)){
  assert(/\.[a-f0-9]{16}\.(?:js|css)$/.test(ref),`${page}: unversioned ${ref}`);
  assert(fs.existsSync(path.join('dist',ref)));count+=2;
 }
}
// A real old-URL/new-URL upgrade, stable rebuild, a nested stylesheet and
// independent asset changes. Unchanged dependencies retain their fingerprints.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'course-assets-'));
try{
 fs.mkdirSync(path.join(tmp,'vendor'));
 const template='<link rel="stylesheet" href="vendor/a.css"><script src="a.js"></script><a href="notes.py">Download</a>';
 fs.writeFileSync(path.join(tmp,'descriptive-statistics.html'),template);fs.writeFileSync(path.join(tmp,'vendor/a.css'),'body{color:red}');fs.writeFileSync(path.join(tmp,'a.js'),'var revision=1;');
 const first=fingerprintAssets(tmp),before=fs.readFileSync(path.join(tmp,'descriptive-statistics.html'),'utf8');
 fingerprintAssets(tmp);assert.equal(fs.readFileSync(path.join(tmp,'descriptive-statistics.html'),'utf8'),before);
 fs.writeFileSync(path.join(tmp,'descriptive-statistics.html'),template);fs.writeFileSync(path.join(tmp,'a.js'),'var revision=2;');
 const second=fingerprintAssets(tmp);assert.notEqual(first['a.js'].file,second['a.js'].file);assert.equal(first['vendor/a.css'].file,second['vendor/a.css'].file);
 assert(fs.existsSync(path.join(tmp,first['a.js'].file)),'previous version retained');
 assert(fs.readFileSync(path.join(tmp,'descriptive-statistics.html'),'utf8').includes('href="notes.py"'));count+=5;
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`Asset fingerprints: ${count} content hashes, local paths, stable builds and upgrade assertions passed.`);
