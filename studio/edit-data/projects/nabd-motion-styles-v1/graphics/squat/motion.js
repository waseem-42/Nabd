/* One deterministic rig, shared by Qassa's renderer and Nabd's interactive preview.
 * Angles are illustrative animation parameters, not prescribed joint measurements. */
(() => {
  const query = new URLSearchParams(location.search)
  const ns = 'http://www.w3.org/2000/svg'
  const figure = document.getElementById('figure')
  const guides = document.getElementById('guides')
  const ghost = document.getElementById('ghost')
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
  function draw(group, p, style, opacity = 1) {
    const g=el('g',{opacity}); group.append(g)
    const {ankle,knee,hip,shoulder,head,elbow,wrist}=p
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
    const style=['sculpted','technical','duotone'].includes(data.style ?? query.get('style')) ? (data.style ?? query.get('style')) : 'sculpted'
    const lang=data.lang ?? query.get('lang') ?? 'ar'
    const t=((time%6)+6)%6
    const p=t<.6?0:t<2.5?smooth((t-.6)/1.9):t<3.1?1:t<5.4?1-smooth((t-3.1)/2.3):0
    const phase=t<.6||t>=5.4?0:t<2.5?1:t<3.1?2:3
    document.documentElement.dataset.style=style
    document.getElementById('backdrop').setAttribute('fill',style==='duotone'?'#eeeede':'url(#ambient)')
    const labels=lang==='ar'?['استعداد','نزول بتحكّم','وقفة قصيرة','عودة للأعلى']:['Ready','Lower with control','Brief hold','Return upward']
    const names=lang==='ar'?{sculpted:'01 / مجسّم مبسّط',technical:'02 / رسم تقني',duotone:'03 / رسم بلونين'}:{sculpted:'01 / SCULPTED',technical:'02 / TECHNICAL',duotone:'03 / DUOTONE'}
    document.getElementById('phase').textContent=labels[phase]
    document.getElementById('style-name').textContent=names[style]
    figure.replaceChildren();guides.replaceChildren();ghost.replaceChildren()
    if(style==='technical') {
      draw(ghost,pose(0),'technical',.1)
      guides.append(el('path',{d:'M500 170V790',stroke:'var(--accent-2)','stroke-dasharray':'8 10','stroke-width':2,opacity:.35}))
      guides.append(el('path',{d:'M500 572Q570 560 573 588',fill:'none',stroke:'var(--accent)','stroke-dasharray':'5 7','stroke-width':3,opacity:.6}))
    }
    draw(figure,pose(p),style)
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
