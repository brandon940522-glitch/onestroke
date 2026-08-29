const products = [
  {id:1,name:'ONE STROKE TEE',category:'top',categoryLabel:'上衣 / T-SHIRT',price:1680,tag:'DROP 001',desc:'左胸主 Logo，右袖波浪線。厚磅純棉、落肩剪裁，從日常到移動都能穿。',details:'240g 厚磅純棉｜寬鬆落肩｜ONE STROKE 線條印刷｜台灣設計',fit:'Relaxed Fit。建議依平常尺寸選擇；喜歡更寬鬆可選大一碼。',shipping:'台灣本島宅配／超商取貨。正式上線後依物流規則計算。',care:'建議反面冷水洗滌，避免長時間烘乾與直接高溫熨燙。'},
  {id:2,name:'LINE HOODIE',category:'top',categoryLabel:'上衣 / HOODIE',price:2980,tag:'DROP 001',desc:'領口 ONE STROKE CLUB，中間直向波浪線。Minimal / Essential 定位。',details:'420g 棉混紡｜落肩｜雙層帽｜袖口羅紋｜LINE GRAPHIC',fit:'Relaxed / Oversized。適合秋冬層次穿搭。',shipping:'台灣本島宅配／超商取貨。正式上線後依物流規則計算。',care:'反面冷水洗，低溫烘乾或自然陰乾。'},
  {id:3,name:'STATEMENT TEE',category:'top',categoryLabel:'上衣 / T-SHIRT',price:1880,tag:'DROP 001',desc:'實心主 Logo，背面大型 ONE STROKE CLUB 直向排列。最強烈的一件。',details:'260g 厚磅棉｜正反面品牌圖像｜寬肩版型｜DROP 001',fit:'Regular Relaxed。版型挺、肩線略落。',shipping:'台灣本島宅配／超商取貨。正式上線後依物流規則計算。',care:'建議反面冷水洗，避免漂白與高溫。'}
];
const futureCategories={bottom:'褲子',outer:'外套',accessory:'配件'};
const productImg='product-sheet.png', officialShirtLogo='shirt-logo-official.png';
const SUPABASE_URL = window.OSC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = window.OSC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabaseReady = SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('YOUR_') && !!window.supabase;
const sb = supabaseReady ? window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;

let cart=JSON.parse(localStorage.getItem('osc_cart')||'[]');
let currentUser=null, profile=null, wishlist=[], orders=[], points=0, coupons=[], notifications=[];
let selectedSize='M',activeProduct=products[0],activeAccountView='overview',authMode='register',registrationDraft=null,appliedCoupon=null,pendingOrder=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function money(n){return 'NT$ '+Number(n||0).toLocaleString('zh-TW')}
function showToast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),2800)}
function updateCounts(){const c=cart.reduce((a,x)=>a+x.qty,0);$('#bagCount').textContent=c;$('#wishCount').textContent=wishlist.length;$('#menuWishCount').textContent=wishlist.length;$('#accountWishCount').textContent=wishlist.length}
function saveCart(){localStorage.setItem('osc_cart',JSON.stringify(cart));updateCounts()}
function renderProducts(filter='all'){
  const list=products.filter(p=>filter==='all'||p.category===filter);
  let html=list.map(p=>`<article class="product-card" data-id="${p.id}"><div class="product-visual"><span class="product-number">0${p.id}</span><button class="product-heart" data-wish="${p.id}" aria-label="收藏 ${p.name}">${wishlist.includes(p.id)?'♥':'♡'}</button><img src="${productImg}" alt="${p.name}"><img class="product-logo-stamp" src="${officialShirtLogo}" alt="ONE STROKE CLUB Logo"><span class="product-tags">${p.tag}</span></div><div class="product-info"><div><h3>${p.name}</h3><p>${p.categoryLabel}</p></div><span class="price">${money(p.price)}</span><div class="product-actions"><button class="detail-btn" data-detail="${p.id}">DETAILS ↗</button><button class="add-btn" data-add="${p.id}">加入購物袋</button></div></div></article>`).join('');
  if(!list.length){const label=futureCategories[filter]||'商品';html=`<div class="coming-soon-panel"><span class="eyebrow">COMING SOON / ${filter.toUpperCase()}</span><h3>${label}系列，<br>敬請期待。</h3><p>OSC 正在準備下一段線。加入社群，第一時間收到新品 DROP 與開賣通知。</p><button class="black-btn" data-join-community>加入 OSC Community →</button></div>`}
  $('#productGrid').innerHTML=html;
}
function openProduct(id){
  activeProduct=products.find(p=>p.id===Number(id))||products[0];
  $('#modalProductName').textContent=activeProduct.name;$('#modalCategory').textContent=activeProduct.categoryLabel;$('#modalProductPrice').textContent=money(activeProduct.price);$('#modalProductDesc').textContent=activeProduct.desc;$('#modalProductImg').src=productImg;$('#modalProductImg').alt=activeProduct.name;
  $('#modalSizes').innerHTML=['S','M','L','XL'].map(s=>`<button class="${s===selectedSize?'active':''}" data-size="${s}">${s}</button>`).join('');
  $$('[data-panel]').forEach(x=>x.classList.remove('open'));$('[data-panel="details"]').textContent=activeProduct.details;$('[data-panel="fit"]').textContent=activeProduct.fit;$('[data-panel="shipping"]').textContent=activeProduct.shipping;$('[data-panel="care"]').textContent=activeProduct.care;
  $('#productModal').classList.add('open');document.body.classList.add('modal-open');
}
function addToCart(p,size=selectedSize){if(!p)return;const found=cart.find(x=>x.id===p.id&&x.size===size);if(found)found.qty++;else cart.push({id:p.id,name:p.name,price:p.price,size,qty:1});saveCart();showToast(`${p.name} / ${size} 已加入購物袋`);renderBag()}
function renderBag(){const box=$('#bagItems');if(!cart.length)box.innerHTML='<p class="empty">購物袋目前是空的。<br>挑一件單品，開始你的下一段移動。</p>';else box.innerHTML=cart.map((x,i)=>`<div class="bag-item"><img src="${productImg}" alt="${x.name}"><div><strong>${x.name}</strong><small>尺寸 ${x.size} · 數量 ${x.qty}</small><small>${money(x.price*x.qty)}</small></div><button class="remove-item" data-remove="${i}">×</button></div>`).join('');$('#bagTotal').textContent=money(cart.reduce((a,x)=>a+x.price*x.qty,0))}
function showDrawer(id){hideDrawers();$(id).classList.add('open');$(id).setAttribute('aria-hidden','false')}
function hideDrawers(){$$('.drawer').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-hidden','true')})}
function toggleMenu(open){const x=$('#menuOverlay');x.classList.toggle('open',open);x.setAttribute('aria-hidden',!open);document.body.classList.toggle('menu-open',open);$('#menuBtn').setAttribute('aria-expanded',open)}
function toggleSearch(open){const x=$('#searchLayer');x.classList.toggle('open',open);x.setAttribute('aria-hidden',!open);if(open)setTimeout(()=>$('#searchInput').focus(),200)}
function openAccount(view='overview'){activeAccountView=view;renderAccount();$('#accountCenter').classList.add('open');$('#accountCenter').setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeAccount(){$('#accountCenter').classList.remove('open');$('#accountCenter').setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function renderAccount(){
  const logged=!!currentUser, name=profile?.name||currentUser?.user_metadata?.name||'OSC MEMBER';
  $('#accountName').textContent=name;$('#accountEmail').textContent=currentUser?.email||'登入／註冊以開啟會員中心';$('#memberPoints').textContent=Number(points||0).toLocaleString('zh-TW');$('#memberLevel').textContent=points>=1000?'OSC PRO':points>=300?'OSC MEMBER+':'OSC MEMBER';
  const welcomeCoupon=coupons.find(c=>c.code==='OSC200');
  $('#couponBox').innerHTML=`<div><strong>NT$200 新會員券</strong><span>序號 OSC200 · 單筆滿 NT$1,000 使用 · ${welcomeCoupon?.used_at?'已使用':'尚未使用'}</span></div><b>${welcomeCoupon?.used_at?'已使用':'$200 OFF'}</b>`;
  const content=$('#accountContent');let html='';
  if(!logged){html=`<div class="account-empty"><span class="eyebrow">JOIN OSC</span><h3>登入後，讓每一次移動都有紀錄。</h3><p>收藏、我的清單、訂單、購物里程與會員優惠，都會集中在你的 OSC。</p><button class="black-btn" id="centerLoginBtn">登入／註冊</button></div>`;content.innerHTML=html;$('#accountTitle').textContent='JOIN OSC';return}
  if(activeAccountView==='wishlist'){
    const items=products.filter(p=>wishlist.includes(p.id));html=`<div class="account-section-title"><span>WISHLIST</span><h3>收藏清單</h3></div>`;
    html+=items.length?`<div class="account-list">${items.map(p=>`<button class="account-item" data-account-product="${p.id}"><span>0${p.id}</span><strong>${p.name}</strong><em>${money(p.price)}</em></button>`).join('')}</div>`:`<div class="account-empty small"><p>還沒有收藏商品。去商品頁看看，找到屬於你的那一件。</p><button class="outline-btn" data-account-shop>探索商品</button></div>`;
  } else if(activeAccountView==='orders'){
    html=`<div class="account-section-title"><span>ORDERS</span><h3>我的訂單</h3></div>`;html+=orders.length?`<div class="account-list">${orders.map(o=>`<div class="account-order"><div><strong>${o.order_no}</strong><span>${new Date(o.created_at).toLocaleDateString('zh-TW')}</span></div><b>${money(o.total)}</b><small>${o.status||'訂單已建立'}</small></div>`).join('')}</div>`:`<div class="account-empty small"><p>目前還沒有訂單。你的下一段移動，從一件喜歡的單品開始。</p><button class="outline-btn" data-account-shop>開始購物</button></div>`;
  } else if(activeAccountView==='data'){
    html=`<div class="account-section-title"><span>PROFILE</span><h3>我的資料</h3></div><form class="profile-form" id="profileForm"><label>姓名<input name="name" value="${profile?.name||''}" required></label><label>Email<input value="${currentUser.email}" disabled></label><label>手機<input name="phone" value="${profile?.phone||''}" placeholder="09xxxxxxxx"></label><label>來源<input value="${profile?.heard_from||'尚未填寫'}" disabled></label><label>興趣<input value="${profile?.interest||'尚未填寫'}" disabled></label><button class="black-btn" type="submit">儲存資料</button></form><button class="logout-btn" id="logoutBtn">登出</button>`;
  } else if(activeAccountView==='points'){
    const next=points<300?300:points<1000?1000:2000;html=`<div class="account-section-title"><span>OSC POINTS</span><h3>購物里程</h3></div><div class="points-hero"><strong>${Number(points).toLocaleString('zh-TW')}</strong><span>PTS</span><p>每消費 NT$1 累積 1 點。未來可兌換會員優惠、限定活動與提早購買資格。</p></div><div class="account-benefits"><span class="eyebrow">NEXT LEVEL</span><h3>${points>=1000?'OSC PRO':points>=300?'OSC MEMBER+':'OSC MEMBER'}</h3><div class="progress"><span style="width:${Math.min(points/next*100,100)}%"></span></div><p>${points>=1000?'你已進入 OSC PRO。':'再累積 '+Math.max(0,next-points)+' 點，即可前進下一級會員回饋。'}</p></div>`;
  } else if(activeAccountView==='coupon'){
    const c=coupons.find(x=>x.code==='OSC200');html=`<div class="account-section-title"><span>COUPONS</span><h3>我的優惠券</h3></div><div class="coupon-large"><span>WELCOME TO OSC</span><strong>NT$200 OFF</strong><p>新會員限定｜單筆消費滿 NT$1,000 可使用一次。</p><b>${c&&!c.used_at?'OSC200 · 可使用':'目前沒有可使用優惠券'}</b></div>`;
  } else if(activeAccountView==='list'){
    html=`<div class="account-section-title"><span>MY LIST</span><h3>我的清單</h3></div><div class="custom-list"><div><strong>夏季移動</strong><span>收藏中的夏季單品與穿搭靈感</span></div><div><strong>OSC RUN</strong><span>活動想穿的單品</span></div><div><strong>下一個 DROP</strong><span>等待公開的願望清單</span></div></div><button class="outline-btn" id="newListBtn">＋ 建立新清單</button>`;
  } else if(activeAccountView==='notifications'){
    html=`<div class="account-section-title"><span>NOTIFICATIONS</span><h3>通知中心</h3></div>${notifications.length?notifications.map(n=>`<div class="notification-item"><span>${n.read_at?'READ':'NEW'}</span><strong>${n.title}</strong><p>${n.body||''}</p></div>`).join(''):'<div class="account-empty small"><p>目前沒有新的通知。</p></div>'}`;
  } else {
    html=`<div class="member-grid"><button data-account-view="points"><small>購物里程</small><strong>${Number(points).toLocaleString('zh-TW')}</strong><span>PTS</span></button><button data-account-view="wishlist"><small>收藏</small><strong>${wishlist.length}</strong><span>ITEMS</span></button><button data-account-view="orders"><small>訂單</small><strong>${orders.length}</strong><span>ORDERS</span></button><button data-account-view="coupon"><small>優惠券</small><strong>${coupons.filter(c=>!c.used_at).length}</strong><span>ACTIVE</span></button></div><div class="account-benefits"><span class="eyebrow">MEMBER BENEFITS</span><h3>${coupons.find(c=>c.code==='OSC200'&&!c.used_at)?'新會員 NT$200 OFF。':'持續移動，解鎖更多回饋。'}</h3><p>消費後每 NT$1 累積 1 點購物里程，會員未來可解鎖限定活動、提早購買與更多回饋。</p><div class="progress"><span style="width:${Math.min(points/10,100)}%"></span></div><small>${Math.max(0,300-points)} 點到 OSC MEMBER+ · <button class="inline-link" data-account-view="coupon">查看優惠券</button></small></div>`;
  }
  content.innerHTML=html;$('#accountTitle').textContent='MY OSC';
}
function authOpen(mode='register'){authMode=mode;registrationDraft=null;$('#authModal').classList.add('open');$('#authModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setAuthMode(mode);goAuthStep(1)}
function authClose(){$('#authModal').classList.remove('open');$('#authModal').setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function goAuthStep(n){$$('[data-auth-panel]').forEach(x=>x.classList.toggle('active',Number(x.dataset.authPanel)===n));$$('[data-step-dot]').forEach(x=>x.classList.toggle('active',Number(x.dataset.stepDot)<=n))}
function setAuthMode(mode){authMode=mode;$$('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));$('#authSubmit').textContent=mode==='login'?'登入 OSC':'下一步 →';$('#authNameField').style.display=mode==='register'?'grid':'none';$('#authHint').textContent=mode==='register'?'建立 OSC 會員，完成偏好問答後送出註冊；Email 驗證完成即可啟用會員優惠。':'使用 Email 與密碼登入 OSC。';$('#authForm').dataset.mode=mode;$('#authTerms').required=mode==='register'}
function passwordStrength(p){let s=0;if(p.length>=8)s++;if(/[A-Z]/.test(p)&&/[a-z]/.test(p))s++;if(/\d/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;return s}
function updatePasswordMeter(){const s=passwordStrength($('#authPassword').value);$('#passwordMeterText').textContent=['太短','基本','中等','良好','很強'][s]||'密碼強度';$('#passwordMeterBar').style.width=(s/4*100)+'%'}
async function doAuth(e){e.preventDefault();if(!supabaseReady){showToast('請先在 index.html 設定 Supabase URL 與 Anon Key。');return}const mode=e.target.dataset.mode,email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value,name=$('#authName').value.trim()||'OSC MEMBER';
  if(mode==='login'){const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){showToast(error.message.includes('Invalid login credentials')?'Email 或密碼不正確。':error.message);return}await hydrateUser(data.user);authClose();openAccount('overview');showToast(`歡迎回來，${profile?.name||name}`);return}
  if(passwordStrength(password)<3){showToast('請設定至少 8 碼，並包含英數字，讓帳號更安全。');return}
  if(!$('#authTerms').checked){showToast('請先同意會員條款與隱私政策。');return}
  registrationDraft={email,password,name};goAuthStep(2)
}
async function completeRegistration(){
  if(!supabaseReady){showToast('請先設定 Supabase。');return}
  if(!registrationDraft)return;
  const heardFrom=$('#heardFrom').value,interest=$('#interest').value,preferredSize=$('#preferredSize').value;
  if(!heardFrom||!interest||!preferredSize){showToast('請完成所有會員問答。');return}
  registrationDraft={...registrationDraft,heardFrom,interest,preferredSize};
  const {data,error}=await sb.auth.signUp({email:registrationDraft.email,password:registrationDraft.password,options:{data:{name:registrationDraft.name,phone:'',heard_from:heardFrom,interest,preferred_size:preferredSize},emailRedirectTo:window.location.href.split('#')[0]}});
  if(error){showToast(error.message.includes('already registered')?'這個 Email 已經註冊，請直接登入。':error.message);return}
  $('#verificationEmail').textContent=registrationDraft.email;$('#verificationStatus').textContent=data.session?'帳號已建立，可以直接進入會員中心。':'驗證信已由 Supabase Auth 寄出，請到信箱完成驗證。';$('#verificationCodeInput').value='';goAuthStep(3);
  if(data.session){await hydrateUser(data.user);showToast('會員建立完成！OSC200 已加入你的帳戶。')}
}
async function verifyRegistration(){
  if(!supabaseReady)return showToast('請先設定 Supabase。');
  const {data,error}=await sb.auth.getSession();
  if(error){showToast(error.message);return}
  if(data.session){await hydrateUser(data.session.user);authClose();openAccount('overview');showToast('Email 驗證完成！歡迎加入 ONE STROKE CLUB。');return}
  showToast('請先點擊驗證信中的連結完成 Email 驗證，再回到此頁。');
}
async function resendWelcome(){if(!supabaseReady||!registrationDraft)return showToast('請重新開始註冊流程。');const {error}=await sb.auth.resend({type:'signup',email:registrationDraft.email,options:{emailRedirectTo:window.location.href.split('#')[0]}});showToast(error?error.message:'驗證信已重新寄出，請檢查你的 Email。')}
async function hydrateUser(user){
  currentUser=user;
  const [{data:p,error:pe},{data:w,error:we},{data:o,error:oe},{data:pts,error:ptse},{data:c,error:ce},{data:n,error:ne}]=await Promise.all([
    sb.from('profiles').select('*').eq('id',user.id).maybeSingle(),
    sb.from('favorites').select('product_id').eq('user_id',user.id),
    sb.from('orders').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    sb.from('points_ledger').select('points').eq('user_id',user.id),
    sb.from('coupons').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    sb.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
  ]);
  if(pe)console.warn(pe);profile=p||null;wishlist=(w||[]).map(x=>Number(x.product_id));orders=o||[];points=(pts||[]).reduce((a,x)=>a+Number(x.points||0),0);coupons=c||[];notifications=n||[];updateCounts();renderProducts($('.filter.active')?.dataset.filter||'all');renderAccount();
}
async function refreshUser(){if(!sb)return;const {data:{session}}=await sb.auth.getSession();if(session?.user)await hydrateUser(session.user);else{currentUser=null;profile=null;wishlist=[];orders=[];points=0;coupons=[];notifications=[];updateCounts();renderProducts()}}
async function logout(){if(sb)await sb.auth.signOut();currentUser=null;profile=null;wishlist=[];orders=[];points=0;coupons=[];notifications=[];closeAccount();updateCounts();renderProducts();showToast('已安全登出 OSC。')}
async function toggleWishlist(id){if(!currentUser){showToast('請先登入會員，才能保存收藏。');authOpen('login');return}const has=wishlist.includes(id);if(has){const {error}=await sb.from('favorites').delete().eq('user_id',currentUser.id).eq('product_id',id);if(error){showToast(error.message);return}wishlist=wishlist.filter(x=>x!==id);showToast('已從收藏移除')}else{const {error}=await sb.from('favorites').insert({user_id:currentUser.id,product_id:id});if(error){showToast(error.message);return}wishlist=[...wishlist,id];showToast('已加入收藏')}updateCounts();renderProducts($('.filter.active')?.dataset.filter||'all')}
async function saveProfile(e){e.preventDefault();if(!currentUser)return;const data=new FormData(e.target);const {data:p,error}=await sb.from('profiles').update({name:data.get('name'),phone:data.get('phone')}).eq('id',currentUser.id).select().single();if(error){showToast(error.message);return}profile=p;renderAccount();showToast('會員資料已更新')}

/* ===== 優惠券：改為從使用者自己的優惠券清單勾選，取代原本手動輸入序號 ===== */
function renderCouponOptions(){
  const subtotal=cart.reduce((a,x)=>a+x.price*x.qty,0);
  const available=coupons.filter(c=>!c.used_at);
  const box=$('#couponList');
  if(!box)return;
  if(!available.length){box.innerHTML='<p class="coupon-empty">目前沒有可使用的優惠券。</p>';return}
  box.innerHTML=available.map(c=>{
    const eligible=subtotal>=c.min_spend;
    const selected=appliedCoupon?.id===c.id;
    return `<button type="button" class="coupon-option ${selected?'selected':''}" data-coupon-id="${c.id}" ${eligible?'':'disabled'}>
      <span><strong>${c.code}</strong><small>折抵 ${money(c.amount)}｜滿 ${money(c.min_spend)} 可用</small></span>
      <span>${selected?'✓ 已選擇':(eligible?'選擇':'未達門檻')}</span>
    </button>`;
  }).join('');
}
function toggleCoupon(id){
  const subtotal=cart.reduce((a,x)=>a+x.price*x.qty,0);
  if(appliedCoupon?.id===id){appliedCoupon=null;$('#couponMsg').textContent='已取消套用優惠券。';renderCheckout();return}
  const c=coupons.find(x=>x.id===id);
  if(!c){showToast('優惠券資料有誤，請重新整理再試。');return}
  if(subtotal<c.min_spend){showToast(`未達使用門檻：單筆需滿 ${money(c.min_spend)}。`);return}
  appliedCoupon={id:c.id,code:c.code,value:Number(c.amount)};
  $('#couponMsg').textContent=`已套用 ${c.code} 優惠券。`;
  renderCheckout();
}
function renderCheckout(){
  const subtotal=cart.reduce((a,x)=>a+x.price*x.qty,0),discount=appliedCoupon?.value||0;
  $('#checkoutSummary').innerHTML=cart.map(x=>`<div><span>${x.name} / ${x.size} × ${x.qty}</span><b>${money(x.price*x.qty)}</b></div>`).join('')+`<div class="summary-line"><span>商品小計</span><b>${money(subtotal)}</b></div>${discount?`<div class="summary-line discount"><span>優惠券 ${appliedCoupon.code}</span><b>− ${money(discount)}</b></div>`:''}`;
  $('#checkoutTotal').textContent=money(Math.max(0,subtotal-discount));
  renderCouponOptions();
}
function resetCheckoutView(){
  $('#checkoutStepSummary').style.display='block';
  $('#checkoutStepPayment').style.display='none';
}
async function openCheckout(){if(!cart.length){showToast('購物袋目前是空的。');return}if(!currentUser){showToast('請先登入會員，再完成結帳。');authOpen('login');return}appliedCoupon=null;pendingOrder=null;$('#couponMsg').textContent='';resetCheckoutView();renderCheckout();$('#checkoutModal').classList.add('open');$('#checkoutModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}

/* ===== 結帳流程拆成兩步：先建立「待付款」訂單，確認付款後才核銷優惠券、發放購物里程、清空購物袋 ===== */
async function placeOrder(){
  if(!currentUser||!sb)return showToast('請先登入會員。');
  const subtotal=cart.reduce((a,x)=>a+x.price*x.qty,0),discount=appliedCoupon?.value||0,finalTotal=Math.max(0,subtotal-discount);
  const orderNo='OSC'+Date.now().toString().slice(-8);
  const {data:order,error}=await sb.from('orders').insert({user_id:currentUser.id,order_no:orderNo,subtotal,discount,total:finalTotal,status:'待付款'}).select().single();
  if(error){showToast(error.message);return}
  const {error:itemError}=await sb.from('order_items').insert(cart.map(x=>({order_id:order.id,product_id:x.id,product_name:x.name,size:x.size,quantity:x.qty,unit_price:x.price})));
  if(itemError){showToast(itemError.message);return}

  pendingOrder=order;
  $('#paymentOrderNo').textContent=order.order_no;
  $('#paymentTotal').textContent=money(order.total);
  $('#checkoutStepSummary').style.display='none';
  $('#checkoutStepPayment').style.display='block';
  await hydrateUser(currentUser);
}
async function confirmPayment(){
  if(!pendingOrder||!currentUser)return;
  const {error:statusError}=await sb.from('orders').update({status:'已付款'}).eq('id',pendingOrder.id).eq('user_id',currentUser.id);
  if(statusError){showToast(statusError.message);return}

  if(appliedCoupon){
    const {error:couponError}=await sb.from('coupons').update({used_at:new Date().toISOString(),used_order_id:pendingOrder.id}).eq('id',appliedCoupon.id).eq('user_id',currentUser.id).is('used_at',null);
    if(couponError){showToast(couponError.message);return}
  }

  const earned=Math.floor(pendingOrder.total);
  if(earned>0){const {error:pointsError}=await sb.from('points_ledger').insert({user_id:currentUser.id,points:earned,source:'order',reference_id:pendingOrder.id,description:`訂單 ${pendingOrder.order_no} 購物里程`});if(pointsError){showToast(pointsError.message);return}}

  const finishedOrderNo=pendingOrder.order_no;
  cart=[];saveCart();
  await hydrateUser(currentUser);
  renderBag();
  $('#checkoutModal').classList.remove('open');
  document.body.classList.remove('modal-open');
  resetCheckoutView();
  showToast(`訂單 ${finishedOrderNo} 已付款完成，累積 ${earned} 點購物里程`);
  pendingOrder=null;appliedCoupon=null;
}
function joinCommunity(){if(currentUser){document.querySelector('#newsletter')?.scrollIntoView({behavior:'smooth'});showToast('已開啟 OSC Community 訂閱入口。')}else authOpen('register')}

renderProducts();renderBag();updateCounts();renderAccount();
$('#productGrid').addEventListener('click',e=>{const wish=e.target.closest('[data-wish]');if(wish){toggleWishlist(Number(wish.dataset.wish));return}const add=e.target.closest('[data-add]');if(add){addToCart(products.find(p=>p.id===Number(add.dataset.add)));return}const detail=e.target.closest('[data-detail]');if(detail)openProduct(detail.dataset.detail);if(e.target.closest('[data-join-community]'))joinCommunity()});
$$('.filter').forEach(b=>b.addEventListener('click',()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderProducts(b.dataset.filter)}));
$('#modalSizes').addEventListener('click',e=>{const b=e.target.closest('[data-size]');if(!b)return;selectedSize=b.dataset.size;$$('#modalSizes [data-size]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});$('#modalAdd').addEventListener('click',()=>addToCart(activeProduct));$$('[data-acc]').forEach(b=>b.addEventListener('click',()=>{$(`[data-panel="${b.dataset.acc}"]`).classList.toggle('open');b.classList.toggle('open')}));$$('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>{$('#productModal').classList.remove('open');document.body.classList.remove('modal-open')}));
$('#bagBtn').addEventListener('click',()=>{renderBag();showDrawer('#bagDrawer')});$('#accountBtn').addEventListener('click',()=>openAccount('overview'));$$('[data-account]').forEach(b=>b.addEventListener('click',()=>{toggleMenu(false);hideDrawers();openAccount('overview')}));$$('[data-wishlist]').forEach(b=>b.addEventListener('click',()=>{toggleMenu(false);hideDrawers();openAccount('wishlist')}));$$('[data-close-drawer]').forEach(b=>b.addEventListener('click',hideDrawers));
$('#menuBtn').addEventListener('click',()=>toggleMenu(!$('#menuOverlay').classList.contains('open')));$('#menuClose').addEventListener('click',()=>toggleMenu(false));$$('[data-close-menu]').forEach(b=>b.addEventListener('click',()=>toggleMenu(false)));$('[data-menu="shop"]').addEventListener('click',()=>toggleMenu(true));
$('#searchBtn').addEventListener('click',()=>toggleSearch(true));$('#searchClose').addEventListener('click',()=>toggleSearch(false));$('#searchInput').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase(),list=q?products.filter(p=>(p.name+p.categoryLabel+p.desc).toLowerCase().includes(q)):[];$('#searchResults').innerHTML=q?(list.length?list.map(p=>`<button class="search-result" data-search-id="${p.id}"><span>${p.name}</span><strong>${money(p.price)}</strong></button>`).join(''):'<p>找不到相符商品。</p>'):'<p>輸入商品、系列或企劃名稱。</p>'});$('#searchResults').addEventListener('click',e=>{const b=e.target.closest('[data-search-id]');if(b){toggleSearch(false);openProduct(b.dataset.searchId)}});
$('#bagItems').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;cart.splice(Number(b.dataset.remove),1);saveCart();renderBag()});$('#checkoutBtn').addEventListener('click',openCheckout);$('#checkoutClose').addEventListener('click',()=>{$('#checkoutModal').classList.remove('open');document.body.classList.remove('modal-open')});$('#couponList').addEventListener('click',e=>{const b=e.target.closest('[data-coupon-id]');if(!b||b.disabled)return;toggleCoupon(b.dataset.couponId)});$('#placeOrderBtn').addEventListener('click',placeOrder);$('#confirmPaymentBtn').addEventListener('click',confirmPayment);
['myListBtn','accountListBtn','footerListBtn'].forEach(id=>{$('#'+id)?.addEventListener('click',()=>{toggleMenu(false);hideDrawers();openAccount('list')})});['ordersBtn','accountOrdersBtn','footerOrdersBtn'].forEach(id=>{$('#'+id)?.addEventListener('click',()=>{toggleMenu(false);hideDrawers();openAccount('orders')})});$('#accountDataBtn')?.addEventListener('click',()=>{hideDrawers();openAccount('data')});$('#notifyBtn')?.addEventListener('click',()=>{toggleMenu(false);openAccount('notifications')});$('#wishlistBtn').addEventListener('click',()=>openAccount('wishlist'));$('#mobileShopBtn').addEventListener('click',()=>openProduct(1));
$('#newsletterForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('#emailInput').value.trim();if(!email)return;if(supabaseReady){const {error}=await sb.from('community_subscribers').upsert({email},{onConflict:'email'});if(error){showToast(error.message);return}}$('#newsletterMsg').textContent='已加入 OSC Community。下一次 DROP，我們會通知你。';showToast('歡迎加入 OSC Community');e.target.reset()});
$('#loginBtn').addEventListener('click',()=>authOpen(currentUser?'login':'register'));$$('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authMode)));$('#authForm').addEventListener('submit',doAuth);$('#authClose').addEventListener('click',authClose);$('#profileQuizForm').addEventListener('submit',e=>{e.preventDefault();completeRegistration()});$('#verifyDemoBtn').addEventListener('click',verifyRegistration);$('#resendWelcomeBtn').addEventListener('click',resendWelcome);$('#authPassword').addEventListener('input',updatePasswordMeter);
$('#accountClose').addEventListener('click',closeAccount);$('#accountContent').addEventListener('click',e=>{const view=e.target.closest('[data-account-view]');if(view){activeAccountView=view.dataset.accountView;renderAccount();return}const prod=e.target.closest('[data-account-product]');if(prod){closeAccount();openProduct(prod.dataset.accountProduct)}if(e.target.closest('[data-account-shop]')){closeAccount();document.querySelector('#shop').scrollIntoView({behavior:'smooth'})}if(e.target.closest('#centerLoginBtn'))authOpen('register');if(e.target.closest('#logoutBtn'))logout();if(e.target.closest('#newListBtn'))showToast('清單功能已建立資料架構，下一階段可做成自訂清單。')});$('#accountNav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;activeAccountView=b.dataset.view;renderAccount()});
document.addEventListener('submit',e=>{if(e.target.id==='profileForm')saveProfile(e)});$('#authModal').addEventListener('click',e=>{if(e.target.id==='authModal')authClose()});$('#accountCenter').addEventListener('click',e=>{if(e.target.id==='accountCenter')closeAccount()});$('#checkoutModal').addEventListener('click',e=>{if(e.target.id==='checkoutModal'){e.currentTarget.classList.remove('open');document.body.classList.remove('modal-open')}});
let lastY=scrollY;addEventListener('scroll',()=>{const h=$('#siteHeader');if(scrollY>120&&scrollY>lastY)h.classList.add('hidden');else h.classList.remove('hidden');lastY=scrollY},{passive:true});addEventListener('mousemove',e=>{const c=$('.cursor-dot');if(c){c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'}});$$('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{hideDrawers();if(a.closest('#menuOverlay'))toggleMenu(false)}));

/* ===== REVEAL ON SCROLL：讓 .reveal 元素（會員方案區塊）滾動到畫面內時淡入顯示 ===== */
function initRevealAnimations(){
  const revealEls = $$('.reveal');
  if(!revealEls.length) return;
  if(!('IntersectionObserver' in window)){
    // 不支援 IntersectionObserver 的舊瀏覽器：直接全部顯示，避免內容永遠隱藏
    revealEls.forEach(el=>el.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.15, rootMargin:'0px 0px -8% 0px'});
  revealEls.forEach(el=>observer.observe(el));
}
initRevealAnimations();

if(supabaseReady){sb.auth.onAuthStateChange(async(event,session)=>{if(session?.user)await hydrateUser(session.user);else if(event==='SIGNED_OUT')await refreshUser()});refreshUser()}else{console.warn('[OSC] Supabase 尚未設定：請填入 OSC_SUPABASE_URL / OSC_SUPABASE_ANON_KEY。會員資料不會再以 localStorage 模擬。')}
