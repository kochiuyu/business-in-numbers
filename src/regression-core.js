'use strict';
(function(root){
const H=typeof module==='object'?require('./hypothesis-core.js'):root.HypothesisModels;
const DEFAULT_PAIRS=Object.freeze([11,12,16,15,19,20,23,24].map((y,i)=>Object.freeze([i+1,y])));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,d=4)=>x===null||x===undefined?'Not defined':!Number.isFinite(x)?String(x):x!==0&&Math.abs(x)<1e-4?x.toExponential(3):Number(x.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});
function value(x,label){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>1e9)throw Error(`${label} must be a finite number with absolute value at most 1,000,000,000.`);return x;}
function sum(xs){let s=0,c=0;for(const x of xs){const t=s+x;c+=Math.abs(s)>=Math.abs(x)?(s-t)+x:(x-t)+s;s=t;}return s+c;}
function parsePairs(text){
 if(typeof text!=='string'||!text.trim())throw Error('Enter 3–1,000 rows, each with x and y.');
 const rows=text.trim().split(/\r?\n|;/);if(rows.length>1000)throw Error('Use at most 1,000 observations.');
 return rows.map((row,i)=>{const s=row.trim(),tokens=s.includes(',')?s.split(',').map(x=>x.trim()):s.split(/\s+/);if(tokens.length!==2||tokens.some(x=>!x||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(x)))throw Error(`Row ${i+1}: enter exactly two numeric values (x, y), without a header or empty fields.`);return tokens.map(x=>value(Number(x),`Row ${i+1}`));});
}
function fit(pairs=DEFAULT_PAIRS,alpha=.05,x0=4){
 if(typeof pairs==='string')pairs=parsePairs(pairs);
 if(!Array.isArray(pairs)||pairs.length<3||pairs.length>1000)throw Error('Use 3–1,000 paired observations.');
 if(typeof alpha!=='number'||!Number.isFinite(alpha)||alpha<.001||alpha>.2)throw Error('Significance level must be from 0.001 to 0.2.');value(x0,'Prediction x');
 pairs=pairs.map((p,i)=>{if(!Array.isArray(p)||p.length!==2)throw Error(`Observation ${i+1} must contain exactly x and y.`);return [value(p[0],'x'),value(p[1],'y')];});
 const n=pairs.length,x=pairs.map(p=>p[0]),y=pairs.map(p=>p[1]);
 // Shift before summation to retain small spreads around large offsets.
 const xbar=x[0]+sum(x.map(v=>v-x[0]))/n,ybar=y[0]+sum(y.map(v=>v-y[0]))/n;
 const dx=x.map(v=>v-xbar),dy=y.map(v=>v-ybar),Sxx=sum(dx.map(v=>v*v)),Sxy=sum(dx.map((v,i)=>v*dy[i])),SST=sum(dy.map(v=>v*v));
 if(!(Sxx>0)||!Number.isFinite(Sxx))throw Error('x must contain at least two distinct values with a numerically resolvable spread.');
 const b=Sxy/Sxx,a=ybar-b*xbar,df=n-2;
 if(!Number.isFinite(b)||!Number.isFinite(a))throw Error('The predictor spread is too small for stable arithmetic. Rescale x.');
 const fitted=dx.map(v=>ybar+b*v),rawResiduals=dy.map((v,i)=>v-b*dx[i]);
 let SSE=sum(rawResiduals.map(v=>v*v));const SSR=b*Sxy;
 // Roundoff-only residuals in a truly linear sample are not evidence of noise.
 const perfect=SST>0&&SSE<=256*Number.EPSILON**2*SST,constant=SST===0;
 if(perfect||constant)SSE=0;
 const residuals=perfect||constant?rawResiduals.map(()=>0):rawResiduals;
 const status=constant?'constant-response':perfect?'perfect-fit':'ok',valid=status==='ok';
 const s2=SSE/df,s=Math.sqrt(s2),seB=s/Math.sqrt(Sxx),seA=s*Math.sqrt(1/n+xbar*xbar/Sxx),covAB=-xbar*s2/Sxx;
 const r=SST>0?Math.max(-1,Math.min(1,Sxy/Math.sqrt(Sxx)/Math.sqrt(SST))):null,r2=SST>0?Math.max(0,Math.min(1,SSR/SST)):null;
 const criticalT=H.tQuant(1-alpha/2,df),tA=valid?a/seA:null,tB=valid?b/seB:null,pA=valid?Math.min(1,2*H.tCdf(-Math.abs(tA),df)):null,pB=valid?Math.min(1,2*H.tCdf(-Math.abs(tB),df)):null;
 const interval=(m,se)=>valid?[m-criticalT*se,m+criticalT*se]:null;
 const ciA=interval(a,seA),ciB=interval(b,seB),F=valid?SSR/s2:null,pF=valid?H.fSf(F,1,df):null;
 const prediction=ybar+b*(x0-xbar),meanSE=s*Math.sqrt(1/n+(x0-xbar)**2/Sxx),predSE=Math.hypot(s,meanSE),meanCI=interval(prediction,meanSE),predPI=interval(prediction,predSE),leverage=dx.map(v=>1/n+v*v/Sxx),inRange=x0>=Math.min(...x)&&x0<=Math.max(...x);
 if([a,b,prediction,meanSE,predSE,seA,seB,covAB].some(v=>!Number.isFinite(v)))throw Error('Inputs produce unstable arithmetic. Rescale x and y.');
 return {pairs,n,xbar,ybar,Sxx,Sxy,SST,SSE,SSR,a,b,df,s2,s,seA,seB,covAB,r,r2,tA,tB,pA,pB,ciA,ciB,F,pF,criticalT,alpha,x0,prediction,meanSE,predSE,meanCI,predPI,residuals,fitted,leverage,inRange,status};
}
const api={DEFAULT_PAIRS,fit,parsePairs,fmt,esc};if(typeof module==='object')module.exports=api;root.RegressionModels=api;
})(typeof window==='undefined'?globalThis:window);
