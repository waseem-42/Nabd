/* One deterministic rig, shared by Qassa's renderer and Nabd's interactive preview.
 * Angles are illustrative animation parameters, not prescribed joint measurements. */
(() => {
  const query = new URLSearchParams(location.search)
  const ns = 'http://www.w3.org/2000/svg'
  const figure = document.getElementById('figure')
  const guides = document.getElementById('guides')
  const ghost = document.getElementById('ghost')
  const styles = ['sculpted','technical','duotone','athlete','contour','segments','comparison']
  const radians = d => d * Math.PI / 180
  const point = (p, length, degrees) => [p[0] + length * Math.sin(radians(degrees)), p[1] - length * Math.cos(radians(degrees))]
  const mix = (a, b, p) => a + (b - a) * p
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }
  const el = (name, attrs) => { const node = document.createElementNS(ns, name); for (const [k,v] of Object.entries(attrs)) node.setAttribute(k, String(v)); return node }
  const line = (group, a, b, color, width, opacity = 1) => group.append(el('path', {d:`M${a}L${b}`, stroke:color, 'stroke-width':width, 'stroke-linecap':'round', fill:'none', opacity}))
  const circle = (group, p, radius, fill, stroke = 'none', width = 1) => group.append(el('circle', {cx:p[0],cy:p[1],r:radius,fill,stroke,'stroke-width':width}))
  function pose(p) {
    const ankle = [500, 744]
    const knee = point(ankle, 172, mix(0, 25, p))
    const hip = point(knee, 184, mix(-3, -88, p))
    const shoulder = point(hip, 198, mix(4, 32, p))
    const head = point(shoulder, 61, mix(4, 20, p))
    const elbow = point(shoulder, 113, mix(166, 84, p))
    const wrist = point(elbow, 100, mix(166, 84, p))
    return {ankle,knee,hip,shoulder,head,elbow,wrist}
  }
  function torso(group, a, b, fill, stroke = 'none') {
    const d = Math.hypot(b[0]-a[0], b[1]-a[1]); const n = [-(b[1]-a[1])/d, (b[0]-a[0])/d]
    const side = (p,w) => [p[0]+n[0]*w,p[1]+n[1]*w]
    const a1=side(a,38),a2=side(a,-38),b1=side(b,31),b2=side(b,-31)
    group.append(el('path',{d:`M${a1} Q${side([(a[0]+b[0])/2,(a[1]+b[1])/2],31)} ${b1} Q${b} ${b2} L${a2} Q${a} ${a1}Z`,fill,stroke,'stroke-width':3,'stroke-linejoin':'round'}))
  }
  // Tapered limbs keep the new illustrated athlete readable without skeletal guides.
  function limb(group, a, b, startWidth, endWidth, fill, outline = false) {
    const length=Math.hypot(b[0]-a[0],b[1]-a[1])
    const n=[-(b[1]-a[1])/length,(b[0]-a[0])/length]
    const edge=(p,w)=>[p[0]+n[0]*w,p[1]+n[1]*w]
    const a1=edge(a,startWidth),a2=edge(a,-startWidth),b1=edge(b,endWidth),b2=edge(b,-endWidth)
    group.append(el('path',{d:`M${a1}L${b1}Q${point(b,endWidth,180)} ${b2}L${a2}Q${a} ${a1}Z`,fill,stroke:outline?'#344137':'none','stroke-width':outline?4:0,'stroke-linejoin':'round'}))
    circle(group,a,startWidth,fill,outline?'#344137':'none',outline?4:0)
    circle(group,b,endWidth,fill,outline?'#344137':'none',outline?4:0)
  }
  function athlete(group, p, style) {
    const g=el('g',{'data-treatment':style});group.append(g)
    const {ankle,knee,hip,shoulder,head,elbow,wrist}=p
    const outline=style==='contour', segmented=style==='segments'
    const skin=outline?'#f5f2e9':segmented?'#a6bfb8':'#dba77d'
    const shirt=outline?'#f5f2e9':segmented?'#f5f2e9':'#e9eadb'
    const shorts='var(--accent)'
    const dark=outline?'#344137':segmented?'#56695d':'#38483b'
    const back=outline?'#d3dbc9':segmented?'#6a8d83':'#aa7c59'
    const shift=pt=>[pt[0]-30,pt[1]-7]
    limb(g,shift(knee),shift(ankle),21,15,back,outline)
    limb(g,shift(hip),shift(knee),32,23,outline?'#d3dbc9':'#9c5546',outline)
    limb(g,shift(shoulder),shift(elbow),20,16,back,outline)
    limb(g,shift(elbow),shift(wrist),16,12,back,outline)
    line(g,shift(ankle),[525,765],dark,24)
    limb(g,knee,ankle,23,16,skin,outline)
    limb(g,hip,knee,35,23,skin,outline)
    const hem=[mix(hip[0],knee[0],.58),mix(hip[1],knee[1],.58)]
    limb(g,hip,hem,38,29,shorts,outline)
    line(g,shoulder,head,skin,34)
    torso(g,shoulder,hip,shirt,outline?'#344137':'none')
    // Shirt seams and an asymmetric hem distinguish clothing from bare body segments.
    const seam=[mix(shoulder[0],hip[0],.22)+27,mix(shoulder[1],hip[1],.22)]
    line(g,seam,[hip[0]+25,hip[1]-8],outline?'#7d8f7c':'#bcc6b4',3)
    line(g,[hip[0]-23,hip[1]-3],[hip[0]+22,hip[1]+8],dark,7)
    const hx=head[0],hy=head[1]
    g.append(el('path',{d:`M${hx-23},${hy-22}Q${hx+15},${hy-43} ${hx+29},${hy-10}L${hx+39},${hy+3}Q${hx+41},${hy+8} ${hx+29},${hy+10}L${hx+25},${hy+27}Q${hx+3},${hy+37} ${hx-21},${hy+14}Z`,fill:skin,stroke:outline?'#344137':'none','stroke-width':4}))
    g.append(el('path',{d:`M${hx-24},${hy+1}Q${hx-36},${hy-40} ${hx+9},${hy-37}Q${hx+25},${hy-36} ${hx+27},${hy-19}L${hx+1},${hy-21}L${hx-7},${hy-1}Z`,fill:dark}))
    circle(g,[hx+17,hy-2],2.5,dark)
    circle(g,[hx-2,hy+5],5,skin,outline?'#344137':'#b47d58',2)
    limb(g,shoulder,elbow,22,17,skin,outline)
    // Short sleeve keeps the shoulder separate from the foreground arm.
    const sleeve=[mix(shoulder[0],elbow[0],.33),mix(shoulder[1],elbow[1],.33)]
    limb(g,shoulder,sleeve,26,23,shirt,outline)
    limb(g,elbow,wrist,17,12,skin,outline)
    circle(g,wrist,15,skin,outline?'#344137':'none',3)
    g.append(el('path',{d:'M480 738Q498 736 514 748L552 760Q571 766 565 777H478Q471 763 480 738Z',fill:outline?'#f5f2e9':dark,stroke:outline?'#344137':'none','stroke-width':4}))
    line(g,[480,777],[564,777],outline?'#344137':'#e4e7d8',5)
    line(g,[512,754],[531,760],outline?'#8f9b85':'var(--accent)',5)
    if(segmented){
      for(const joint of [hip,knee,shoulder,elbow]){circle(g,joint,12,'var(--panel)','var(--accent)',4);circle(g,joint,3,'var(--text)')}
    }
  }
  function label(group, x, y, text, color='var(--text)', size=26) {
    const node=el('text',{x,y,fill:color,'font-size':size,'text-anchor':'middle','font-family':'var(--font)'});node.textContent=text;group.append(node)
  }
  function draw(group, p, style, opacity = 1) {
    const g=el('g',{opacity}); group.append(g)
    const {ankle,knee,hip,shoulder,head,elbow,wrist}=p
    if(['athlete','contour','segments'].includes(style)){athlete(g,p,style);return}
    if(style==='technical') {
      const dim='var(--text)'
      line(g,ankle,knee,dim,46,.09);line(g,knee,hip,dim,60,.09);line(g,hip,shoulder,dim,78,.09)
      for(const [a,b] of [[ankle,knee],[knee,hip],[hip,shoulder],[shoulder,elbow],[elbow,wrist],[shoulder,head]])line(g,a,b,dim,9)
      circle(g,head,31,'none',dim,6)
      for(const pt of [ankle,knee,hip,shoulder,elbow,wrist]) {circle(g,pt,12,'var(--panel)','var(--accent)',4);circle(g,pt,3,'var(--accent)')}
      line(g,[482,771],[561,771],dim,9)
      return
    }
    const flat=style==='duotone';const skin=flat?'#34432e':'url(#skin)';const pants=flat?'var(--accent)':'url(#coral)'
    const back=flat?'#819077':'#697760'
    const off=pt=>[pt[0]-34,pt[1]-6]
    line(g,off(hip),off(knee),back,51);line(g,off(knee),off(ankle),back,39)
    line(g,off(shoulder),off(elbow),back,33);line(g,off(elbow),off(wrist),back,27)
    line(g,off(ankle),[526,767],back,26)
    line(g,knee,ankle,skin,43)
    line(g,hip,knee,pants,64)
    circle(g,knee,23,skin)
    torso(g,shoulder,hip,skin)
    line(g,shoulder,head,skin,38)
    // A profile, including a nose, gives the body an unambiguous forward direction.
    const hx=head[0],hy=head[1]
    g.append(el('path',{d:`M${hx-22},${hy-23} Q${hx+19},${hy-43} ${hx+31},${hy-8} L${hx+40},${hy+3} Q${hx+42},${hy+8} ${hx+30},${hy+10} L${hx+28},${hy+26} Q${hx+5},${hy+40} ${hx-20},${hy+14}Z`,fill:skin}))
    circle(g,[hx+13,hy-2],3,flat?'#b5c2a9':'#75816a')
    line(g,shoulder,elbow,skin,39);line(g,elbow,wrist,skin,31);circle(g,wrist,18,skin)
    g.append(el('path',{d:'M480 738 Q499 734 518 747 L554 760 Q574 765 566 777 H478 Q470 765 480 738Z',fill:flat?'#253321':'#d4dcc6'}))
    line(g,[481,777],[563,777],flat?'#819077':'#829276',5)
    if(!flat){line(g,[knee[0]+5,knee[1]+31],[ankle[0]+7,ankle[1]-25],'#f7f8ed',7,.23);line(g,[hip[0]+4,hip[1]+9],[knee[0]-15,knee[1]-12],'#ffc5ac',8,.28)}
  }
  function renderFrame(time = 0, graphic) {
    const data=graphic?.data ?? {}
    const style=styles.includes(data.style ?? query.get('style')) ? (data.style ?? query.get('style')) : 'sculpted'
    const lang=data.lang ?? query.get('lang') ?? 'ar'
    const t=((time%6)+6)%6
    const p=t<.6?0:t<2.5?smooth((t-.6)/1.9):t<3.1?1:t<5.4?1-smooth((t-3.1)/2.3):0
    const phase=t<.6||t>=5.4?0:t<2.5?1:t<3.1?2:3
    document.documentElement.dataset.style=style
    document.getElementById('backdrop').setAttribute('fill',['duotone','contour'].includes(style)?'#eeeede':'url(#ambient)')
    document.getElementById('shadow').setAttribute('visibility',style==='comparison'?'hidden':'visible')
    const labels=lang==='ar'?['استعداد','نزول بتحكّم','وقفة قصيرة','عودة للأعلى']:['Ready','Lower with control','Brief hold','Return upward']
    const names=lang==='ar'?{sculpted:'01 / مجسّم مبسّط',technical:'02 / رسم تقني',duotone:'03 / رسم بلونين',athlete:'04 / شخصية رياضية',contour:'05 / خطوط واضحة',segments:'06 / أجزاء ملوّنة',comparison:'07 / قبل وأثناء'}:{sculpted:'01 / SCULPTED',technical:'02 / TECHNICAL',duotone:'03 / DUOTONE',athlete:'04 / ATHLETE',contour:'05 / CONTOUR',segments:'06 / SEGMENTS',comparison:'07 / BEFORE & DURING'}
    document.getElementById('phase').textContent=labels[phase]
    document.getElementById('style-name').textContent=names[style]
    document.querySelector('[data-edit="signature"]').textContent=styles.indexOf(style)<3?'NABD / MOTION STUDY 01':'NABD / MOTION STUDY 02'
    figure.replaceChildren();guides.replaceChildren();ghost.replaceChildren()
    if(style==='technical') {
      draw(ghost,pose(0),'technical',.1)
      guides.append(el('path',{d:'M500 170V790',stroke:'var(--accent-2)','stroke-dasharray':'8 10','stroke-width':2,opacity:.35}))
      guides.append(el('path',{d:'M500 572Q570 560 573 588',fill:'none',stroke:'var(--accent)','stroke-dasharray':'5 7','stroke-width':3,opacity:.6}))
    }
    if(style==='comparison'){
      const reference=el('g',{transform:'translate(-190 190) scale(.73)',opacity:.55});ghost.append(reference)
      draw(reference,pose(0),'athlete')
      const current=el('g',{transform:'translate(240 190) scale(.73)'});figure.append(current)
      draw(current,pose(p),'athlete')
      guides.append(el('path',{d:'M450 158V785',stroke:'var(--text)','stroke-width':1,opacity:.15}))
      label(guides,210,140,lang==='ar'?'البداية':'START','var(--accent-2)',30)
      label(guides,650,140,lang==='ar'?'الحركة الآن':'MOVEMENT','var(--accent)',30)
      for(const x of [200,640])guides.append(el('path',{d:`M${x-125} 763H${x+125}`,stroke:'var(--text)','stroke-width':2,opacity:.15}))
    }else draw(figure,pose(p),style)
    if(style==='segments'){
      for(const [x,color,text] of [[200,'var(--text)',lang==='ar'?'الجذع':'TORSO'],[450,'var(--accent-2)',lang==='ar'?'الأطراف':'LIMBS'],[700,'var(--accent)',lang==='ar'?'المفاصل':'JOINTS']]){
        circle(guides,[x-65,810],5,color);label(guides,x,820,text,color,24)
      }
    }
    // A quiet progress arc makes the pace visible without obscuring the movement.
    guides.append(el('circle',{cx:450,cy:843,r:13,fill:'none',stroke:'var(--accent)','stroke-width':2,'stroke-dasharray':`${(t/6)*81.68} 81.68`,transform:'rotate(-90 450 843)',opacity:.55}))
  }
  window.renderFrame=renderFrame
  window.addEventListener('message', event => {
    if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='nabd:seek')return
    const t=event.data.time
    if(Number.isFinite(t))renderFrame(t,{data:{style:event.data.style,lang:event.data.lang}})
  })
  renderFrame(1.5,window.GRAPHIC)
})()
