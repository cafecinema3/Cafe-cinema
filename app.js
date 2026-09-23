
const app=document.getElementById('app');
const nav=[...document.querySelectorAll('.nav-item')];
const pages={
 home:()=>`<section><div class="hero-frame home-hero"><img src="assets/home-van.png" alt="کافه سینما - ون کارتونی"></div><div class="home-copy"><h1>Good Taste , Good Mood</h1><p>یه کافه ون جذاب ، با آیتم های خفن و خوشمزه</p></div></section>`,
 menu:()=>`<section><h1 class="page-title">منوی کافه سینما</h1><div class="en-title">OUR MENU</div><div class="menu-grid">
 ${card('همبرگر و چیزبرگر','burgers.png',[['همبرگر','650'],['چیزبرگر','700']])}
 ${card('هات داگ','hotdog.png',[['هات داگ','500'],['هات داگ ویژه','550']])}
 ${card('بشقاب','plates.png',[['بشقاب گریل','800'],['بشقاب سوخاری','850']])}
 ${card('سزار','caesar.png',[['سزار گریل','800'],['سزار سوخاری','800']])}
 ${card('سیب زمینی','fries.png',[['سیب زمینی','500'],['سیب زمینی ویژه','600']])}
 ${card('قهوه','coffee.jpg',[['اسپرسو تک','150'],['امریکانو','180'],['شات اضافه','50'],['سیروپ','50']])}
 ${card('کیک سن سباستین','cake.jpg',[['کیک سن سباستین','280']],true)}
 ${card('چیپس و پنیر','chips.jpg',[['چیپس و پنیر','500']],true)}
 ${card('اسنک','snack.jpg',[['اسنک','200']],true)}
 </div></section>`,
 instagram:()=>`<section class="social"><img class="social-logo" src="assets/logo.png" alt="Cafe Cinema logo"><div class="follow">FOLLOW US</div><h1>کافه سینما در اینستاگرام</h1><p>برای دیدن حال‌وهوای کافه، عکس‌ها و خبرهای جدید،<br>وارد پیج ما شوید.</p><a class="ig-button" href="https://instagram.com/Cinema.cafee_" target="_blank" rel="noopener">ورود به پیج اینستاگرام</a><div class="handle">@Cinema.cafee_</div></section>`,
 about:()=>`<section><img class="about-photo" src="assets/about-van.jpg" alt="عکس واقعی کافه ون"><h1 class="about-heading">درباره کافه سینما</h1>
 ${info('intro','معرفی کافه سینما',`به کافه سینما خوش اومدید ، یه کافه ون جذاب<br>با آیتم های خفن و خوشمزه که در خدمت شما مشتری های عزیزه`)}
 ${info('location','آدرس','تهران ، دار آباد ، انتهای خیابان محبی ، کافه سینما ( ون قرمز ) .')}
 ${info('clock','ساعت کاری','از ساعت 19:00 تا ساعت 03:00 بامداد')}
 <div class="home-copy" style="padding-top:8px"><p>ممنون از اینکه ما رو انتخاب کردید !</p></div></section>`
};
function card(title,img,items,isNew=false){return `<article class="menu-card"><img src="assets/${img}" alt="${title}"><div class="menu-card-body"><div class="menu-card-title"><h3>${title}</h3>${isNew?'<span class="new-badge">NEW</span>':''}</div><div class="menu-list">${items.map(([n,p])=>`<div class="menu-row"><span>${n}</span><span class="price">${p}</span></div>`).join('')}</div></div></article>`}
function icon(name){const s={intro:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.8"/><path d="M12 10.5v5.2M12 7.5h.01"/></svg>',location:'<svg viewBox="0 0 24 24"><path d="M12 21s6-5.4 6-10.1A6 6 0 1 0 6 10.9C6 15.6 12 21 12 21z"/><circle cx="12" cy="10" r="2.1"/></svg>',clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.8"/><path d="M12 7v5l3.2 2"/></svg>'};return s[name]}
function info(ic,title,text){return `<article class="info-card"><div class="info-icon">${icon(ic)}</div><div class="info-body"><h3>${title}</h3><p class="two-line">${text}</p></div></article>`}
function setPage(p){if(!pages[p])p='home';app.innerHTML=pages[p]();nav.forEach(n=>n.classList.toggle('active',n.dataset.page===p));history.replaceState(null,'',`#${p}`);window.scrollTo({top:0,behavior:'instant'})}
nav.forEach(n=>n.addEventListener('click',()=>setPage(n.dataset.page)));
window.addEventListener('popstate',()=>setPage(location.hash.slice(1)||'home'));
setPage(location.hash.slice(1)||'home');
