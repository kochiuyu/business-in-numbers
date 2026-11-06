'use strict';
(function(root){
 const rate=(v,name)=>{if(!Number.isFinite(v)||v<0||v>1)throw new RangeError(name+' must be between 0 and 1.');return v;};
 function bayes(prior,sensitivity,falsePositive,total=10000){
  rate(prior,'Prior');rate(sensitivity,'Sensitivity');rate(falsePositive,'False-positive rate');
  if(!Number.isFinite(total)||total<=0)throw new RangeError('Total must be positive.');
  const tp=prior*sensitivity,fn=prior*(1-sensitivity),fp=(1-prior)*falsePositive,tn=(1-prior)*(1-falsePositive),positive=tp+fp,negative=fn+tn;
  return {tp:tp*total,fn:fn*total,fp:fp*total,tn:tn*total,positive:positive*total,negative:negative*total,posteriorPositive:positive>0?tp/positive:null,posteriorNegative:negative>0?fn/negative:null,alertRate:positive};
 }
 function counts(n,r){
  if(!Number.isInteger(n)||!Number.isInteger(r)||n<0||r<0||r>n||n>20)throw new RangeError('Enter whole numbers with 0 ≤ r ≤ n ≤ 20.');
  let permutations=1n,factorial=1n;for(let i=0;i<r;i++){permutations*=BigInt(n-i);factorial*=BigInt(i+1);}
  return {permutations,combinations:permutations/factorial,replacement:BigInt(n)**BigInt(r)};
 }
 const events={intersection:{selected:[4,6],possible:[1,2,3,4,5,6],text:'E and L: {4, 6}. Two of six equally likely outcomes, so P(E ∩ L) = 2/6 = 1/3.'},union:{selected:[2,4,5,6],possible:[1,2,3,4,5,6],text:'E or L: {2, 4, 5, 6}. Four of six equally likely outcomes, so P(E ∪ L) = 4/6 = 2/3. The overlap is counted once.'},complement:{selected:[1,3,5],possible:[1,2,3,4,5,6],text:'Not E: {1, 3, 5}. Three of six outcomes, so P(Eᶜ) = 3/6 = 1/2.'},conditional:{selected:[4,6],possible:[4,5,6],text:'E given L: restrict to {4, 5, 6}. Two of these three outcomes are even, so P(E | L) = 2/3. The denominator is now three, not six.'}};
 const api={bayes,counts,events};if(typeof module==='object'&&module.exports)module.exports=api;else root.Probability=api;
})(typeof globalThis!=='undefined'?globalThis:this);
