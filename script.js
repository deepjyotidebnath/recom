/* ---------- Demo catalog ---------- */
const P=[
{id:1,name:'Wireless Earbuds',cat:'Audio',price:2499,e:'🎧',pop:95},
{id:2,name:'Earbud Case Cover',cat:'Accessories',price:399,e:'🛡️',pop:60},
{id:3,name:'20W Fast Charger',cat:'Power',price:899,e:'🔌',pop:88},
{id:4,name:'Power Bank 10000mAh',cat:'Power',price:1599,e:'🔋',pop:80},
{id:5,name:'Smartwatch Active',cat:'Wearables',price:3999,e:'⌚',pop:85},
{id:6,name:'Silicone Watch Strap',cat:'Accessories',price:499,e:'🎀',pop:55},
{id:7,name:'Laptop Sleeve 15"',cat:'Laptop',price:999,e:'💼',pop:62},
{id:8,name:'Aluminium Laptop Stand',cat:'Laptop',price:1799,e:'💻',pop:70},
{id:9,name:'Wireless Mouse',cat:'Laptop',price:799,e:'🖱️',pop:90},
{id:10,name:'Mechanical Keyboard',cat:'Laptop',price:3299,e:'⌨️',pop:75},
{id:11,name:'Bluetooth Speaker',cat:'Audio',price:1999,e:'🔊',pop:82},
{id:12,name:'Premium ANC Headphones',cat:'Audio',price:5999,e:'🎵',pop:68}
];
/* Past order data: [productA, productB, times bought together]. Replace with your real order history. */
const PAIRS=[[1,2,70],[1,3,55],[1,11,25],[3,4,60],[3,5,30],[5,6,80],[5,3,45],[7,8,40],[7,9,55],[8,10,45],[9,10,60],[9,3,15],[11,4,30],[12,3,20],[4,1,25]];
const co={};
PAIRS.forEach(([a,b,w])=>{(co[a]=co[a]||{})[b]=(co[a][b]||0)+w;(co[b]=co[b]||{})[a]=(co[b][a]||0)+w});

const FREE_SHIP=2999, BUNDLE_OFF=0.10;
const $=s=>document.querySelector(s), fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const byId=id=>P.find(p=>p.id===id);
const zero=()=>({imp:0,clk:0,add:0,rev:0});
let S={hist:[],variant:null,mode:'auto',stats:{A:zero(),B:zero()},orders:[]};
let cart={}, disc=0;
try{const d=JSON.parse(localStorage.getItem('reco-demo')); if(d) S=Object.assign(S,d)}catch(e){}
if(!S.variant) S.variant=Math.random()<.5?'A':'B';
const save=()=>{try{localStorage.setItem('reco-demo',JSON.stringify(S))}catch(e){}};
const vNow=()=>S.mode==='auto'?S.variant:S.mode;
const imp=n=>{S.stats[vNow()].imp+=n};

/* ---------- Recommendation strategies ---------- */
/* A: best sellers in the same category. B: co-purchase data + browsing affinity. */
function affinity(p){
  return S.hist.reduce((s,id,i)=>{
    const h=byId(id), w=1/(1+i);
    return s+w*((h.cat===p.cat?10:0)+((co[id]||{})[p.id]||0)*.5);
  },0);
}
function related(base,v,n=4){
  const b=byId(base);
  const score=p=>v==='A'?(p.cat===b.cat?1000:0)+p.pop:((co[base]||{})[p.id]||0)*3+affinity(p)+p.pop*.1;
  return P.filter(p=>p.id!==base).sort((x,y)=>score(y)-score(x)).slice(0,n);
}
function personal(v,n=4){
  const pool=S.hist.length&&v==='B'?P.filter(p=>!S.hist.includes(p.id)):P.filter(p=>!S.hist.slice(0,1).includes(p.id));
  return pool.sort((x,y)=>v==='B'&&S.hist.length?(affinity(y)+y.pop*.1)-(affinity(x)+x.pop*.1):y.pop-x.pop).slice(0,n);
}
function bundleOf(id){
  const c=Object.entries(co[id]||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>byId(+k));
  return c.length<2?c.concat(related(id,'B',2).filter(p=>!c.includes(p))).slice(0,2):c;
}
function upsell(id){
  const b=byId(id);
  return P.filter(p=>p.cat===b.cat&&p.price>b.price&&p.price<=b.price*3).sort((x,y)=>x.price-y.price)[0];
}
function crossSell(v,n=3){
  const ids=Object.keys(cart).map(Number);
  const score=p=>v==='A'?p.pop:ids.reduce((s,i)=>s+((co[i]||{})[p.id]||0),0)+p.pop*.1;
  return P.filter(p=>!ids.includes(p.id)).sort((x,y)=>score(y)-score(x)).slice(0,n);
}

/* ---------- Rendering ---------- */
function card(p,rec){
  const r=rec?' data-rec="1"':'';
  return `<article class="card" data-open="${p.id}"${r} tabindex="0" role="button" aria-label="${p.name}">
    <div class="em">${p.e}</div><h3>${p.name}</h3><div class="meta">${p.cat}</div>
    <div class="foot"><b>${fmt(p.price)}</b><button class="btn sm" data-add="${p.id}"${r}>Add</button></div></article>`;
}
function renderHome(){
  const v=vNow(), list=personal(v,4); imp(list.length);
  const seen=S.hist.slice(0,4).map(id=>byId(id).name).join(', ');
  $('#forYou').innerHTML=`<h2>Recommended for you</h2>
    <p class="sub">${S.hist.length?'Based on what you viewed: '+seen+'. ':'No history yet, so these are best sellers. Open a product to personalize. '}
    ${S.hist.length?'<button class="link" id="clr">Clear history</button>':''}</p>
    <div class="grid">${list.map(p=>card(p,1)).join('')}</div>`;
  $('#grid').innerHTML=P.map(p=>card(p,0)).join('');
  $('#badge').textContent='Showing: Strategy '+v;
  $('#mode').value=S.mode;
}
function openProduct(id,rec){
  const v=vNow(), p=byId(id);
  if(rec) S.stats[v].clk++;
  S.hist=[id,...S.hist.filter(x=>x!==id)].slice(0,10);
  const rel=related(id,v,4), bun=bundleOf(id), up=upsell(id);
  imp(rel.length+(up?1:0)+bun.length);
  const sum=p.price+bun.reduce((s,x)=>s+x.price,0);
  $('#dlg').dataset.base=id;
  $('#dlg').innerHTML=`<div class="dhead"><div><div class="big">${p.e}</div><h2>${p.name}</h2>
    <p class="meta">${p.cat}</p><p class="tot">${fmt(p.price)}</p></div>
    <button class="btn alt sm" data-close>Close</button></div>
    <div class="acts" style="margin-top:12px"><button class="btn" data-add="${id}">Add to cart</button></div>
    ${up?`<div class="box"><span class="tagc">Upsell</span><h3>Upgrade to ${up.name}</h3>
      <p class="meta">${up.e} Only ${fmt(up.price-p.price)} more than this item.</p>
      <button class="btn sm" data-add="${up.id}" data-rec="1" style="margin-top:8px">Add upgrade (${fmt(up.price)})</button></div>`:''}
    <div class="box"><span class="tagc">Frequently bought together</span><h3>Bundle and save ${BUNDLE_OFF*100}%</h3>
      <div class="bl"><label><input type="checkbox" checked disabled><span>${p.e} ${p.name}</span><b>${fmt(p.price)}</b></label>
      ${bun.map(x=>`<label><input type="checkbox" class="bchk" value="${x.id}" checked><span>${x.e} ${x.name}</span><b>${fmt(x.price)}</b></label>`).join('')}</div>
      <p class="tot">Bundle total: <span id="bTot">${fmt(sum*(1-BUNDLE_OFF))}</span></p>
      <button class="btn" id="addBundle">Add bundle to cart</button></div>
    <h3>Customers also bought</h3><div class="grid" style="margin-top:10px">${rel.map(x=>card(x,1)).join('')}</div>`;
  $('#cartDlg').close();
  if(!$('#dlg').open) $('#dlg').showModal();
  $('#dlg').scrollTop=0;
  save(); renderHome(); renderAB();
}
function bundleCalc(){
  const ids=[+$('#dlg').dataset.base,...[...document.querySelectorAll('.bchk:checked')].map(c=>+c.value)];
  const sum=ids.reduce((s,i)=>s+byId(i).price,0);
  return {ids,sum,total:ids.length>1?sum*(1-BUNDLE_OFF):sum};
}
function addToCart(id,rec){
  cart[id]=(cart[id]||0)+1;
  if(rec){S.stats[vNow()].add++;S.stats[vNow()].rev+=byId(id).price}
  updateCart(); toast(byId(id).name+' added to cart'); save(); renderAB();
}
function updateCart(){
  $('#cnt').textContent=Object.values(cart).reduce((a,b)=>a+b,0);
  if($('#cartDlg').open) renderCart();
}
function cartSub(){return Object.entries(cart).reduce((s,[i,q])=>s+byId(+i).price*q,0)}
function renderCart(){
  const ids=Object.keys(cart), sub=cartSub(), total=sub-disc, v=vNow();
  const pct=Math.min(100,total/FREE_SHIP*100), cs=ids.length?crossSell(v):[];
  if(cs.length) imp(cs.length);
  $('#cartDlg').innerHTML=`<div class="dhead"><h2>Your cart</h2><button class="btn alt sm" data-close>Close</button></div>
  ${ids.length?`${ids.map(i=>`<div class="row"><span>${byId(+i).e} ${byId(+i).name} × ${cart[i]}</span>
    <span>${fmt(byId(+i).price*cart[i])} <button class="link" data-rm="${i}">Remove</button></span></div>`).join('')}
    <p class="sub" style="margin-top:14px">${total>=FREE_SHIP?'You unlocked free shipping.':'Add '+fmt(FREE_SHIP-total)+' more for free shipping.'}</p>
    <div class="bar ship"><i style="width:${pct}%"></i></div>
    ${disc?`<div class="row"><span>Bundle discount</span><span>−${fmt(disc)}</span></div>`:''}
    <div class="row"><span class="tot">Total</span><span class="tot">${fmt(total)}</span></div>
    <div class="box"><span class="tagc">Cross-sell</span><h3>Complete your order</h3>
      <div class="grid">${cs.map(p=>card(p,1)).join('')}</div></div>
    <button class="btn" id="order">Place order (demo)</button>`:'<p class="sub" style="margin-top:14px">Your cart is empty. Add a product to see cross-sell suggestions.</p>'}`;
}
function renderAB(){
  const names={A:'Best sellers in the same category',B:'AI: co-purchase + browsing affinity'};
  const ctr=k=>S.stats[k].imp?S.stats[k].clk/S.stats[k].imp*100:0;
  const ready=S.stats.A.imp>=50&&S.stats.B.imp>=50;
  const win=ready?(ctr('A')>ctr('B')?'A':'B'):null;
  const aov=S.orders.length?S.orders.reduce((a,b)=>a+b,0)/S.orders.length:0;
  const block=k=>{const s=S.stats[k];return `<div class="abc${win===k?' win':''}"><h3>Strategy ${k}${win===k?' (leading)':''}</h3>
    <p class="meta">${names[k]}</p><div class="bar"><i style="width:${Math.min(100,ctr(k)*4)}%"></i></div>
    <dl><dt>Impressions</dt><dd>${s.imp}</dd><dt>Clicks</dt><dd>${s.clk}</dd><dt>Click rate</dt><dd>${ctr(k).toFixed(1)}%</dd>
    <dt>Adds from recommendations</dt><dd>${s.add}</dd><dt>Revenue from recommendations</dt><dd>${fmt(s.rev)}</dd></dl></div>`};
  $('#ab').innerHTML=`<h2>A/B test: recommendation strategies</h2>
    <p class="sub">Visitors are split between two strategies. Compare click rates to pick a winner.</p>
    <div class="abg">${block('A')}${block('B')}</div>
    <p class="note">${win?`Strategy ${win} leads by ${Math.abs(ctr('A')-ctr('B')).toFixed(1)} points in click rate.`:'Not enough data yet. Each strategy needs 50 impressions. Click Simulate to add test traffic.'}</p>
    <p class="sub">Orders placed: ${S.orders.length}. Average order value: ${S.orders.length?fmt(aov):'no orders yet'}.</p>
    <div class="acts"><button class="btn" id="sim">Simulate 300 visitors</button><button class="btn alt" id="rst">Reset results</button></div>`;
}
function simulate(){
  for(let i=0;i<300;i++){
    const v=Math.random()<.5?'A':'B', base=P[Math.random()*P.length|0].id, st=S.stats[v];
    related(base,v,4).forEach(it=>{
      st.imp++;
      const pr=.03+Math.min(((co[base]||{})[it.id]||0)/100,.6)*.5;
      if(Math.random()<pr){st.clk++; if(Math.random()<.35){st.add++;st.rev+=it.price}}
    });
  }
  save(); renderAB(); toast('Simulated 300 visitors (demo data)');
}
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1800)}

/* ---------- Events ---------- */
document.addEventListener('click',e=>{
  const t=e.target;
  const add=t.closest('[data-add]');
  if(add){e.stopPropagation();addToCart(+add.dataset.add,!!add.dataset.rec);return}
  const op=t.closest('[data-open]');
  if(op){openProduct(+op.dataset.open,!!op.dataset.rec);return}
  if(t.closest('[data-close]')){t.closest('dialog').close();return}
  const rm=t.closest('[data-rm]');
  if(rm){delete cart[rm.dataset.rm];if(!Object.keys(cart).length)disc=0;updateCart();return}
  if(t.id==='cartBtn'){$('#dlg').close();renderCart();$('#cartDlg').showModal()}
  if(t.id==='addBundle'){
    const b=bundleCalc(); b.ids.forEach(i=>cart[i]=(cart[i]||0)+1);
    if(b.ids.length>1){disc+=b.sum-b.total;S.stats[vNow()].add++;S.stats[vNow()].rev+=b.total}
    updateCart();toast('Bundle added to cart');save();renderAB();
  }
  if(t.id==='order'){
    S.orders.push(cartSub()-disc);cart={};disc=0;updateCart();$('#cartDlg').close();
    toast('Order placed (demo)');save();renderAB();
  }
  if(t.id==='clr'){S.hist=[];save();renderHome()}
  if(t.id==='sim') simulate();
  if(t.id==='rst'){S.stats={A:zero(),B:zero()};S.orders=[];save();renderAB()}
});
document.addEventListener('change',e=>{
  if(e.target.classList.contains('bchk')) $('#bTot').textContent=fmt(bundleCalc().total);
  if(e.target.id==='mode'){S.mode=e.target.value;save();renderHome()}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches('.card')) openProduct(+e.target.dataset.open,!!e.target.dataset.rec);
});

renderHome(); renderAB();
