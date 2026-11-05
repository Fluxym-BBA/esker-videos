/* =========================================================================
   2. GÉOMÉTRIE
   ========================================================================= */
const C=410, R2=392, R1=252, HUB=228;
const O1=4, O2=148, B1=152, B2=208, S1=212, S2=356;

function pol(cx,cy,r,a){const t=(a-90)*Math.PI/180;return[cx+r*Math.cos(t),cy+r*Math.sin(t)]}
function ring(cx,cy,r1,r2,a1,a2,pad){
  pad=pad||0;a1+=pad;a2-=pad;
  const[x1,y1]=pol(cx,cy,r2,a1),[x2,y2]=pol(cx,cy,r2,a2),
        [x3,y3]=pol(cx,cy,r1,a2),[x4,y4]=pol(cx,cy,r1,a1),la=(a2-a1)>180?1:0;
  return`M${x1.toFixed(2)} ${y1.toFixed(2)}A${r2} ${r2} 0 ${la} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${r1} ${r1} 0 ${la} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
}
function arc(cx,cy,r,a1,a2){
  const[x1,y1]=pol(cx,cy,r,a1),[x2,y2]=pol(cx,cy,r,a2),la=Math.abs(a2-a1)>180?1:0,sw=a2>a1?1:0;
  return`M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${la} ${sw} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function wrapTxt(txt,max){
  const w=txt.split(" "),l=[];let c="";
  w.forEach(x=>{if((c+" "+x).trim().length>max&&c){l.push(c);c=x}else c=(c?c+" ":"")+x});
  if(c)l.push(c);return l.slice(0,3);
}
/* largeur approximative d'un texte circulaire */
function advW(str,fs,ls){
  const adv=c=>(c===" "?fs*0.30:(/[·.\-&]/.test(c)?fs*0.38:fs*0.63))+ls;
  return Array.from(str).reduce((a,c)=>a+adv(c),0);
}
function arcText(cx,cy,r,aMid,str,fs,fill,ls,inward,weight,cls){
  ls=(ls===undefined?0:ls);
  const adv=c=>(c===" "?fs*0.30:(/[·.\-&]/.test(c)?fs*0.38:fs*0.63))+ls;
  const chars=Array.from(str), ws=chars.map(adv);
  const perDeg=Math.PI*r/180, totalDeg=ws.reduce((a,b)=>a+b,0)/perDeg, dir=inward?-1:1;
  let a=aMid-dir*totalDeg/2, out="";
  chars.forEach((ch,i)=>{
    const wd=ws[i]/perDeg, ac=a+dir*wd/2, [x,y]=pol(cx,cy,r,ac), rot=inward?ac+180:ac;
    if(ch!==" ")out+=`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" transform="rotate(${rot.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})" text-anchor="middle" dy="${(fs*0.34).toFixed(2)}" font-size="${fs.toFixed(2)}" font-weight="${weight||700}" fill="${fill}" font-family="Miriam Libre, sans-serif">${esc(ch)}</text>`;
    a+=dir*wd;
  });
  return `<g class="${cls||''}" pointer-events="none">${out}</g>`;
}
/* ajuste automatiquement la taille pour tenir dans maxDeg degrés : corrige le débordement de CONNECTIVITY SUITE */
function arcTextFit(cx,cy,r,aMid,str,fsMax,fill,inward,maxDeg,lsMax,cls){
  let fs=fsMax, ls=(lsMax===undefined?1.2:lsMax);
  const perDeg=Math.PI*r/180;
  let guard=0;
  while(guard++<80 && advW(str,fs,ls)/perDeg > maxDeg){
    fs-=0.3; ls=Math.max(0,ls-0.06);
    if(fs<=5.5){fs=5.5;break}
  }
  return arcText(cx,cy,r,aMid,str,fs,fill,ls,inward,700,cls);
}

/* =========================================================================
   3. LA GRANDE ROUE
   ========================================================================= */
function segment(a1,a2,id,fs,maxc,idx){
  const m=byId(id); if(!m) return "";
  const am=(a1+a2)/2, c=m.c, soon=!vids(m).length;
  const[tx,ty]=pol(0,0,10,am);
  const[ix,iy]=pol(0,0,-26,am);
  let rot=((am-90)%360+360)%360; if(rot>90&&rot<270)rot+=180;
  const rl=(R1+R2)/2+2,[lx,ly]=pol(C,C,rl,am);
  const lines=wrapTxt(m.label,maxc||15);
  const lh=fs+2.4, blockH=lines.length*lh, off=-(blockH-lh)/2-lh*.25;
  const note = vidNote(m);
  let t=`<text class="slab" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" transform="rotate(${rot.toFixed(2)} ${lx.toFixed(1)} ${ly.toFixed(1)})" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#163467" letter-spacing=".2" font-family="Miriam Libre, sans-serif">`;
  lines.forEach((L,i)=>{t+=`<tspan x="${lx.toFixed(1)}" dy="${i===0?off.toFixed(1):lh.toFixed(1)}">${esc(L)}</tspan>`});
  t+=`<tspan class="scnt" x="${lx.toFixed(1)}" dy="${(lh+3).toFixed(1)}" font-size="${(fs-2.5).toFixed(1)}" font-weight="700" fill="${soon?'#9aa7bb':c}" font-family="Barlow, sans-serif">${note}</tspan></text>`;
  return`<g class="seg${soon?' soon':''}" id="seg-${id}" role="button" tabindex="0"
    style="--c:${c};--tx:${tx.toFixed(2)}px;--ty:${ty.toFixed(2)}px;--ix:${ix.toFixed(2)}px;--iy:${iy.toFixed(2)}px;--d:${(0.18+idx*0.045).toFixed(3)}s"
    data-id="${id}" data-suite="${m.suite}">
  <title>${esc(m.label)} : ${note}</title>
  <path class="sglow" d="${ring(C,C,R1-5,R2+5,a1,a2,.3)}" fill="${c}" opacity="0" filter="url(#blur10)"/>
  <path class="sfill" d="${ring(C,C,R1,R2,a1,a2,.55)}" fill="#fff" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"${soon?' opacity=".86"':''}/>
  <path class="srim" d="${ring(C,C,R1,R1+6,a1,a2,.55)}" fill="${c}" opacity="${soon?'.45':'.92'}" pointer-events="none"/>
  ${t}</g>`;
}

function suiteArc(a1,a2,suite,label){
  const r=R1-30;
  return `<g class="suitegrp" id="arc-${suite}" data-suite="${suite}">
    <path class="suitearc-base" d="${arc(C,C,r,a1+4,a2-4)}" fill="none" stroke="#13b4e2" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>
    <path class="suitearc-flow" d="${arc(C,C,r,a1+4,a2-4)}" fill="none" stroke="#6b51ed" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
    <path class="suitearc-comet" d="${arc(C,C,r,a1+4,a2-4)}" fill="none" stroke="url(#gComet)" stroke-width="4.6" stroke-linecap="round"/>
    ${arcText(C,C,R1-14,(a1+a2)/2,label,18,"#163467",4,false,700,"suitelab")}
    <circle class="suite-node" cx="${pol(C,C,r,a1+4)[0].toFixed(1)}" cy="${pol(C,C,r,a1+4)[1].toFixed(1)}" r="6.5" fill="#13b4e2"/>
    <circle class="suite-node" cx="${pol(C,C,r,a2-4)[0].toFixed(1)}" cy="${pol(C,C,r,a2-4)[1].toFixed(1)}" r="6.5" fill="#13b4e2"/>
  </g>`;
}

function decor(){
  let d=`<g class="rot-slow" style="transform-origin:${C}px ${C}px">
    <circle cx="${C}" cy="${C}" r="${R2+10}" fill="none" stroke="#13b4e2" stroke-width="1.2" stroke-dasharray="2 13" opacity=".45"/></g>
  <g class="rot-rev" style="transform-origin:${C}px ${C}px">
    <circle cx="${C}" cy="${C}" r="${R2+22}" fill="none" stroke="#6b51ed" stroke-width="1" stroke-dasharray="26 20" opacity=".2"/></g>
  <g class="rot-med" style="transform-origin:${C}px ${C}px">
    <circle cx="${C}" cy="${C}" r="${R2+34}" fill="none" stroke="#13b4e2" stroke-width="1" stroke-dasharray="1 18" opacity=".3"/></g>
  <g class="rot-fast" style="transform-origin:${C}px ${C}px">`;
  for(let i=0;i<3;i++){const[x,y]=pol(C,C,R2+10,i*120);
    d+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#13b4e2" opacity=".85"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="#13b4e2" opacity=".16"/>`}
  d+=`</g><g class="rot-rev" style="transform-origin:${C}px ${C}px">`;
  for(let i=0;i<2;i++){const[x,y]=pol(C,C,R2+22,40+i*180);d+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="#6b51ed" opacity=".6"/>`}
  d+=`</g><g class="rot-med" style="transform-origin:${C}px ${C}px">`;
  for(let i=0;i<5;i++){const[x,y]=pol(C,C,R2+34,22+i*72);d+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#13b4e2" opacity=".5"/>`}
  return d+`</g>`;
}
function icoAI(x,y,sc,c){
  let g=`<g transform="translate(${x} ${y}) scale(${sc})" stroke="${c}" stroke-width="1.8" fill="none">`;
  const P=[[0,-11],[10,-4],[7,8],[-7,8],[-10,-4]];
  P.forEach((a,i)=>{P.forEach((b,j)=>{if(j>i)g+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" opacity=".45"/>`})});
  P.forEach((a,i)=>{g+=`<circle class="ainode" style="animation-delay:${(i*0.35).toFixed(2)}s" cx="${a[0]}" cy="${a[1]}" r="3" fill="${c}" stroke="none"/>`});
  return g+`<circle class="aicore" cx="0" cy="0" r="2.4" fill="${c}" stroke="none"/></g>`;
}

function buildWheel(){
  let g=`<svg class="wheel-svg" id="bigWheel" viewBox="-22 -22 864 864" role="img" aria-label="${I('wheelAria')}">
  <defs>
    <linearGradient id="gBand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFCF63"/><stop offset="1" stop-color="#F5A623"/></linearGradient>
    <linearGradient id="gComet" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#13b4e2" stop-opacity="0"/><stop offset=".5" stop-color="#6b51ed"/><stop offset="1" stop-color="#13b4e2" stop-opacity="0"/></linearGradient>
    <radialGradient id="gHub"><stop offset="0" stop-color="#ffffff"/><stop offset=".72" stop-color="#fbfdfe"/><stop offset="1" stop-color="#eaf3f7"/></radialGradient>
    <radialGradient id="gSweep"><stop offset="0" stop-color="#13b4e2" stop-opacity=".22"/><stop offset="1" stop-color="#13b4e2" stop-opacity="0"/></radialGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#163467" flood-opacity=".1"/></filter>
    <filter id="blur10" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>`;
  g+=decor();
  /* noyau */
  g+=`<circle cx="${C}" cy="${C}" r="${HUB}" fill="url(#gHub)" filter="url(#sh)"/>`;
  g+=`<g class="hub-sweep" style="transform-origin:${C}px ${C}px"><path d="M${C} ${C} L${C} ${C-HUB} A${HUB} ${HUB} 0 0 1 ${(C+HUB*Math.cos(-Math.PI/3)).toFixed(1)} ${(C+HUB*Math.sin(-Math.PI/3)).toFixed(1)} Z" fill="url(#gSweep)"/></g>`;
  g+=`<circle class="hub-ring-a" style="transform-origin:${C}px ${C}px" cx="${C}" cy="${C}" r="${HUB-9}" fill="none" stroke="#13b4e2" stroke-width="1" stroke-dasharray="4 9" opacity=".45"/>`;
  g+=`<circle class="hub-ring-b breathe" style="transform-origin:${C}px ${C}px" cx="${C}" cy="${C}" r="${HUB-22}" fill="none" stroke="#6b51ed" stroke-width=".9" stroke-dasharray="22 14"/>`;
  /* arcs de suite animés */
  g+=suiteArc(S1,S2,"S2P","SOURCE-TO-PAY");
  g+=suiteArc(O1,O2,"O2C","ORDER-TO-CASH");
  /* segments */
  const ws=(S2-S1)/ORDER_S2P.length, wo=(O2-O1)/ORDER_O2C.length;
  ORDER_S2P.forEach((id,i)=>{g+=segment(S1+i*ws,S1+(i+1)*ws,id,13,15,i)});
  ORDER_O2C.forEach((id,i)=>{g+=segment(O1+i*wo,O1+(i+1)*wo,id,12.5,15,i+6)});
  /* socle plateforme : textes auto-ajustés pour ne jamais déborder */
  g+=`<g class="bandg"><title>${I("band")}</title>
    <path d="${ring(C,C,R1,R2,B1,B2,.55)}" fill="url(#gBand)"/>
    <path class="bandsheen" d="${ring(C,C,R1,R2,B1,B2,.55)}" fill="#fff" opacity=".12"/>`;
  const COLL=166, COLR=194, MAXD=24;
  g+=arcTextFit(C,C,R2-26,COLL,"AI AGENTS",12,"#6B3E00",true,MAXD,1.2);
  g+=arcTextFit(C,C,R2-50,COLL,"B2B PAYMENTS",12,"#6B3E00",true,MAXD,1.2);
  g+=arcTextFit(C,C,R2-74,COLL,"CONNECTIVITY SUITE",11,"#6B3E00",true,MAXD,1.0);
  g+=arcTextFit(C,C,R2-26,COLR,"UNIFIED UX",12,"#6B3E00",true,MAXD,1.2);
  g+=arcTextFit(C,C,R2-50,COLR,"DATALAKE",12,"#6B3E00",true,MAXD,1.2);
  g+=arcTextFit(C,C,R2-74,COLR,"ISO 27001",12,"#6B3E00",true,MAXD,1.2);
  g+=`</g>`;
  /* pastille Synergy AI */
  const[sx,sy]=pol(C,C,R1+2,180);
  g+=`<g class="aihub"><title>${I('synergy')}</title>
    <g class="aiorb" style="transform-origin:${sx.toFixed(1)}px ${sy.toFixed(1)}px">
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="42" fill="#fff" stroke="#F5A623" stroke-width="3"/>
      <circle class="airing" style="transform-origin:${sx.toFixed(1)}px ${sy.toFixed(1)}px" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="49" fill="none" stroke="#F5A623" stroke-width="1.6" stroke-dasharray="5 7" opacity=".6"/>
      ${icoAI(sx,sy-7,.72,"#B45309")}
      <text x="${sx.toFixed(1)}" y="${(sy+22).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" letter-spacing=".8" fill="#92400E" font-family="Miriam Libre, sans-serif">SYNERGY AI</text>
    </g></g>`;
  /* contenu du noyau : état par défaut */
  g+=`<g class="hub-default">
    <g transform="translate(${C-78} ${C-92}) scale(0.1215)"><use href="#eskerword" width="1283" height="290" style="color:#db001b"/></g>
    <text x="${C}" y="${C-14}" text-anchor="middle" font-size="22" font-weight="700" fill="#163467" letter-spacing="-.5" font-family="Miriam Libre, sans-serif">AI Automation Suite</text>
    <text x="${C}" y="${C+14}" text-anchor="middle" font-size="22" font-weight="700" fill="#163467" letter-spacing="-.5" font-family="Miriam Libre, sans-serif">for Finance &amp; Procurement</text>
    <text x="${C}" y="${C+50}" text-anchor="middle" font-size="12" font-weight="700" fill="#9aa7bb" letter-spacing="1.6" font-family="Barlow, sans-serif">${I("count")}</text>
    <text x="${C}" y="${C+76}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#13b4e2" letter-spacing=".4" font-family="Barlow, sans-serif">${I("hint")}</text>
  </g>`;
  /* contenu du noyau : état survol */
  g+=`<g class="hub-hover" id="hubHover" role="button" tabindex="-1" style="cursor:pointer">
    <circle id="hhRing" cx="${C}" cy="${C-72}" r="31" fill="#f0f6f8"/>
    <text id="hhIcon" x="${C}" y="${C-61}" text-anchor="middle" font-size="31">🔎</text>
    <text id="hhSuite" x="${C}" y="${C-18}" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="2.4" fill="#13b4e2" font-family="Barlow, sans-serif">SOURCE-TO-PAY</text>
    <text id="hhName" x="${C}" y="${C+16}" text-anchor="middle" font-size="25" font-weight="700" fill="#163467" font-family="Miriam Libre, sans-serif">Sourcing</text>
    <text id="hhName2" x="${C}" y="${C+44}" text-anchor="middle" font-size="25" font-weight="700" fill="#163467" font-family="Miriam Libre, sans-serif"></text>
    <g id="hhCta" transform="translate(${C} ${C+78})">
      <rect x="-82" y="-15" width="164" height="30" rx="15" fill="#13b4e2"/>
      <text id="hhCtaT" x="0" y="5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" letter-spacing=".6" font-family="Barlow, sans-serif">${I("cta")}</text>
    </g>
  </g>`;
  return g+`</svg>`;
}

