'use strict';
const fs=require('node:fs');
// Keep legacy whole-page checks focused on the reviewed lesson content while
// allowing the intentional course-review links in the shared shell.
module.exports=function readReviewedPage(file){
 let html=fs.readFileSync('dist/'+file,'utf8');
 html=html.replace(/presentation\.[a-f0-9]{16}\.css/g,'presentation.1a7e53514d9b0a7c.css');
 html=html.replace('Follow in order, or revisit any class. <a href="course-review.html">Course synthesis</a> · <a href="equation-guide.html">Equation guide</a>','Follow in order, or revisit any class.');
 if(file==='course-introduction.html'||file==='index.html')html=html.replace(/<section class="block intro-review-links"[\s\S]*?<\/section>\n/,'');
 if(file==='regression.html')html=html.replace(/<section class="block" aria-labelledby="course-review-next">[\s\S]*?<\/section>/,'');
 return html;
};

