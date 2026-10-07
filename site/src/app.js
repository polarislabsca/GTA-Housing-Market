// GTA Housing Market site: page rendering (shared by the build and the browser) and interactive behaviour.
const ZH={"All TRREB Areas":"大多伦多地区全域","Adjala-Tosorontio":"阿德加拉-托索龙蒂奥","Ajax":"阿贾克斯","Aurora":"奥罗拉","Bradford":"布拉德福德","Bradford West Gwillimbury":"布拉德福德西格威利姆伯里","Brampton":"布兰普顿","Brock":"布洛克","Burlington":"伯灵顿","Caledon":"卡里登","City of Toronto":"多伦多市","Clarington":"克拉灵顿","Dufferin County":"达弗林县","Durham Region":"杜伦区","East Gwillimbury":"东格威利姆伯里","Essa":"埃萨","Georgina":"乔治娜","Halton Hills":"荷顿山","Halton Region":"荷顿区","Innisfil":"因尼斯菲尔","King":"国王镇","Markham":"万锦","Milton":"米尔顿","Mississauga":"密西沙加","New Tecumseth":"新蒂康赛","Newmarket":"新市镇","Oakville":"奥克维尔","Orangeville":"奥兰治维尔","Oshawa":"奥沙瓦","Peel Region":"皮尔区","Pickering":"皮克灵","Richmond Hill":"烈治文山","Scugog":"斯库格","Simcoe County":"西姆科县","Stouffville":"斯托夫维尔","Toronto Central":"多伦多中区","Toronto East":"多伦多东区","Toronto West":"多伦多西区","Uxbridge":"阿克斯桥","Vaughan":"旺市","Whitby":"惠特比","Whitchurch-Stouffville":"惠洽-斯托夫维尔","York Region":"约克区"};
const TYPE_EN={"All":"All home types","Detached":"Detached","Semi-Detached":"Semi-Detached","Townhouse":"Townhouse","Condo Townhouse":"Condo Townhouse","Condo Apartment":"Condo Apartment"};
const TYPE_ZH={"All":"所有房型","Detached":"独立屋","Semi-Detached":"半独立屋","Townhouse":"镇屋","Condo Townhouse":"共管镇屋","Condo Apartment":"共管公寓"};
const TYPE_PLURAL={"All":"homes","Detached":"detached homes","Semi-Detached":"semi-detached homes","Townhouse":"townhouses","Condo Townhouse":"condo townhouses","Condo Apartment":"condo apartments"};
const TYPE_ONE={"All":"home","Detached":"detached home","Semi-Detached":"semi-detached home","Townhouse":"townhouse","Condo Townhouse":"condo townhouse","Condo Apartment":"condo apartment"};
const TSLUG=["all-types","detached","semi-detached","townhouse","condo-townhouse","condo-apartment"];
const REGIONS=[
 {agg:"York Region",cities:["Aurora","East Gwillimbury","Georgina","King","Markham","Newmarket","Richmond Hill","Stouffville","Vaughan","Whitchurch-Stouffville"]},
 {agg:"Peel Region",cities:["Brampton","Caledon","Mississauga"]},
 {agg:"Durham Region",cities:["Ajax","Brock","Clarington","Oshawa","Pickering","Scugog","Uxbridge","Whitby"]},
 {agg:"Halton Region",cities:["Burlington","Halton Hills","Milton","Oakville"]},
 {agg:"Simcoe County",cities:["Adjala-Tosorontio","Bradford","Bradford West Gwillimbury","Essa","Innisfil","New Tecumseth"]},
 {agg:"Dufferin County",cities:["Orangeville"]}];
const AGG=new Set(["All TRREB Areas","York Region","Peel Region","Durham Region","Halton Region","Simcoe County","Dufferin County","Toronto Central","Toronto East","Toronto West","City of Toronto"]);
const POPULAR=["City of Toronto","Markham","Richmond Hill","Vaughan","Mississauga","Oakville","Brampton","Toronto C01"];

const MON_EN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MON_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];

const S={en:{
 nav:["Home","Explore","Areas","Letters","Where can I afford?","Compare"],legacy:"Legacy dashboard",
 brand:"GTA Housing Market",sub:"TRREB monthly market intelligence",badge:"Built by Polaris Labs",proto:"Sample site",addr:"Page address on the real site:",
 median:"Median price",avg:"Average price",sales:"Sales",dom:"Days on market",slr:"Sale-to-list",moi:"Months of inventory",active:"Homes for sale",
 yoy:"y/y",seller:"Seller's market",balanced:"Balanced",buyer:"Buyer's market",flag:"Unusual jump, check data",
 heroTitle:"Know the market before you make your move.",heroLede:"Pick an area and a home type. You'll see what homes cost, whether prices are rising, how competitive it is, and what it really costs to buy, updated every month from TRREB data.",
 seeReport:"See the report",gtaNow:"GTA this month",readLetter:"Read the market letter",
 homeCards:[["Where can I afford?","Set a budget and see which areas are in reach.","Try the calculator"],["Compare areas","Put up to four areas side by side.","Compare now"],["Explore the market","Trends, seasonality, and leaderboards.","Open Explore"]],
 movers:"Biggest movers",moversNote:"Median price change from a year ago, areas with 30+ sales.",popular:"Popular areas",
 exploreTitle:"Explore",exploreLede:"Trends across every area and home type. The original dashboard stays available as the legacy dashboard, unchanged.",openLegacy:"Open the legacy dashboard",
 unitsTitle:"Units sold by month",seasonNote:"Units sold each month, one line per year. Is this month weak, or just a normal month for the season?",
 priceTitle:"Median and average price",priceNote:"Median is the middle sale price; average is pulled up by expensive sales. A widening gap means more high-end sales.",priceAllNote:"All home types shows the average price only. TRREB publishes medians per home type.",
 range1:"1 year",range2:"2 years",range5:"5 years",rangeAll:"Since 2021",
 lbTitle:"Leaderboard",lbYoy:"Price change y/y",lbDom:"Fastest selling",lbMoi:"Tightest supply",lbNote:"Rankings use one home type at a time, so a change in the mix of homes sold doesn't distort them.",
 area:"Area",type:"Home type",areasTitle:"Areas",areasLede:"Every TRREB area with its latest price and market state. Pick one for its full buyer's report.",search:"Search areas",
 allNote:"All home types uses the sales-weighted average price, since TRREB publishes medians per home type.",
 q1:"What does a home cost here?",q2:"Are prices going up or down?",q3:"How competitive is it?",q4:"How much choice is there?",q5:"What will it really cost me?",q6:"Is there a cheaper option nearby?",q7:"When is the best time to buy?",
 otherTypes:"Other home types here",lastYear:"last year",
 oneYear:"1-year change",threeMonth:"Last 3 months vs a year ago",fromPeak:"From the peak",
 heat:{hot:"Very competitive",warm:"Competitive",even:"Balanced",cool:"Buyer-friendly"},
 price:"Purchase price",downPay:"Down payment",rate:"Mortgage rate",amort:"Amortization",years:"years",ftb:"First-time buyer",
 monthly:"Monthly payment",stress:"Stress-test payment",cash:"Cash needed to close",
 cDown:"Down payment",cOnt:"Ontario land transfer tax",cTor:"Toronto land transfer tax",cReb:"First-time buyer rebates",cPst:"PST on mortgage insurance",cLegal:"Legal and closing costs (estimate)",cIns:"Mortgage insurance (added to the mortgage)",cTotal:"Total cash needed",
 costNote:"Estimate only, not financial advice. Uses Ontario and City of Toronto land transfer tax brackets and first-time buyer rebates, CMHC premiums, and semi-annual compounding. Confirm with your lawyer and lender.",
 belowMin:"This down payment is below the legal minimum for this price.",errRange:(a,b)=>`Enter a value from ${a} to ${b}.`,
 cheaperNone:"This is already one of the lowest-priced areas around it.",vsHere:"vs here",
 bestNote:"Average sale-to-list ratio by calendar month since 2021. Lower means more room to negotiate.",
 shareTitle:"Share image",shareNote:"Generated for every area, home type, and month, sized for WeChat, LinkedIn, and X.",
 compareLink:"Compare with other areas",
 lettersTitle:"Market letters",lettersLede:"One letter a month since January 2021, covering every home type.",
 prev:"Previous",next:"Next",byType:"By home type",watch:"What to watch",
 tour:{link:"Take the tour",welcomeHead:"Welcome to GTA Housing Market",chooseLang:"Choose your language for a 30-second tour.",welcomeTitle:"New here?",welcomeText:"Take a 30-second tour of what you can do on this site.",start:"Take the tour",later:"Maybe later",back:"Back",next:"Next",skip:"Skip tour",done:"Done",of:(a,b)=>`${a} of ${b}`,steps:[
  ["Start with an area","Pick any of 78 TRREB areas and a home type. You'll get a buyer's report: what homes cost, where prices are heading, how competitive it is, how much choice there is, the real cost to buy, cheaper areas nearby, and the best time of year to buy."],
  ["Read the monthly letter","Every month we explain what changed in plain language. Share it as a poster with a QR code, or copy the summary into a message."],
  ["See what you can afford","Enter a budget, down payment, and mortgage rate to see which areas and home types are within reach, with the monthly payment for each."],
  ["Compare areas","Put up to four areas side by side: prices, speed of sale, supply, and competition."],
  ["Explore the market","Trends, seasonality, and leaderboards across every area. The original dashboard is still here too, under Legacy dashboard."],
  ["中文 / English","Switch languages anytime. In Chinese, area names show in both languages."]]},
 shareLetter:"Share this letter",shareLede:"Share this month's numbers or our written summary as a poster with a QR code that opens the full letter, or copy the summary as text.",makePoster:"Numbers poster",makeSummary:"Summary poster",copySummary:"Copy summary text",copied:"Copied. Paste it into WeChat, WhatsApp, or an email.",copyFallback:"Select the text below and copy it.",readFull:"Read the full letter",downloadPoster:"Download image",posterHow:["Download the poster, then share it on WeChat, WhatsApp, Instagram, or anywhere else.","Anyone who scans the QR code lands on this letter."],saveFailed:"Couldn't save the image. Please try again.",scanToRead:"Scan to read the full letter",posterKpi:["Average price","Homes sold","Days on market","Inventory (months)"],posterTag:"Free monthly GTA housing data for every area and home type, from TRREB reports.",
 affTitle:"Where can I afford?",affLede:"Enter a price, down payment, and rate. See which areas and home types have a median price within reach, and the monthly payment for each.",
 budget:"Max price",areaF:"Area",allAreas:"All areas",allTypes:"All types",minDown:"Minimum down payment",fit:"area and home type medians fit your budget",
 insured:"With less than 20% down the mortgage is insured. Insured mortgages max out at 25 years, or 30 for first-time buyers and new builds.",showAll:n=>`Show all ${n}`,
 affNote:"Calculator only, not financial advice. Stress test uses the higher of your rate plus 2% or 5.25%.",
 cmpTitle:"Compare areas",cmpLede:"Pick up to four areas and a home type.",none:"None",
 footer:"Source: TRREB Market Watch monthly reports. Data through {month}. Market state uses months of inventory: under 2.5 is a seller's market, over 5 is a buyer's market.",
},zh:{
 nav:["首页","深度分析","地区","月度市场报告","我能买得起哪里？","地区对比"],legacy:"旧版仪表板",
 brand:"大多伦多房地产市场",sub:"TRREB 月度市场数据",badge:"由 Polaris Labs 打造",proto:"示例网站",addr:"正式网站中的页面地址：",
 median:"中位价",avg:"均价",sales:"成交量",dom:"平均在售天数",slr:"成交价/挂牌价",moi:"库存月数",active:"在售房源",
 yoy:"同比",seller:"卖方市场",balanced:"平衡市场",buyer:"买方市场",flag:"异常波动，需核实数据",
 heroTitle:"出手之前，先看懂市场。",heroLede:"选择地区和房型，即可了解房价水平、涨跌趋势、竞争程度，以及买房的真实成本。数据每月根据 TRREB 报告更新。",
 seeReport:"查看报告",gtaNow:"本月大多伦多",readLetter:"阅读月度市场报告",
 homeCards:[["我能买得起哪里？","设定预算，看看哪些地区在可承受范围内。","试试计算器"],["地区对比","最多四个地区并排比较。","开始对比"],["深度分析","趋势、季节性与排行榜。","打开深度分析"]],
 movers:"涨跌榜",moversNote:"中位价同比变化，仅含成交 30 套以上的地区。",popular:"热门地区",
 exploreTitle:"深度分析",exploreLede:"覆盖所有地区和房型的趋势。原有仪表板作为旧版保留，内容不变。",openLegacy:"打开旧版仪表板",
 unitsTitle:"每月成交套数",seasonNote:"每年一条线，对比每月成交套数：本月是真的疲软，还是季节性正常？",
 priceTitle:"中位价与均价",priceNote:"中位价是成交价的中间值；均价会被高价成交拉高。两者差距扩大，说明高端成交增多。",priceAllNote:"「所有房型」只显示均价，TRREB 的中位价按房型分别公布。",
 range1:"近一年",range2:"近两年",range5:"近五年",rangeAll:"2021 年至今",
 lbTitle:"排行榜",lbYoy:"价格同比",lbDom:"成交最快",lbMoi:"供应最紧",lbNote:"排行榜按单一房型计算，避免成交房型结构变化造成误导。",
 area:"地区",type:"房型",areasTitle:"地区",areasLede:"每个 TRREB 地区的最新价格与市场状态。点击查看完整的购房报告。",search:"搜索地区",
 allNote:"「所有房型」使用按成交量加权的均价，因为 TRREB 的中位价按房型分别公布。",
 q1:"这里的房子多少钱？",q2:"房价在涨还是在跌？",q3:"竞争激烈吗？",q4:"可选房源多吗？",q5:"买下来实际要花多少钱？",q6:"附近有更便宜的选择吗？",q7:"什么时候买最划算？",
 otherTypes:"本地区其他房型",lastYear:"去年",
 oneYear:"一年变化",threeMonth:"近三个月对比去年同期",fromPeak:"距最高点",
 heat:{hot:"竞争非常激烈",warm:"竞争较激烈",even:"供需平衡",cool:"对买家有利"},
 price:"购房价格",downPay:"首付",rate:"贷款利率",amort:"还款年限",years:"年",ftb:"首次购房",
 monthly:"每月还款",stress:"压力测试还款额",cash:"交房所需现金",
 cDown:"首付",cOnt:"安省土地转让税",cTor:"多伦多市土地转让税",cReb:"首次购房退税",cPst:"房贷保险的省销售税",cLegal:"律师及其他交割费用（估算）",cIns:"房贷保险（计入贷款）",cTotal:"所需现金合计",
 costNote:"仅为估算，不构成财务建议。按安省及多伦多市土地转让税税率与首次购房退税、CMHC 保险费率，以及每半年复利计算。请向律师和贷款机构确认。",
 belowMin:"该首付低于此房价的法定最低首付。",errRange:(a,b)=>`请输入 ${a} 至 ${b} 之间的数值。`,
 cheaperNone:"这里已经是周边价格最低的地区之一。",vsHere:"对比本区",
 bestNote:"2021 年以来各月份的平均成交价/挂牌价比。数值越低，议价空间越大。",
 shareTitle:"分享图片",shareNote:"每个地区、房型、月份自动生成，适配微信、领英和 X。",
 compareLink:"与其他地区对比",
 lettersTitle:"月度市场报告",lettersLede:"自 2021 年 1 月起每月一篇，涵盖所有房型。",
 prev:"上一篇",next:"下一篇",byType:"分房型数据",watch:"值得关注",
 tour:{link:"网站导览",welcomeHead:"欢迎来到大多伦多房地产市场",chooseLang:"请选择语言，开始 30 秒导览。",welcomeTitle:"第一次来？",welcomeText:"花 30 秒了解一下这个网站能帮您做什么。",start:"开始导览",later:"以后再说",back:"上一步",next:"下一步",skip:"跳过导览",done:"完成",of:(a,b)=>`${a} / ${b}`,steps:[
  ["从地区开始","选择 78 个 TRREB 地区中的任意一个和房型，即可获得一份购房报告：房价水平、价格走向、竞争程度、可选房源、买房的真实成本、附近更便宜的地区，以及一年中最适合买房的时间。"],
  ["阅读月度市场报告","每月用通俗的语言解读市场变化。可生成带二维码的海报分享，或复制文字摘要发给朋友。"],
  ["看看能买得起哪里","输入预算、首付和贷款利率，即可看到哪些地区和房型在可承受范围内，以及各自的每月还款额。"],
  ["地区对比","最多四个地区并排比较：价格、成交速度、供应量和竞争程度。"],
  ["深度分析","覆盖所有地区的趋势、季节性与排行榜。原有仪表板也保留在「旧版仪表板」中。"],
  ["中文 / English","随时切换语言。中文模式下，地区名称以中英双语显示。"]]},
 shareLetter:"分享本期报告",shareLede:"把本月数据或我们的文字摘要生成带二维码的海报（扫码即可打开完整报告），或直接复制摘要文字分享。",makePoster:"数据海报",makeSummary:"摘要海报",copySummary:"复制摘要文字",copied:"已复制，可粘贴到微信、WhatsApp 或邮件。",copyFallback:"请选中下方文字并复制。",readFull:"阅读完整报告",downloadPoster:"下载图片",posterHow:["下载海报后，即可分享到微信、WhatsApp、小红书等任何平台。","扫描二维码即可打开本期报告。"],saveFailed:"无法保存图片，请重试。",scanToRead:"扫码阅读完整报告",posterKpi:["平均成交价","成交套数","平均在售天数","库存月数"],posterTag:"免费的大多伦多月度房市数据，涵盖每个地区和房型，来源于 TRREB 报告。",
 affTitle:"我能买得起哪里？",affLede:"输入房价、首付和利率，看看哪些地区和房型的中位价在可承受范围内，以及各自的每月还款额。",
 budget:"最高房价",areaF:"地区",allAreas:"所有地区",allTypes:"全部房型",minDown:"最低首付",fit:"个地区房型中位价在预算内",
 insured:"首付低于 20% 需购买房贷保险。保险房贷最长 25 年，首次购房者或新房可达 30 年。",showAll:n=>`显示全部 ${n} 条`,
 affNote:"仅为计算工具，不构成财务建议。压力测试利率取「您的利率 + 2%」与 5.25% 中较高者。",
 cmpTitle:"地区对比",cmpLede:"最多选择四个地区和一种房型。",none:"无",
 footer:"数据来源：TRREB Market Watch 月度报告，更新至 {month}。市场状态依据库存月数：低于 2.5 为卖方市场，高于 5 为买方市场。",
}};

let D=null,lang="en",charts=[],TREE=[],ROUTE="home",BASE="/GTA-Housing-Market/",app=null;
const SITE_ORIGIN="https://polarislabsca.github.io";
const T=()=>S[lang];
const L=()=>D.months.length-1;
const ser=(c,ti)=>D.d[c+"|"+D.types[ti]]||null;
const slug=c=>c.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const BYSLUG={};
const $=id=>document.getElementById(id);
const cn=c=>lang==="zh"&&ZH[c]?`${c} ${ZH[c]}`:c;
const tn=ti=>(lang==="zh"?TYPE_ZH:TYPE_EN)[D.types[ti]];
const pl=ti=>ti===0?T().avg:T().median;
const mlabel=i=>{const[y,m]=D.months[i].split("-");return lang==="zh"?`${y}年${+m}月`:`${MON_EN[m-1]} ${y}`};
const mfull=i=>{const[y,m]=D.months[i].split("-");return lang==="zh"?`${y}年${+m}月`:`${MON_FULL[m-1]} ${y}`};
const mname=i=>{const m=+D.months[i].slice(5);return lang==="zh"?`${m}月`:MON_FULL[m-1]};
const monLabels=()=>[...Array(12).keys()].map(k=>lang==="zh"?`${k+1}月`:MON_EN[k]);
const price=k=>{if(k==null)return"—";if(lang==="zh")return"$"+(k/10).toFixed(1)+"万";return k>=1000?"$"+(k/1000).toFixed(2)+"M":"$"+Math.round(k)+"K"};
const dollars=v=>(v<0?"-":"")+"$"+Math.round(Math.abs(v)).toLocaleString("en-CA");
const yoy=(a,i)=>a&&a[i]!=null&&a[i-12]!=null&&a[i-12]?(a[i]/a[i-12]-1)*100:null;
const pct=(v,dig=1)=>v==null?"—":(v>0?"+":"")+v.toFixed(dig)+"%";
const apct=v=>Math.abs(v).toFixed(1)+"%";
const dcls=v=>v==null||Math.abs(v)<0.5?"flat":v>0?"up":"down";
const stateOf=m=>m==null?null:m<2.5?"seller":m>5?"buyer":"balanced";
const chip=m=>{const s=stateOf(m);return s?`<span class="chip ${s}"><span class="dot"></span>${T()[s]}</span>`:""};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const h=r=>BASE+(lang==="zh"?"zh/":"")+pathFor(r);
const langHref=()=>BASE+(lang==="zh"?"":"zh/")+pathFor(ROUTE);
const seg=(id,items,pressed)=>`<div class="seg" id="${id}">${items.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${pressed(v)}">${l}</button>`).join("")}</div>`;
const typeSeg=(id,cur,noAll)=>seg(id,D.types.map((x,k)=>[k,tn(k)]).filter(x=>!noAll||x[0]>0),v=>+v===cur);
const typeSelect=(id,cur,noAll)=>`<select id="${id}" aria-label="${T().type}">${D.types.map((x,k)=>noAll&&k===0?"":`<option value="${k}"${k===cur?" selected":""}>${tn(k)}</option>`).join("")}</select>`;
function onSeg(id,fn){const el=$(id);el.onclick=e=>{const b=e.target.closest("button");if(!b)return;el.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));fn(b)}}
const avgOf=(a,from,to)=>{const v=a.slice(from,to+1).filter(x=>x!=null);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};

function buildTree(){
  const t=[{c:"All TRREB Areas",d:0},{c:"City of Toronto",d:0}];
  for(const [z,p] of [["Toronto Central","C"],["Toronto East","E"],["Toronto West","W"]]){t.push({c:z,d:1});D.cities.filter(c=>new RegExp(`^Toronto ${p}\\d\\d$`).test(c)).forEach(c=>t.push({c,d:2}))}
  for(const r of REGIONS){t.push({c:r.agg,d:0});r.cities.forEach(c=>t.push({c,d:1}))}
  const seen=new Set(t.map(x=>x.c));D.cities.forEach(c=>{if(!seen.has(c))t.push({c,d:0})});
  return t.filter(x=>D.types.some((_,k)=>ser(x.c,k)));
}
const depth=c=>(TREE.find(x=>x.c===c)||{d:0}).d;
const descendants=c=>{const i=TREE.findIndex(x=>x.c===c);if(i<0)return[];const out=[],d=TREE[i].d;for(let k=i+1;k<TREE.length&&TREE[k].d>d;k++)out.push(TREE[k].c);return out};
const parentOf=c=>{const i=TREE.findIndex(x=>x.c===c);if(i<0)return null;for(let k=i-1;k>=0;k--)if(TREE[k].d<TREE[i].d)return TREE[k].c;return null};
const inToronto=c=>c==="City of Toronto"||/^Toronto /.test(c);
const IND="    ";
const areaOptions=(cur,first)=>(first?`<option value="">${first}</option>`:"")+TREE.map(x=>`<option value="${x.c}"${x.c===cur?" selected":""}>${IND.repeat(x.d)}${cn(x.c)}</option>`).join("");

function route(){return ROUTE.split(".")}
const PATHS={home:"",explore:"explore/",areas:"areas/",letters:"letters/",afford:"tools/afford/",compare:"tools/compare/"};
// Page path (relative to the site base) for a route token such as "area.markham.1" or "letter.2026-09".
function pathFor(token){const p=token.split(".");if(p[0]==="area")return `areas/${p[1]}/${TSLUG[+p[2]||0]}/`;if(p[0]==="letter")return `letters/${p[1]}/`;return PATHS[p[0]]??""}
function shellParts(p){
  const t=T(),keys=["home","explore","areas","letters","afford","compare"],cur=p[0]==="area"?"areas":p[0]==="letter"?"letters":p[0];
  return {
    nav:keys.map((k,i)=>`<a href="${h(k)}" data-tour="nav-${k}"${cur===k?' aria-current="page"':""}>${t.nav[i]}</a>`).join("")+`<a class="legacy" data-tour="nav-legacy" href="${BASE}legacy/">${t.legacy}</a>`,
    foot:`<p style="margin:0 0 8px">${t.footer.replace("{month}",mfull(L()))}</p><button type="button" class="linkbtn" data-start-tour>${t.tour.link}</button>`,
    langLabel:lang==="zh"?"English":"中文",
  };
}
function shell(p){
  const t=T(),s=shellParts(p);document.documentElement.lang=lang==="zh"?"zh-CN":"en";
  $("brandName").textContent=t.brand;$("brandSub").textContent=t.sub;$("brandBadge").textContent=t.badge;$("brandLink").href=h("home");
  $("nav").innerHTML=s.nav;$("langBtn").textContent=s.langLabel;$("foot").innerHTML=s.foot;
}

function killCharts(){charts.forEach(c=>c.destroy());charts=[]}
function lineChart(el,labels,sets,opt={}){
  const ink=css("--muted"),grid=css("--grid");
  const c=new Chart(el,{type:opt.bar?"bar":"line",data:{labels,datasets:sets.map(s=>({label:s.label,data:s.data,borderColor:s.color,backgroundColor:opt.bar?(s.colors||s.color):s.fill||"transparent",fill:!!s.fill,borderWidth:opt.bar?0:(s.width||2),borderDash:s.dash||[],pointRadius:0,pointHoverRadius:4,tension:.3,spanGaps:true,borderRadius:opt.bar?3:0,maxBarThickness:22,order:s.order||0}))},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>x.raw==null?null:`${x.dataset.label}: ${opt.fmt?opt.fmt(x.raw):Math.round(x.raw).toLocaleString()}`}}},
      scales:{x:{grid:{display:false},ticks:{color:ink,font:{size:11},maxRotation:0,autoSkip:true,maxTicksLimit:opt.maxTicks||(lang==="zh"?5:7)}},y:{min:opt.ymin,max:opt.ymax,grid:{color:grid},border:{display:false},ticks:{color:ink,font:{size:11},callback:opt.yfmt||(v=>v.toLocaleString())}}}}});
  charts.push(c);return c;
}
const kfmt=v=>lang==="zh"?(v/10).toFixed(0)+"万":(v>=1000?"$"+(v/1000).toFixed(1)+"M":"$"+v+"K");
function kpi(label,val,sub,cls){return `<div class="kpi"><div class="l">${label}</div><div class="v">${val}</div><div class="d ${cls||"flat"}">${sub||"&nbsp;"}</div></div>`}
const kpiY=(label,val,y)=>kpi(label,val,y==null?"":`${pct(y)} ${T().yoy}`,dcls(y));

function moversList(i,ti,n){
  const rows=[];for(const c of D.cities){if(AGG.has(c))continue;const a=ser(c,ti);if(!a||(a.s[i]||0)<30)continue;const y=yoy(a.m,i);if(y==null)continue;rows.push({c,y,flag:Math.abs(y)>25})}
  rows.sort((a,b)=>b.y-a.y);return{top:rows.slice(0,n),bot:rows.slice(-n).reverse()};
}
function moverRows(list,ti){const max=Math.max(10,...list.filter(r=>!r.flag).map(r=>Math.abs(r.y)));return list.map(r=>`<div class="mv"><a class="row-link" href="${h(`area.${slug(r.c)}.${ti}`)}">${cn(r.c)}${r.flag?` <span class="chip flag" title="${T().flag}">!</span>`:""}</a><span class="bar"><i style="width:${Math.min(100,Math.abs(r.y)/max*100)}%;background:${r.y>=0?"var(--up)":"var(--down)"}"></i></span><span class="d ${dcls(r.y)}" style="text-align:right">${pct(r.y)}</span></div>`).join("")}
function moversBlock(i,ti,n){const mv=moversList(i,ti,n);return `<div class="movers">${moverRows(mv.top,ti)}<hr style="border:0;border-top:1px dashed var(--line);width:100%">${moverRows(mv.bot,ti)}</div><p class="muted small">${T().moversNote}</p>`}

/* ---------- market letter text: written as connected prose, separately per language ---------- */
function letter(i){
  const A="All TRREB Areas",all=ser(A,0),mo=mname(i);
  const sy=yoy(all.s,i),py=yoy(all.m,i),moi=all.i[i],st=stateOf(moi),ay=yoy(all.a,i);
  const dd=all.d[i]!=null&&all.d[i-12]!=null?all.d[i]-all.d[i-12]:null;
  const types=[1,2,3,4,5].map(k=>({k,a:ser(A,k),y:yoy(ser(A,k).m,i)})).filter(x=>x.y!=null).sort((a,b)=>b.y-a.y);
  const best=types[0],worst=types[types.length-1],allDown=types.every(x=>x.y<0),allUp=types.every(x=>x.y>0);
  const sDir=sy==null||Math.abs(sy)<1.5?0:sy>0?1:-1,pDir=py==null||Math.abs(py)<1.5?0:py>0?1:-1;
  const firstYear=i<12;
  if(lang==="zh"){
    const m=mname(i);
    const head=firstYear?`${m}市场概览`:
      sDir>0&&pDir>0?`${m}市场回暖：成交与房价双双上升`:sDir>0&&pDir<0?`${m}买家回流，但房价仍在走低`:sDir<0&&pDir>0?`${m}成交减少，房价却小幅走高`:sDir<0&&pDir<0?`${m}市场偏冷：成交减少，房价走软`:sDir===0&&pDir<0?`${m}成交持平，房价继续回落`:sDir===0&&pDir>0?`${m}成交持平，房价稳中有升`:sDir!==0?`${m}成交${sDir>0?"增加":"减少"}，房价基本持平`:`${m}市场整体平稳`;
    const sTxt=sy==null?"":Math.abs(sy)<1.5?"，与去年同期基本持平":`，比去年同期${sy>0?"多":"少"}约 ${Math.abs(sy).toFixed(0)}%`;
    const pTxt=py==null?"":Math.abs(py)<1?"，与去年持平":`，同比${py>0?"上涨":"下跌"} ${apct(py)}`;
    const mkt=st==="buyer"?"买方占据优势：可选房源充足，议价空间较大。":st==="seller"?"卖方占据优势：房源偏少，好房子很快就会成交。":"市场处于平衡区间：买家有选择，但定价合理的房子依然好卖。";
    const p1=`${mfull(i)}，大多伦多地区共成交 ${all.s[i].toLocaleString()} 套住宅${sTxt}。平均成交价为 ${price(all.m[i])}${pTxt}。目前的库存约可供 ${moi} 个月销售，${mkt}`;
    const tz=k=>TYPE_ZH[D.types[k]];
    const p2=firstYear?"":(allDown?"各类房型的价格都低于去年同期。":allUp?"各类房型的价格都高于去年同期。":"")+`其中${tz(best.k)}表现最稳，中位价 ${price(best.a.m[i])}（同比 ${pct(best.y)}）；${tz(worst.k)}最弱，中位价 ${price(worst.a.m[i])}（同比 ${pct(worst.y)}）。`;
    const p3=`房屋平均 ${all.d[i]} 天售出${dd==null||dd===0?"":`，比去年同期${dd>0?"多":"少"} ${Math.abs(dd)} 天`}，成交价${all.r[i]>=100?"普遍达到或高于挂牌价":`通常为挂牌价的 ${all.r[i]}%`}。`;
    const watch=ay==null?"":ay>5?(st==="seller"?`在售房源比去年同期多 ${ay.toFixed(0)}%，卖方市场开始降温，买家的选择会逐渐增加。`:`在售房源比去年同期多 ${ay.toFixed(0)}%。如果需求跟不上，买家的议价空间还会扩大，${tz(worst.k)}尤其明显。`):ay<-5?(st==="buyer"?`在售房源比去年同期少 ${Math.abs(ay).toFixed(0)}%。目前买家仍有较多选择，但如果供应继续减少，市场可能逐渐转向平衡。`:`在售房源比去年同期少 ${Math.abs(ay).toFixed(0)}%。供应收紧若持续，定价合理的房子可能重新出现竞争。`):"在售房源与去年同期相当，接下来的走势将主要取决于借贷成本和买家信心。";
    return{head,deck:`成交量 ${pct(sy)} · 均价 ${pct(py)} · 对比去年${m}`,paras:[p1,p2,p3].filter(Boolean),watch};
  }
  const head=firstYear?`${mo} at a glance`:
    sDir>0&&pDir>0?`${mo} brings more sales and firmer prices`:sDir>0&&pDir<0?`Buyers return in ${mo}, but prices keep easing`:sDir<0&&pDir>0?`Fewer sales in ${mo}, yet prices edge higher`:sDir<0&&pDir<0?`A quieter ${mo}: fewer sales and softer prices`:sDir===0&&pDir<0?`Sales hold steady in ${mo} as prices drift lower`:sDir===0&&pDir>0?`Sales hold steady in ${mo} as prices firm up`:sDir!==0?`${sDir>0?"More":"Fewer"} sales in ${mo}, with prices little changed`:`A steady ${mo} for GTA housing`;
  const sTxt=sy==null?"":Math.abs(sy)<1.5?", about the same as a year ago":`, about ${Math.abs(sy).toFixed(0)}% ${sy>0?"more":"fewer"} than a year ago`;
  const pTxt=py==null?"":Math.abs(py)<1?", unchanged from last "+mo:`, ${py>0?"up":"down"} ${apct(py)} from last ${mo}`;
  const mkt=st==="buyer"?"buyers have the upper hand: there's plenty to choose from and room to negotiate.":st==="seller"?"sellers have the upper hand: supply is thin and good homes go quickly.":"the market is in balanced territory. Buyers have choice, but well-priced homes still sell.";
  const p1=`Across the GTA, ${all.s[i].toLocaleString()} homes changed hands in ${mfull(i)}${sTxt}. The average price came in at ${price(all.m[i])}${pTxt}. With about ${moi} months of inventory, ${mkt}`;
  const tp=k=>TYPE_PLURAL[D.types[k]],cap=s=>s[0].toUpperCase()+s.slice(1);
  const p2=firstYear?"":allDown?`Every home type sold for less than a year ago. ${cap(tp(best.k))} held up best, with a median of ${price(best.a.m[i])} (${pct(best.y)}), while ${tp(worst.k)} were the weakest at ${price(worst.a.m[i])} (${pct(worst.y)}).`
    :allUp?`Prices rose across every home type, led by ${tp(best.k)} at a median of ${price(best.a.m[i])} (${pct(best.y)}). ${cap(tp(worst.k))} gained the least (${pct(worst.y)}).`
    :`${cap(tp(best.k))} did best, with a median of ${price(best.a.m[i])} (${pct(best.y)}), while ${tp(worst.k)} were the weakest at ${price(worst.a.m[i])} (${pct(worst.y)}).`;
  const p3=`Homes took ${all.d[i]} days to sell on average${dd==null||dd===0?"":`, ${Math.abs(dd)} ${Math.abs(dd)===1?"day":"days"} ${dd>0?"longer":"faster"} than last ${mo}`}, and ${all.r[i]>=100?"most sold at or above asking":`typically closed at ${all.r[i]}% of the asking price`}.`;
  const watch=ay==null?"":ay>5?(st==="seller"?`There are ${ay.toFixed(0)}% more homes for sale than a year ago, so the seller's market is starting to cool and buyers are getting more choice.`:`There are ${ay.toFixed(0)}% more homes for sale than a year ago. If demand doesn't keep pace, buyers will have even more room to negotiate, especially on ${tp(worst.k)}.`):ay<-5?(st==="buyer"?`There are ${Math.abs(ay).toFixed(0)}% fewer homes for sale than a year ago. Buyers still have plenty of choice for now, but if supply keeps shrinking, the market could move back toward balance.`:`There are ${Math.abs(ay).toFixed(0)}% fewer homes for sale than a year ago. If supply stays this tight, competition for well-priced homes could pick up again.`):"The number of homes for sale is close to last year's level, so the months ahead will likely turn on borrowing costs and buyer confidence.";
  return{head,deck:`Sales ${pct(sy)} · Average price ${pct(py)} · vs ${mo} ${+D.months[i].slice(0,4)-1}`,paras:[p1,p2,p3].filter(Boolean),watch};
}

/* ---------- home ---------- */
function pageHome(){
  const t=T(),i=L(),all=ser("All TRREB Areas",0),lt=letter(i);
  return `<section class="hero"><h1>${t.heroTitle}</h1><p class="lede">${t.heroLede}</p><p class="small" style="margin:10px 0 0"><button type="button" class="linkbtn" data-start-tour>${t.tour.link} →</button></p>
   <form class="picker" id="pick"><select id="pArea" aria-label="${t.area}">${areaOptions("Markham")}</select>${typeSelect("pType",1)}<button type="submit" class="cta">${t.seeReport} →</button></form></section>
  <section><p class="eyebrow">${t.gtaNow} · ${mfull(i)}</p><div class="kpis">${kpiY(t.avg+" · "+tn(0),price(all.m[i]),yoy(all.m,i))}${kpiY(t.sales,all.s[i].toLocaleString(),yoy(all.s,i))}${kpi(t.dom,all.d[i])}${kpi(t.moi,all.i[i])}</div></section>
  <section class="card" id="homeLetter"><p class="eyebrow">${lang==="zh"?"月度市场报告":"Market letter"} · ${mfull(i)}</p><h2 style="font-size:24px">${lt.head}</h2><p class="lede" style="margin-top:4px">${lt.paras[0]}</p><p><a href="${h("letter."+D.months[i])}">${t.readLetter} →</a></p></section>
  <section class="three">${t.homeCards.map((c,k)=>`<a class="card go" href="${h(["afford","compare","explore"][k])}"><h3>${c[0]}</h3><span class="muted small">${c[1]}</span><span class="arrow">${c[2]} →</span></a>`).join("")}</section>
  <section class="two"><div class="card"><h2>${t.movers}</h2><div class="controls">${typeSelect("hmType",1,true)}</div><div id="hmList">${moversBlock(L(),1,4)}</div></div>
  <div class="card"><h2>${t.popular}</h2><div class="controls">${typeSelect("popType",1)}</div><div class="region" id="popList">${POPULAR.map(c=>areaRow(c,1)).join("")}</div></div></section>`;
}
function areaRow(c,ti,d){const a=ser(c,ti),i=L();if(!a)return"";const y=yoy(a.m,i);return `<a class="arow d${d||0}${AGG.has(c)?" agg":""}" href="${h(`area.${slug(c)}.${ti}`)}"><span style="min-width:0">${cn(c)}</span><span class="p">${price(a.m[i])}</span><span class="d ${dcls(y)} hide-sm">${pct(y)}</span><span class="hide-sm">${chip(a.i[i])}</span></a>`}

/* ---------- areas ---------- */
function pageAreas(){
  const t=T();
  return `<section><h1>${t.areasTitle}</h1><p class="lede">${t.areasLede}</p></section>
  <section><div class="controls"><input type="search" id="q" placeholder="${t.search}" aria-label="${t.search}">${typeSeg("aType",0)}</div><p class="muted small" id="aNote">${T().allNote}</p><div id="alist" class="alist">${areasListHtml(0,"")}</div></section>`;
}
function fillAreas(ti,q){$("aNote").textContent=ti===0?T().allNote:"";$("alist").innerHTML=areasListHtml(ti,q)}
function areasListHtml(ti,q){
  q=(q||"").trim().toLowerCase();const out=[];const match=c=>!q||c.toLowerCase().includes(q)||(ZH[c]||"").includes(q);
  for(const top of TREE.filter(x=>x.d===0)){
    const rows=[top.c,...descendants(top.c)].filter(c=>ser(c,ti)&&match(c)).map(c=>areaRow(c,ti,depth(c))).join("");
    if(rows)out.push(`<div class="card"${top.c==="All TRREB Areas"?' style="grid-column:1/-1"':""}><h2>${cn(top.c)}</h2><div class="region">${rows}</div></div>`);
  }
  return out.join("")||`<p class="muted">—</p>`;
}

/* ---------- area: the buyer's report ---------- */
function heatOf(a,i){const r=a.r[i],m=a.i[i];if(r==null||m==null)return null;if(r>=101||m<2)return"hot";if(r>=99||m<3)return"warm";if(m>5&&r<98)return"cool";return"even"}
function heatText(k,a,i,ti){
  const r=a.r[i],d=a.d[i],one=TYPE_ONE[D.types[ti]];
  if(lang==="zh")return {hot:`房子通常以挂牌价的 ${r}% 成交，平均 ${d} 天售出。准备好面对竞价，议价空间很小。`,warm:`房子以接近挂牌价（${r}%）成交，平均 ${d} 天售出。议价空间有限，看中的房子要尽快行动。`,even:`房子通常以挂牌价的 ${r}% 成交，平均 ${d} 天售出。有一定议价空间，可以多比较几套。`,cool:`房子通常以挂牌价的 ${r}% 成交，平均需要 ${d} 天才能售出。买家有较大的议价空间。`}[k];
  return {hot:`A typical ${one} here sells at ${r}% of asking in ${d} days. Expect competition and little room to negotiate.`,warm:`Homes sell close to asking (${r}%) in about ${d} days. There's limited room to negotiate, so be ready to move on a home you like.`,even:`Homes typically sell at ${r}% of asking after ${d} days. You have some room to negotiate and time to compare.`,cool:`Homes typically sell at ${r}% of asking and take ${d} days. Buyers have real room to negotiate.`}[k];
}
const trendEn=(y,y3)=>y==null||Math.abs(y3)<1?"so prices have been flat recently":Math.sign(y)!==Math.sign(y3)?(y3>0?"so prices have started to recover":"so prices have started to slip"):y3<0?(Math.abs(y3)>Math.abs(y)?"so the decline is deepening":"so the decline is easing"):(y3>Math.abs(y)?"so the rise is speeding up":"so the rise is slowing");
const trendZh=(y,y3)=>y==null||Math.abs(y3)<1?"近期价格基本平稳":Math.sign(y)!==Math.sign(y3)?(y3>0?"价格已开始回升":"价格已开始回落"):y3<0?(Math.abs(y3)>Math.abs(y)?"跌势在加深":"跌势在放缓"):(y3>Math.abs(y)?"涨势在加快":"涨势在放缓");
function pageArea(p){
  const t=T(),c=BYSLUG[p[1]]||"Markham",ti=Math.min(+p[2]||0,D.types.length-1),a=ser(c,ti),i=L();
  const par=parentOf(c),chain=[];let x=par;while(x){chain.unshift(x);x=parentOf(x)}
  const tabs=D.types.map((_,k)=>ser(c,k)?`<a href="${h(`area.${p[1]}.${k}`)}"${k===ti?' aria-current="page"':""}>${tn(k)}</a>`:"").join("");
  const crumbs=`<div class="crumbs"><a href="${h("areas")}">${t.areasTitle}</a>${chain.map(z=>`<span>/</span><a href="${h(`area.${slug(z)}.${ti}`)}">${cn(z)}</a>`).join("")}<span>/</span><span>${cn(c)}</span></div>`;
  const head=`<section>${crumbs}<h1 style="margin-top:8px">${cn(c)} · ${tn(ti)}</h1><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">${a?chip(a.i[i]):""}<span class="muted small">${lang==="zh"?"数据更新至":"Data through"} ${mfull(i)}</span></div><div class="tabs" style="margin-top:14px">${tabs}</div></section>`;
  if(!a||a.m[i]==null)return head+`<p class="muted">—</p>`;
  const y=yoy(a.m,i),flag=y!=null&&Math.abs(y)>25,one=TYPE_ONE[D.types[ti]];
  // Q1
  const q1txt=lang==="zh"
    ?`${mfull(i)}，${cn(c)}${tn(ti)}的${pl(ti)}为 ${price(a.m[i])}${y==null?"":`，${Math.abs(y)<1?"与去年同期持平":`比去年同期${y>0?"高":"低"} ${apct(y)}`}`}。${ti===0?"这是所有房型按成交量加权的平均价。":"一半成交价高于这个数字，一半低于它。"}`
    :`${ti===0?`The average home in ${c}`:`A typical ${one} in ${c}`} sold for ${price(a.m[i])} in ${mfull(i)}${y==null?"":Math.abs(y)<1?", about the same as a year ago":`, ${apct(y)} ${y>0?"more":"less"} than a year ago`}. ${ti===0?"This is the sales-weighted average across every home type.":"Half of sales were above that price and half below."}`;
  const others=D.types.map((_,k)=>{const b=ser(c,k);if(!b||b.m[i]==null||k===ti)return"";return `<tr><td><a class="row-link" href="${h(`area.${p[1]}.${k}`)}">${tn(k)}</a></td><td class="n">${price(b.m[i])}${k===0?` <span class="muted small">${t.avg}</span>`:""}</td><td class="n"><span class="d ${dcls(yoy(b.m,i))}">${pct(yoy(b.m,i))}</span></td><td class="n">${b.s[i]??"—"}</td></tr>`}).join("");
  // Q2
  const n=i,peakK=a.m.reduce((bk,v,k)=>v!=null&&(bk<0||v>a.m[bk])?k:bk,-1),fromPeak=(a.m[i]/a.m[peakK]-1)*100;
  const r3=avgOf(a.m,i-2,i),r3p=avgOf(a.m,i-14,i-12),y3=r3&&r3p?(r3/r3p-1)*100:null;
  const q2txt=lang==="zh"
    ?`${y==null?"":`与一年前相比，${pl(ti)}${Math.abs(y)<1?"基本持平":`${y>0?"上涨":"下跌"}了 ${apct(y)}`}。`}${y3==null?"":`近三个月的平均水平比去年同期${Math.abs(y3)<1?"持平":`${y3>0?"高":"低"} ${apct(y3)}`}，${trendZh(y,y3)}。`}${peakK===i?"目前正处于 2021 年以来的最高点。":`目前比 ${mfull(peakK)} 的高点低 ${apct(fromPeak)}。`}`
    :`${y==null?"":`Compared with a year ago, the ${pl(ti).toLowerCase()} is ${Math.abs(y)<1?"about the same":`${y>0?"up":"down"} ${apct(y)}`}. `}${y3==null?"":`Over the last three months it averaged ${Math.abs(y3)<1?"about the same as":`${apct(y3)} ${y3>0?"above":"below"}`} the same months last year, ${trendEn(y,y3)}. `}${peakK===i?"Prices are at their highest since 2021.":`Prices are ${apct(fromPeak)} below the peak of ${price(a.m[peakK])} in ${mfull(peakK)}.`}`;
  // Q3
  const hk=heatOf(a,i);
  const dslr=a.r[i]!=null&&a.r[i-12]!=null?a.r[i]-a.r[i-12]:null,ddom=a.d[i]!=null&&a.d[i-12]!=null?a.d[i]-a.d[i-12]:null,dmoi=a.i[i]!=null&&a.i[i-12]!=null?a.i[i]-a.i[i-12]:null;
  const vs=(v,unit,good)=>v==null?"":`${v>0?"+":""}${Number.isInteger(v)?v:v.toFixed(1)}${unit} ${lang==="zh"?"对比去年":"vs "+t.lastYear}`;
  // Q4
  const ay=yoy(a.a,i);
  const q4txt=lang==="zh"
    ?`目前约有 ${a.a[i]} 套${tn(ti)}在售${ay==null?"":`，比去年同期${ay>0?"多":"少"} ${Math.abs(ay).toFixed(0)}%`}。按${mname(i)}的成交速度，库存约可供 ${a.i[i]} 个月销售。${ay!=null&&ay>10?"选择比去年更多，可以慢慢挑。":ay!=null&&ay<-10?"选择比去年更少，好房子可能更抢手。":""}`
    :`There are about ${a.a[i]} ${TYPE_PLURAL[D.types[ti]]} for sale${ay==null?"":`, ${Math.abs(ay).toFixed(0)}% ${ay>0?"more":"fewer"} than a year ago`}. At ${mname(i)}'s pace of sales, that's about ${a.i[i]} months of supply. ${ay!=null&&ay>10?"You have more choice than last year.":ay!=null&&ay<-10?"Choice is tighter than last year, so good homes may draw more interest.":""}`;
  // Q6
  const lvl=depth(c);let sibs=par?descendants(par).filter(z=>depth(z)===lvl):[];sibs=sibs.filter(z=>{const b=ser(z,ti);return b&&b.m[i]!=null&&(b.s[i]||0)>=5});
  const cheaper=sibs.filter(z=>z!==c&&ser(z,ti).m[i]<a.m[i]).sort((u,v)=>ser(u,ti).m[i]-ser(v,ti).m[i]);
  const showSibs=[...cheaper.slice(0,6),c];
  return head+`
  ${flag?`<p class="note">! ${t.flag}</p>`:""}
  <section class="q"><h2>${t.q1}</h2><div class="two"><div><div class="hero-num">${price(a.m[i])}</div><div class="d ${dcls(y)}" style="font-size:14px">${pct(y)} ${t.yoy} · ${pl(ti)}</div><p class="lede">${q1txt}</p></div>
    ${others?`<div class="card" style="padding:6px 8px"><h3 style="padding:8px 10px 0">${t.otherTypes}</h3><div class="scroll"><table><thead><tr><th>${t.type}</th><th class="n">${t.median}</th><th class="n">${t.yoy}</th><th class="n">${t.sales}</th></tr></thead><tbody>${others}</tbody></table></div></div>`:""}</div></section>
  <section class="q"><div class="controls" style="justify-content:space-between"><h2 style="margin:0">${t.q2}</h2>${seg("rangeSeg",[["12",t.range1],["24",t.range2],["60",t.range5],["all",t.rangeAll]],v=>v==="all")}</div>
    <p class="lede" style="margin-top:0">${q2txt}</p>
    <div class="kpis" style="margin:14px 0">${kpi(t.oneYear,pct(y),"",dcls(y))}${kpi(t.threeMonth,pct(y3),"",dcls(y3))}${kpi(t.fromPeak,peakK===i?"0%":pct(fromPeak),mfull(peakK))}</div>
    <div class="card"><div class="legend" id="aLeg"></div><div class="chartbox"><canvas id="cPrice" role="img" aria-label="${t.q2}"></canvas></div></div></section>
  <section class="q"><h2>${t.q3}</h2>${hk?`<div class="verdict ${hk}"><b>${t.heat[hk]}</b><span>${heatText(hk,a,i,ti)}</span></div>`:""}
    <div class="kpis" style="margin-top:14px">${kpi(t.slr,a.r[i]!=null?a.r[i]+"%":"—",vs(dslr,lang==="zh"?" 个百分点":" pts"))}${kpi(t.dom,a.d[i]??"—",vs(ddom,lang==="zh"?" 天":" days"))}${kpi(t.moi,a.i[i]??"—",vs(dmoi,""))}</div></section>
  <section class="q"><h2>${t.q4}</h2><p class="lede" style="margin-top:0">${q4txt}</p>
    <div class="kpis" style="margin-top:14px">${kpiY(t.active,a.a[i]??"—",ay)}${kpiY(t.sales+" · "+mname(i),a.s[i]??"—",yoy(a.s,i))}${kpi(t.moi,a.i[i]??"—","",)}</div></section>
  <section class="q"><h2>${t.q5}</h2>${costCalc(c,a.m[i]*1000)}</section>
  <section class="q"><h2>${t.q6}</h2>${cheaper.length?`<div class="card scroll" style="padding:6px 8px"><table><thead><tr><th>${t.area}</th><th class="n">${pl(ti)}</th><th class="n">${t.vsHere}</th><th class="n">${t.dom}</th><th>${t.moi}</th></tr></thead><tbody>${showSibs.map(z=>{const b=ser(z,ti);return `<tr${z===c?' style="background:var(--teal-soft)"':""}><td><a class="row-link" href="${h(`area.${slug(z)}.${ti}`)}">${cn(z)}</a></td><td class="n">${price(b.m[i])}</td><td class="n">${z===c?"—":`<span class="d up">−${price(a.m[i]-b.m[i]).replace("$","$")}</span>`}</td><td class="n">${b.d[i]??"—"}</td><td>${chip(b.i[i])}</td></tr>`}).join("")}</tbody></table></div>`:`<p class="lede" style="margin-top:0">${t.cheaperNone}</p>`}</section>
  <section class="q"><h2>${t.q7}</h2><p class="lede" style="margin-top:0" id="bestTxt"></p><div class="card"><p class="muted small" style="margin-top:0">${t.bestNote}</p><div class="chartbox sm"><canvas id="cBest" role="img" aria-label="${t.q7}"></canvas></div></div></section>
  <section class="q"><h2>${t.shareTitle}</h2><p class="muted small" style="margin-top:-6px">${t.shareNote}</p>
   <div class="share" role="img" aria-label="${t.shareTitle}"><div><div style="font-size:clamp(10px,1.7vw,13px);color:#a9cfcc;letter-spacing:.08em;text-transform:uppercase">${mfull(i)} · ${pl(ti)}</div><div class="t" style="margin-top:4px">${cn(c)} · ${tn(ti)}</div></div>
   <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px"><div><div class="big">${price(a.m[i])}</div><div style="margin-top:6px;font-size:clamp(11px,2vw,16px);color:${y!=null&&y<0?"#f2a597":"#8fdcb7"}">${pct(y)} ${t.yoy}</div></div>${spark(a.m.slice(-25))}</div>
   <div class="f"><span>polarislabsca.github.io/GTA-Housing-Market</span><span>${t.badge}</span></div></div>
   <p><a href="${h("compare")}">${t.compareLink} →</a></p></section>`;
}
function spark(v){const pts0=v.map((x,k)=>[k,x]).filter(q=>q[1]!=null);if(pts0.length<2)return"";const xs=pts0.map(q=>q[1]),mn=Math.min(...xs),mx=Math.max(...xs),w=200,ht=60;const pts=pts0.map(([k,x])=>[k/(v.length-1)*w,ht-4-((x-mn)/(mx-mn||1))*(ht-8)]);return `<svg viewBox="0 0 ${w} ${ht}" style="width:40%;max-width:220px;height:auto" aria-hidden="true"><polyline points="${pts.map(q=>q.join(",")).join(" ")}" fill="none" stroke="#c4a060" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="4" fill="#c4a060"/></svg>`}
function drawAreaCharts(p,range){
  const c=BYSLUG[p[1]]||"Markham",ti=Math.min(+p[2]||0,D.types.length-1),a=ser(c,ti),t=T();if(!a||!$("cPrice"))return;killCharts();
  const n=D.months.length,start=range==="all"?0:Math.max(0,n-1-+range),idx=[...Array(n-start).keys()].map(k=>k+start),s1=css("--s1"),s2=css("--s2");
  const sets=[];if(ti!==0)sets.push({label:t.median,data:idx.map(k=>a.m[k]),color:s1,width:2.5,fill:s1+"1f"});
  sets.push({label:t.avg,data:idx.map(k=>a.v[k]),color:s2,width:2,dash:[6,4]});
  $("aLeg").innerHTML=(ti!==0?`<span><i style="background:${s1}"></i>${t.median}</span>`:"")+`<span><i style="background:repeating-linear-gradient(90deg,${s2} 0 6px,transparent 6px 9px)"></i>${t.avg}</span>`;
  lineChart($("cPrice"),idx.map(mlabel),sets,{fmt:price,yfmt:kfmt});
  // best time: avg sale-to-list per calendar month
  const sum=Array(12).fill(0),cnt=Array(12).fill(0);D.months.forEach((m,k)=>{if(a.r[k]!=null&&(a.s[k]||0)>=5){const mo=+m.slice(5)-1;sum[mo]+=a.r[k];cnt[mo]++}});
  const avg=sum.map((s,k)=>cnt[k]?s/cnt[k]:null),valid=avg.map((v,k)=>[v,k]).filter(x=>x[0]!=null);
  if(valid.length>=6){
    const sorted=[...valid].sort((x,y)=>x[0]-y[0]),lo=sorted.slice(0,2).map(x=>x[1]).sort((x,y)=>x-y),hi=sorted[sorted.length-1];
    const nm=k=>lang==="zh"?`${k+1}月`:MON_FULL[k];
    $("bestTxt").textContent=lang==="zh"
      ?`2021 年以来，这里在${nm(lo[0])}和${nm(lo[1])}成交价离挂牌价最远（约 ${sorted[0][0].toFixed(1)}%），买家议价空间最大；${nm(hi[1])}最接近或高于挂牌价（约 ${hi[0].toFixed(1)}%），竞争最激烈。`
      :`Since 2021, homes here have sold furthest below asking in ${nm(lo[0])} and ${nm(lo[1])} (around ${sorted[0][0].toFixed(1)}%), when buyers have the most room to negotiate. ${nm(hi[1])} is usually the most competitive month, at about ${hi[0].toFixed(1)}% of asking.`;
    const cols=avg.map((v,k)=>lo.includes(k)?css("--s1"):k===hi[1]?css("--down"):css("--line"));
    const mn=Math.floor(Math.min(...valid.map(x=>x[0]))-1),mx=Math.ceil(Math.max(...valid.map(x=>x[0]))+0.5);
    lineChart($("cBest"),monLabels(),[{label:t.slr,data:avg.map(v=>v==null?null:+v.toFixed(1)),color:css("--s1"),colors:cols}],{bar:true,maxTicks:12,ymin:mn,ymax:mx,fmt:v=>v.toFixed(1)+"%",yfmt:v=>v+"%"});
  }else{$("bestTxt").textContent="—"}
}

/* ---------- cost to buy ---------- */
const bracket=(p,b)=>{let tax=0,prev=0;for(const[cap,r]of b){if(p<=prev)break;tax+=(Math.min(p,cap)-prev)*r;prev=cap}return tax};
const ONT=[[55000,.005],[250000,.01],[400000,.015],[2000000,.02],[Infinity,.025]];
// City of Toronto MLTT for one or two single-family residences, effective April 1, 2026.
const TOR=[[55000,.005],[250000,.01],[400000,.015],[2000000,.02],[3000000,.025],[4000000,.044],[5000000,.0545],[10000000,.065],[20000000,.0755],[Infinity,.086]];
function pmt(principal,rate,yrs){const i=Math.pow(1+rate/200,1/6)-1,n=yrs*12;return i===0?principal/n:principal*i/(1-Math.pow(1+i,-n))}
function minDown(p){return p<=500000?p*.05:p<1500000?25000+(p-500000)*.10:p*.2}
const cmhcRate=dp=>dp>=20?0:dp>=15?.028:dp>=10?.031:.04;
const num=s=>{const v=parseFloat(String(s).replace(/[^0-9.]/g,""));return isFinite(v)?v:NaN};
let COST=null;
function costCalc(c,p0){
  const t=T();COST={c,price:Math.round(p0/1000)*1000,dp:20,rate:4.2,am:25,ftb:false};
  return `<div class="card"><div class="form">
   <div class="field"><label for="kPrice">${t.price}</label><div class="pair"><span class="unit">$</span><input type="text" inputmode="numeric" id="kPrice" autocomplete="off"></div><span class="err" id="ekPrice"></span></div>
   <div class="field"><label for="kDp">${t.downPay}</label><div class="pair"><input type="number" id="kDp" min="5" max="100" step="0.5"><span class="unit">%</span></div><span class="err" id="ekDp"></span></div>
   <div class="field"><label for="kRate">${t.rate}</label><div class="pair"><input type="number" id="kRate" min="0.5" max="15" step="0.01"><span class="unit">%</span></div><span class="err" id="ekRate"></span></div>
   <div class="field"><label for="kAm">${t.amort}</label><select id="kAm">${[5,10,15,20,25,30].map(y=>`<option value="${y}"${y===25?" selected":""}>${y} ${t.years}</option>`).join("")}</select></div>
   <label class="check"><input type="checkbox" id="kFtb"> ${t.ftb}</label></div>
   <div class="kpis" style="margin-top:16px" id="kOut"></div><p class="note" id="kWarn" hidden></p>
   <div class="scroll" style="margin-top:12px"><table id="kTable"></table></div><p class="muted small">${t.costNote}</p></div>`;
}
function wireCost(){
  if(!$("kPrice"))return;const t=T();
  $("kPrice").value=COST.price.toLocaleString("en-CA");$("kDp").value=COST.dp;$("kRate").value=COST.rate.toFixed(2);
  const bind=(id,lo,hi,fmt,set)=>{$(id).addEventListener("input",()=>{const v=num($(id).value);const bad=isNaN(v)||v<lo||v>hi;$("e"+id).textContent=bad?t.errRange(fmt(lo),fmt(hi)):"";$(id).setAttribute("aria-invalid",bad);if(!bad){set(v);drawCost()}})};
  bind("kPrice",50000,20000000,dollars,v=>COST.price=v);bind("kDp",5,100,v=>v+"%",v=>COST.dp=v);bind("kRate",0.5,15,v=>v+"%",v=>COST.rate=v);
  $("kPrice").addEventListener("blur",()=>{if(!$("ekPrice").textContent)$("kPrice").value=Math.round(COST.price).toLocaleString("en-CA")});
  $("kAm").onchange=()=>{COST.am=+$("kAm").value;drawCost()};$("kFtb").onchange=()=>{COST.ftb=$("kFtb").checked;drawCost()};
  drawCost();
}
function drawCost(){
  const t=T(),{c,price:p,dp,rate,am,ftb}=COST,down=p*dp/100,md=minDown(p);
  const insurable=p<1500000&&dp<20,prem=insurable?(p-down)*(cmhcRate(dp)+(am>25?.002:0)):0,loan=p-down+prem,pst=prem*.08;
  const ont=bracket(p,ONT),tor=inToronto(c)?bracket(p,TOR):0,reb=ftb?Math.min(ont,4000)+(inToronto(c)?Math.min(tor,4475):0):0,legal=2500;
  const total=down+ont+tor-reb+pst+legal,stressR=Math.max(rate+2,5.25);
  $("kOut").innerHTML=kpi(t.monthly,dollars(pmt(loan,rate,am)),`${rate.toFixed(2)}% · ${am} ${t.years}`)+kpi(t.stress,dollars(pmt(loan,stressR,am)),`${stressR.toFixed(2)}%`)+kpi(t.cash,dollars(total),"");
  $("kWarn").hidden=down>=md-1;$("kWarn").textContent=`${t.belowMin} (${dollars(md)})`;
  const rows=[[t.cDown,down],[t.cOnt,ont],...(inToronto(c)?[[t.cTor,tor]]:[]),...(ftb?[[t.cReb,-reb]]:[]),...(pst?[[t.cPst,pst]]:[]),[t.cLegal,legal]];
  $("kTable").innerHTML=`<tbody>${rows.map(([l,v])=>`<tr><td>${l}</td><td class="n">${dollars(v)}</td></tr>`).join("")}<tr style="font-weight:600"><td>${t.cTotal}</td><td class="n">${dollars(total)}</td></tr>${prem?`<tr><td class="muted">${t.cIns}</td><td class="n muted">${dollars(prem)}</td></tr>`:""}</tbody>`;
}

/* ---------- explore ---------- */
let exRange="all";
function pageExplore(){
  const t=T();
  return `<section><h1>${t.exploreTitle}</h1><p class="lede">${t.exploreLede}</p><p><a href="${BASE}legacy/">${t.openLegacy} →</a></p></section>
  <section class="controls" style="margin:0"><select id="sArea" aria-label="${t.area}">${areaOptions("All TRREB Areas")}</select>${typeSelect("sType",0)}</section>
  <section class="card"><h2>${t.unitsTitle}</h2><p class="muted small" style="margin-top:-6px">${t.seasonNote}</p><div class="legend" id="sLeg"></div><div class="chartbox"><canvas id="cSeason" role="img" aria-label="${t.unitsTitle}"></canvas></div></section>
  <section class="card"><div class="controls" style="justify-content:space-between"><h2 style="margin:0">${t.priceTitle}</h2>${seg("pRange",[["12",t.range1],["24",t.range2],["60",t.range5],["all",t.rangeAll]],v=>v==="all")}</div><p class="muted small" id="pNote" style="margin-top:0"></p><div class="legend" id="pLeg"></div><div class="chartbox"><canvas id="cExPrice" role="img" aria-label="${t.priceTitle}"></canvas></div></section>
  <section class="card"><h2>${t.lbTitle}</h2><div class="controls">${seg("lbSeg",[["yoy",t.lbYoy],["dom",t.lbDom],["moi",t.lbMoi]],v=>v==="yoy")}${typeSelect("lbType",1,true)}</div><div id="lb">${lbHtml("yoy",1)}</div><p class="muted small">${t.lbNote}</p></section>`;
}
function drawExplore(){killCharts();drawSeason();drawExPrice()}
function drawExPrice(){
  const c=$("sArea").value,ti=+$("sType").value,a=ser(c,ti),t=T();if(!a)return;
  const n=D.months.length,start=exRange==="all"?0:Math.max(0,n-1-+exRange),idx=[...Array(n-start).keys()].map(k=>k+start),s1=css("--s1"),s2=css("--s2");
  const sets=[];if(ti!==0)sets.push({label:t.median,data:idx.map(k=>a.m[k]),color:s1,width:2.5});
  sets.push({label:t.avg,data:idx.map(k=>a.v[k]),color:s2,width:2,dash:[6,4]});
  $("pLeg").innerHTML=(ti!==0?`<span><i style="background:${s1}"></i>${t.median}</span>`:"")+`<span><i style="background:repeating-linear-gradient(90deg,${s2} 0 6px,transparent 6px 9px)"></i>${t.avg}</span>`;
  $("pNote").textContent=ti===0?t.priceAllNote:t.priceNote;
  lineChart($("cExPrice"),idx.map(mlabel),sets,{fmt:price,yfmt:kfmt});
}
function drawSeason(){
  const c=$("sArea").value,ti=+$("sType").value,a=ser(c,ti);if(!a){$("sLeg").textContent="—";return}
  const years={};D.months.forEach((m,k)=>{const y=m.slice(0,4);(years[y]=years[y]||Array(12).fill(null))[+m.slice(5)-1]=a.s[k]});
  const ys=Object.keys(years).sort(),cur=ys[ys.length-1],prev=ys[ys.length-2],s1=css("--s1"),s2=css("--s2"),g=css("--line");
  const sets=ys.map(y=>({label:y,data:years[y],color:y===cur?s1:y===prev?s2:g,width:y===cur||y===prev?2.5:1.5,dash:y===cur||y===prev?[]:[4,3],order:y===cur?0:y===prev?1:2}));
  $("sLeg").innerHTML=`<span><i style="background:${s1}"></i>${cur}</span><span><i style="background:${s2}"></i>${prev}</span><span><i style="background:${g}"></i>${ys[0]}–${ys[ys.length-3]}</span>`;
  lineChart($("cSeason"),monLabels(),sets,{maxTicks:12});
}
function drawLb(){$("lb").innerHTML=lbHtml(document.querySelector("#lbSeg [aria-pressed=true]").dataset.v,+$("lbType").value)}
function lbHtml(m,ti){
  const i=L(),t=T();
  if(m==="yoy")return moversBlock(i,ti,6);
  const f=m==="dom"?"d":"i",rows=[];for(const c of D.cities){if(AGG.has(c))continue;const a=ser(c,ti);if(!a||(a.s[i]||0)<30||a[f][i]==null)continue;rows.push({c,v:a[f][i],a})}
  rows.sort((x,y)=>x.v-y.v);
  return `<div class="scroll"><table><thead><tr><th>#</th><th>${t.area}</th><th class="n">${m==="dom"?t.dom:t.moi}</th><th class="n">${t.median}</th><th class="n">${t.sales}</th></tr></thead><tbody>${rows.slice(0,10).map((r,k)=>`<tr><td>${k+1}</td><td><a class="row-link" href="${h(`area.${slug(r.c)}.${ti}`)}">${cn(r.c)}</a></td><td class="n">${r.v}</td><td class="n">${price(r.a.m[i])}</td><td class="n">${r.a.s[i]}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ---------- letters ---------- */
function pageLetters(){
  const t=T(),by={};D.months.forEach((m,k)=>{(by[m.slice(0,4)]=by[m.slice(0,4)]||[]).push(k)});
  return `<section><h1>${t.lettersTitle}</h1><p class="lede">${t.lettersLede}</p></section>`+Object.keys(by).sort().reverse().map(y=>`<section><h2>${y}</h2><div class="archive">${by[y].slice().reverse().map(k=>`<a href="${h("letter."+D.months[k])}"><span class="muted small">${mfull(k)}</span><br>${letterHeadFor(k)}</a>`).join("")}</div></section>`).join("");
}
const letterHeadFor=k=>letter(k).head;
function pageLetter(p){
  const t=T();let i=D.months.indexOf(p[1]);if(i<0)i=L();
  const lt=letter(i),all=ser("All TRREB Areas",0);
  const typeRows=D.types.map((_,k)=>{const a=ser("All TRREB Areas",k);return `<tr${k===0?' style="font-weight:500"':""}><td><a class="row-link" href="${h(`area.all-trreb-areas.${k}`)}">${tn(k)}</a></td><td class="n">${price(a.m[i])}${k===0?` <span class="muted small">${t.avg}</span>`:""}</td><td class="n"><span class="d ${dcls(yoy(a.m,i))}">${pct(yoy(a.m,i))}</span></td><td class="n">${(a.s[i]??0).toLocaleString()}</td><td class="n"><span class="d ${dcls(yoy(a.s,i))}">${pct(yoy(a.s,i))}</span></td><td class="n">${a.d[i]??"—"}</td><td>${chip(a.i[i])}</td></tr>`}).join("");
  return `<article class="letter"><div><p class="eyebrow">${lang==="zh"?"月度市场报告":"Market letter"} · ${mfull(i)}</p><h1>${lt.head}</h1><p class="deck">${lt.deck}</p></div>
  <div class="prose">${lt.paras.map(x=>`<p>${x}</p>`).join("")}</div>
  <div><h2>${t.byType}</h2><div class="card scroll" style="padding:6px 8px"><table><thead><tr><th>${t.type}</th><th class="n">${t.median}</th><th class="n">${t.yoy}</th><th class="n">${t.sales}</th><th class="n">${t.yoy}</th><th class="n">${t.dom}</th><th>${t.moi}</th></tr></thead><tbody>${typeRows}</tbody></table></div></div>
  <div><h2>${t.unitsTitle}</h2><div class="controls">${typeSelect("lType",0)}</div><div class="legend" id="lLeg"></div><div class="chartbox sm"><canvas id="cLetter" role="img" aria-label="${t.unitsTitle}"></canvas></div></div>
  ${i>=12?`<div><h2>${t.movers}</h2><div class="controls">${typeSeg("lmType",1,true)}</div><div id="lMovers">${moversBlock(i,1,4)}</div></div>`:""}
  ${lt.watch?`<div><h2>${t.watch}</h2><div class="prose"><p>${lt.watch}</p></div></div>`:""}
  <div class="sharebox"><h2 style="margin:0">${t.shareLetter}</h2><p class="muted small" style="margin:0">${t.shareLede}</p><div class="row"><button type="button" class="btn" id="mkPoster">${t.makePoster}</button><button type="button" class="btn" id="mkSummary">${t.makeSummary}</button><button type="button" class="btn" id="cpSummary">${t.copySummary}</button><span id="copyMsg" class="small muted"></span></div><div id="posterOut"></div></div>
  <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">${i>0?`<a href="${h("letter."+D.months[i-1])}">← ${t.prev}: ${mfull(i-1)}</a>`:"<span></span>"}${i<L()?`<a href="${h("letter."+D.months[i+1])}">${t.next}: ${mfull(i+1)} →</a>`:""}</div></article>`;
}
function drawLetterChart(i){
  killCharts();const a=ser("All TRREB Areas",+$("lType").value);
  const y=D.months[i].slice(0,4),py=String(+y-1),cur=Array(12).fill(null),prv=Array(12).fill(null);
  D.months.forEach((m,k)=>{if(k>i)return;const mo=+m.slice(5)-1;if(m.startsWith(y))cur[mo]=a.s[k];if(m.startsWith(py))prv[mo]=a.s[k]});
  const s1=css("--s1"),s2=css("--s2");
  $("lLeg").innerHTML=`<span><i style="background:${s1}"></i>${y}</span><span><i style="background:${s2}"></i>${py}</span>`;
  lineChart($("cLetter"),monLabels(),[{label:y,data:cur,color:s1,width:2.5},{label:py,data:prv,color:s2}],{maxTicks:12});
}

/* ---------- affordability ---------- */
const AFF={bud:1000000,dp:20,rate:4.2,am:25,area:"",types:new Set([1,2,3,4,5])};
function pageAfford(){
  const t=T(),typeBtns=[["all",t.allTypes],...D.types.slice(1).map((_,k)=>[k+1,tn(k+1)])];
  return `<section><h1>${t.affTitle}</h1><p class="lede">${t.affLede}</p></section>
  <section class="card"><div class="form">
   <div class="field"><label for="iBud">${t.budget}</label><div class="pair"><span class="unit">$</span><input type="text" inputmode="numeric" id="iBud" autocomplete="off"></div><input type="range" id="rBud" min="300000" max="3000000" step="25000" aria-label="${t.budget}"><span class="err" id="eBud"></span></div>
   <div class="field"><span class="lbl">${t.downPay}</span><div class="pair"><input type="number" id="iDp" min="5" max="100" step="0.5" aria-label="${t.downPay} %"><span class="unit">%</span><span class="unit">=</span><span class="unit">$</span><input type="text" inputmode="numeric" id="iDd" aria-label="${t.downPay} $" autocomplete="off"></div><input type="range" id="rDp" min="5" max="100" step="1" aria-label="${t.downPay} %"><span class="err" id="eDp"></span></div>
   <div class="field"><label for="iRate">${t.rate}</label><div class="pair"><input type="number" id="iRate" min="0.5" max="15" step="0.01"><span class="unit">%</span></div><input type="range" id="rRate" min="0.5" max="10" step="0.05" aria-label="${t.rate}"><span class="err" id="eRate"></span></div>
   <div class="field"><label for="iAm">${t.amort}</label><select id="iAm">${[5,10,15,20,25,30].map(y=>`<option value="${y}"${y===AFF.am?" selected":""}>${y} ${t.years}</option>`).join("")}</select></div>
  </div><div class="kpis" style="margin-top:18px" id="affK"></div><p id="affWarn" class="note" hidden></p><p id="affIns" class="note" hidden></p></section>
  <section><div class="controls"><select id="iArea" aria-label="${t.areaF}">${areaOptions(AFF.area,t.allAreas)}</select>${seg("affSeg",typeBtns,()=>false)}</div>
   <p id="affN" class="muted"></p><div class="card scroll" style="padding:6px 8px"><table><thead><tr><th>${t.area}</th><th>${t.type}</th><th class="n">${t.median}</th><th class="n">${t.minDown}</th><th class="n">${t.monthly}</th><th>${t.moi}</th></tr></thead><tbody id="affT"></tbody></table></div><div id="affMore"></div><p class="muted small">${t.affNote}</p></section>`;
}
function syncAff(except){
  if(except!=="iBud")$("iBud").value=Math.round(AFF.bud).toLocaleString("en-CA");$("rBud").value=Math.min(AFF.bud,3000000);
  if(except!=="iDp")$("iDp").value=+AFF.dp.toFixed(2);if(except!=="iDd")$("iDd").value=Math.round(AFF.bud*AFF.dp/100).toLocaleString("en-CA");$("rDp").value=AFF.dp;
  if(except!=="iRate")$("iRate").value=AFF.rate.toFixed(2);$("rRate").value=Math.min(AFF.rate,10);
}
function setErr(inp,errId,msg){$(errId).textContent=msg||"";$(inp).setAttribute("aria-invalid",msg?"true":"false")}
function paintAffSeg(){$("affSeg").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v==="all"?AFF.types.size===5:AFF.types.has(+x.dataset.v)&&AFF.types.size<5))}
function wireAfford(){
  const t=T();
  const onText=(id,errId,lo,hi,fmt,apply)=>{$(id).addEventListener("input",()=>{const v=num($(id).value);if(isNaN(v)||v<lo||v>hi){setErr(id,errId,t.errRange(fmt(lo),fmt(hi)));return}setErr(id,errId,"");apply(v);syncAff(id);drawAfford()});$(id).addEventListener("blur",()=>{setErr(id,errId,"");syncAff()})};
  onText("iBud","eBud",100000,10000000,dollars,v=>AFF.bud=v);onText("iDp","eDp",5,100,v=>v+"%",v=>AFF.dp=v);
  onText("iDd","eDp",0,10000000,dollars,v=>{AFF.dp=Math.max(0,Math.min(100,v/AFF.bud*100))});onText("iRate","eRate",0.5,15,v=>v+"%",v=>AFF.rate=v);
  $("rBud").oninput=()=>{AFF.bud=+$("rBud").value;setErr("iBud","eBud","");syncAff();drawAfford()};
  $("rDp").oninput=()=>{AFF.dp=+$("rDp").value;setErr("iDp","eDp","");syncAff();drawAfford()};
  $("rRate").oninput=()=>{AFF.rate=+$("rRate").value;setErr("iRate","eRate","");syncAff();drawAfford()};
  $("iAm").onchange=()=>{AFF.am=+$("iAm").value;drawAfford()};$("iArea").onchange=()=>{AFF.area=$("iArea").value;drawAfford()};
  $("affSeg").onclick=e=>{const b=e.target.closest("button");if(!b)return;const v=b.dataset.v;if(v==="all")AFF.types=new Set([1,2,3,4,5]);else{const k=+v;if(AFF.types.size===5)AFF.types=new Set([k]);else if(AFF.types.has(k)){AFF.types.delete(k);if(!AFF.types.size)AFF.types=new Set([1,2,3,4,5])}else AFF.types.add(k)}paintAffSeg();drawAfford()};
  paintAffSeg();syncAff();drawAfford();
}
let affShowAll=false;
function drawAfford(){
  const t=T(),{bud,dp,rate,am}=AFF,i=L(),loan=bud*(1-dp/100),stressR=Math.max(rate+2,5.25),md=minDown(bud);
  $("affK").innerHTML=kpi(t.monthly,dollars(pmt(loan,rate,am)))+kpi(`${t.stress} (${stressR.toFixed(2)}%)`,dollars(pmt(loan,stressR,am)))+kpi(t.minDown,dollars(md));
  $("affWarn").hidden=bud*dp/100>=md-1;$("affWarn").textContent=t.belowMin;$("affIns").hidden=!(dp<20&&am>25);$("affIns").textContent=t.insured;
  const areas=!AFF.area||AFF.area==="All TRREB Areas"?D.cities.filter(c=>!AGG.has(c)):[AFF.area,...descendants(AFF.area)].filter(c=>!AGG.has(c)||!descendants(c).length);
  const rows=[];for(const c of areas)for(const k of AFF.types){const a=ser(c,k);if(!a||(a.s[i]||0)<5||a.m[i]==null)continue;const p=a.m[i]*1000;if(p<=bud)rows.push({c,k,p,moi:a.i[i]})}
  rows.sort((x,y)=>y.p-x.p);$("affN").textContent=`${rows.length} ${t.fit}`;
  const shown=affShowAll?rows:rows.slice(0,40);
  $("affT").innerHTML=shown.map(r=>`<tr><td><a class="row-link" href="${h(`area.${slug(r.c)}.${r.k}`)}">${cn(r.c)}</a></td><td>${tn(r.k)}</td><td class="n">${price(r.p/1000)}</td><td class="n">${dollars(minDown(r.p))}</td><td class="n">${dollars(pmt(r.p*(1-dp/100),rate,am))}</td><td>${chip(r.moi)}</td></tr>`).join("");
  $("affMore").innerHTML=rows.length>shown.length?`<button class="more" type="button" id="affMoreBtn">${t.showAll(rows.length)}</button>`:"";
  if($("affMoreBtn"))$("affMoreBtn").onclick=()=>{affShowAll=true;drawAfford()};
}

/* ---------- compare ---------- */
let cmpSel=["Markham","Richmond Hill","Vaughan",""],cmpType=1;
function pageCompare(){
  const t=T();
  return `<section><h1>${t.cmpTitle}</h1><p class="lede">${t.cmpLede}</p></section>
  <section class="card"><div class="controls">${[0,1,2,3].map(k=>`<select id="cmp${k}" aria-label="${t.area} ${k+1}">${areaOptions(cmpSel[k],k>0?t.none:"—")}</select>`).join("")}${typeSelect("cmpT",cmpType)}</div>
  <p class="muted small" id="cmpNote"></p><div class="scroll"><table id="cmpTable"></table></div></section>
  <section class="card"><h2>${t.priceTitle}</h2><div class="legend" id="cmpLeg"></div><div class="chartbox"><canvas id="cCmp" role="img" aria-label="${t.priceTitle}"></canvas></div></section>`;
}
function drawCompare(){
  const t=T(),i=L();cmpType=+$("cmpT").value;const ti=cmpType;cmpSel=[0,1,2,3].map(k=>$("cmp"+k).value);
  const cols=[css("--s1"),css("--s2"),css("--s3"),css("--s4")],cs=cmpSel.map((c,k)=>({c,col:cols[k]})).filter((x,k)=>x.c&&cmpSel.indexOf(x.c)===k&&ser(x.c,ti));
  $("cmpNote").textContent=ti===0?t.allNote:"";
  const rowsDef=[[pl(ti),a=>price(a.m[i])],[t.yoy,a=>`<span class="d ${dcls(yoy(a.m,i))}">${pct(yoy(a.m,i))}</span>`],[t.sales,a=>a.s[i]??"—"],[t.dom,a=>a.d[i]??"—"],[t.slr,a=>a.r[i]!=null?a.r[i]+"%":"—"],[t.active,a=>a.a[i]??"—"],[t.moi,a=>chip(a.i[i])],[lang==="zh"?"竞争程度":"Competition",a=>{const k=heatOf(a,i);return k?t.heat[k]:"—"}]];
  $("cmpTable").innerHTML=`<thead><tr><th></th>${cs.map(x=>`<th><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${x.col};margin-right:6px"></span><a class="row-link" href="${h(`area.${slug(x.c)}.${ti}`)}">${cn(x.c)}</a></th>`).join("")}</tr></thead><tbody>${rowsDef.map(([l,f])=>`<tr><td class="muted">${l}</td>${cs.map(x=>`<td>${f(ser(x.c,ti))}</td>`).join("")}</tr>`).join("")}</tbody>`;
  killCharts();const idx=[...Array(D.months.length).keys()];
  $("cmpLeg").innerHTML=cs.map(x=>`<span><i style="background:${x.col}"></i>${cn(x.c)}</span>`).join("");
  lineChart($("cCmp"),idx.map(mlabel),cs.map(x=>({label:cn(x.c),data:ser(x.c,ti).m,color:x.col})),{fmt:price,yfmt:kfmt});
}


/* ---------- share poster ---------- */
function letterUrl(i){return SITE_ORIGIN+BASE+(lang==="zh"?"zh/":"")+`letters/${D.months[i]}/`}
function wrapText(ctx,text,maxW){
  const out=[];let line="";const cjk=/[　-鿿＀-￯]/;
  const tokens=cjk.test(text)?(text.match(/[\u3000-\u9fff\uff00-\uffef]|[^\s\u3000-\u9fff\uff00-\uffef]+|\s+/g)||[]):text.split(/(\s+)/);
  // Chinese line-breaking rule: closing punctuation never starts a line, so it stays on the line before.
  const noStart=/^[，。、；：！？）》」』%]/;
  for(const tk of tokens){const test=line+tk;if(ctx.measureText(test).width>maxW&&line.trim()&&!noStart.test(tk)){out.push(line.trim());line=tk.trimStart()}else line=test}
  if(line.trim())out.push(line.trim());return out;
}
function drawQR(ctx,text,x,y,size){
  // Whole-pixel modules (at 2× scale) so the code has crisp edges and scans reliably.
  const qr=qrcode(0,"M");qr.addData(text);qr.make();const n=qr.getModuleCount(),cell=Math.floor(size*2/(n+8))/2,pad=(size-cell*n)/2;
  ctx.fillStyle="#ffffff";ctx.fillRect(x,y,size,size);ctx.fillStyle="#1e4040";
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(x+pad+c*cell,y+pad+r*cell,cell,cell);
}
async function makePoster(i,kind){
  try{await document.fonts.ready}catch(e){}
  // Laid out at 1080×1920 and rendered at 2× so text and the QR code stay sharp on high-density phone screens.
  const W=1080,H=1920,SCALE=2,cv=document.createElement("canvas");cv.width=W*SCALE;cv.height=H*SCALE;const g=cv.getContext("2d");g.scale(SCALE,SCALE);
  const t=T(),lt=letter(i),A="All TRREB Areas",all=ser(A,0),zh=lang==="zh";
  const F=(w,px)=>`${w} ${px}px Geist, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif`;
  const C={paper:"#f0f5f5",deep:"#1e4040",teal:"#4e8884",gold:"#c4a060",ink:"#2a3d3d",muted:"#557a7a",line:"#c8dedd",up:"#2f7d5b",down:"#b24a3a",white:"#ffffff"};
  g.fillStyle=C.paper;g.fillRect(0,0,W,H);
  // header band
  g.fillStyle=C.deep;g.fillRect(0,0,W,150);
  g.fillStyle=C.white;g.font=F(600,40);g.fillText(t.brand,64,78);
  g.fillStyle="#a9cfcc";g.font=F(500,24);g.fillText(`${zh?"月度市场报告":"MARKET LETTER"} · ${mfull(i).toUpperCase()}`,64,118);
  g.fillStyle=C.gold;g.fillRect(W-64-120,62,120,6);
  // headline
  g.fillStyle=C.ink;g.font=F(700,zh?68:70);let y=260;
  for(const l of wrapText(g,lt.head,W-128).slice(0,3)){g.fillText(l,64,y);y+=zh?88:84}
  g.fillStyle=C.muted;g.font=F(500,28);g.fillText(lt.deck,64,y+6);y+=60;
  const FH=210,fy=H-FH;
  if(kind==="summary"){
    // the written summary, shrunk to fit above the footer
    const blocks=[...lt.paras.map(x=>({text:x})),...(lt.watch?[{head:t.watch,text:lt.watch}]:[])];
    let size=48,lay;
    const layout=sz=>{g.font=F(400,sz);const lh=Math.round(sz*1.5);let h=0;const out=blocks.map(b=>{const lines=wrapText(g,b.text,W-128);const bh=(b.head?sz+16:0)+lines.length*lh;h+=bh+sz*0.8;return{...b,lines,lh}});return{h,out}};
    while(size>20&&(lay=layout(size)).h>fy-40-y)size--;
    lay=layout(size);g.fillStyle=C.gold;g.fillRect(64,y-6,72,5);y+=size;
    const spare=Math.max(0,fy-60-y-lay.h),gap=Math.min(70,spare/Math.max(1,lay.out.length));
    for(const b of lay.out){
      if(b.head){g.fillStyle=C.ink;g.font=F(700,size+2);g.fillText(b.head,64,y);y+=size+16}
      g.fillStyle=C.ink;g.font=F(400,size);for(const l of b.lines){g.fillText(l,64,y);y+=b.lh}
      y+=size*0.8+gap;
    }
  }else{
  // KPI tiles
  const kp=[[t.posterKpi[0],price(all.m[i]),yoy(all.m,i)],[t.posterKpi[1],all.s[i].toLocaleString(),yoy(all.s,i)],[t.posterKpi[2],String(all.d[i]??"—"),null],[t.posterKpi[3],String(all.i[i]??"—"),null]];
  const tw=(W-128-3*20)/4;
  kp.forEach(([lab,val,dv],k)=>{const x=64+k*(tw+20);g.fillStyle=C.white;g.beginPath();g.roundRect(x,y,tw,170,18);g.fill();
    g.fillStyle=C.muted;let lf=22;g.font=F(500,lf);while(g.measureText(lab).width>tw-36&&lf>16){lf--;g.font=F(500,lf)}g.fillText(lab,x+20,y+40);
    g.fillStyle=C.ink;g.font=F(700,48);g.fillText(val,x+20,y+106);
    if(dv!=null){g.fillStyle=Math.abs(dv)<0.5?C.muted:dv>0?C.up:C.down;g.font=F(600,24);g.fillText(`${pct(dv)} ${t.yoy}`,x+20,y+146)}});
  y+=230;
  // by home type
  g.fillStyle=C.ink;g.font=F(700,30);g.fillText(t.byType,64,y);
  g.fillStyle=C.muted;g.font=F(500,20);g.textAlign="right";g.fillText(t.median,W-320,y);g.fillText(t.yoy,W-210,y);g.fillText(t.sales,W-88,y);g.textAlign="left";y+=22;
  const rows=[1,2,3,4,5].map(k=>({k,a:ser(A,k)}));
  const RH=70;
  rows.forEach(({k,a},n)=>{const ry=y+n*RH;g.fillStyle=n%2?C.paper:C.white;g.fillRect(64,ry,W-128,RH);
    g.fillStyle=C.ink;g.font=F(500,30);g.fillText(tn(k),88,ry+46);
    g.font=F(700,30);g.textAlign="right";g.fillText(price(a.m[i]),W-320,ry+46);
    const v=yoy(a.m,i);g.fillStyle=v==null||Math.abs(v)<0.5?C.muted:v>0?C.up:C.down;g.font=F(600,27);g.fillText(`${pct(v)}`,W-210,ry+46);
    g.fillStyle=C.muted;g.font=F(500,24);g.fillText(`${(a.s[i]??0).toLocaleString()} ${zh?"套":"sold"}`,W-88,ry+46);g.textAlign="left"});
  y+=rows.length*RH;
  // units sold this year vs last year, in whatever space is left above the footer
  const space=fy-40-(y+40);
  if(space>=150){
    const top=y+40+Math.max(0,(space-520)/2),yr=D.months[i].slice(0,4),py=String(+yr-1),cur=Array(12).fill(null),prv=Array(12).fill(null);
    D.months.forEach((m,k)=>{if(k>i)return;const mo=+m.slice(5)-1;if(m.startsWith(yr))cur[mo]=all.s[k];if(m.startsWith(py))prv[mo]=all.s[k]});
    g.fillStyle=C.ink;g.font=F(700,30);g.fillText(zh?"每月成交套数":"Homes sold by month",64,top+10);
    g.font=F(600,20);g.fillStyle=C.teal;g.fillText(`— ${yr}`,W-280,top+10);g.fillStyle=C.gold;g.fillText(`— ${py}`,W-180,top+10);
    const cx=64,cw=W-128,cy=top+50,ch=Math.min(space-80,420),vals=[...cur,...prv].filter(v=>v!=null),step=Math.pow(10,Math.floor(Math.log10(Math.max(...vals))))/(Math.max(...vals)/Math.pow(10,Math.floor(Math.log10(Math.max(...vals))))<3?2:1),mx=Math.ceil(Math.max(...vals)*1.05/step)*step;
    for(let v=0;v<=mx;v+=step){const gy=cy+ch-v/mx*ch;g.strokeStyle=v===0?C.muted:C.line;g.lineWidth=v===0?1.5:1;g.beginPath();g.moveTo(cx+70,gy);g.lineTo(cx+cw,gy);g.stroke();g.fillStyle=C.muted;g.font=F(500,18);g.fillText(v.toLocaleString(),cx,gy+6)}
    const line=(arr,col)=>{g.strokeStyle=col;g.lineWidth=5;g.lineJoin="round";g.lineCap="round";g.beginPath();let st=false;arr.forEach((v,k)=>{if(v==null)return;const px=cx+70+k/11*(cw-70),py2=cy+ch-v/mx*ch;st?g.lineTo(px,py2):g.moveTo(px,py2);st=true});g.stroke()};
    line(prv,C.gold);line(cur,C.teal);
    g.fillStyle=C.muted;g.font=F(500,18);[0,3,6,9,11].forEach(k=>{g.textAlign=k===0?"left":k===11?"right":"center";g.fillText(zh?`${k+1}月`:MON_EN[k],cx+70+k/11*(cw-70),cy+ch+30)});g.textAlign="left";
  }
  }
  // footer with QR
  // compact footer: site, tagline, and QR code
  g.fillStyle=C.deep;g.fillRect(0,fy,W,FH);
  const qs=150;drawQR(g,letterUrl(i),W-64-qs,fy+(FH-qs)/2,qs);
  g.fillStyle=C.white;g.font=F(700,30);g.fillText(t.scanToRead,64,fy+62);
  g.fillStyle="#a9cfcc";g.font=F(500,21);
  wrapText(g,t.posterTag,W-64-qs-64-40).slice(0,2).forEach((s,n)=>g.fillText(s,64,fy+102+n*29));
  g.fillStyle=C.gold;g.font=F(600,19);g.fillText(`polarislabsca.github.io/GTA-Housing-Market · ${t.badge}`,64,fy+178);
  return cv;
}
function summaryText(i){
  const t=T(),lt=letter(i);
  const colon=lang==="zh"?"：":": ";
  return [lt.head,lt.deck,...lt.paras,...(lt.watch?[`${t.watch}${colon}${lt.watch}`]:[]),`${t.readFull}${colon}${letterUrl(i)}`].join("\n\n");
}
async function copySummary(i){
  const t=T(),text=summaryText(i);
  try{await navigator.clipboard.writeText(text);$("copyMsg").textContent=t.copied}
  catch(e){$("copyMsg").textContent=t.copyFallback;$("posterOut").innerHTML=`<textarea id="sumText" readonly style="width:100%;min-height:260px;font:inherit;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink)">${text.replace(/</g,"&lt;")}</textarea>`;$("sumText").select()}
}
async function showPoster(i,kind){
  const t=T(),out=$("posterOut");out.innerHTML=`<p class="muted small">…</p>`;$("copyMsg").textContent="";
  const cv=await makePoster(i,kind),url=cv.toDataURL("image/png");
  out.innerHTML=`<div class="poster-out"><img src="${url}" alt="${letter(i).head}"><div class="how">${t.posterHow.map(x=>`<span>${x}</span>`).join("")}<div class="row"><button type="button" class="cta sm" id="downloadPosterBtn">${t.downloadPoster}</button></div><span class="small" id="dlMsg"></span></div></div>`;
  $("downloadPosterBtn").onclick=async()=>{
    const filename=`gta-market-letter-${D.months[i]}-${kind}${lang==="zh"?"-zh":""}.png`,blob=await new Promise(r=>cv.toBlob(r,"image/png"));
    $("dlMsg").textContent="";
    const href=URL.createObjectURL(blob),a=document.createElement("a");a.href=href;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(href),10000);
  };
}


/* ---------- onboarding tour ---------- */
const TOUR_KEY="gta-tour-seen";
const tourSeen=()=>{try{return localStorage.getItem(TOUR_KEY)==="1"}catch(e){return false}};
const markTourSeen=()=>{try{localStorage.setItem(TOUR_KEY,"1")}catch(e){}};
const TOUR_TARGETS=["#pick","#homeLetter",'[data-tour="nav-afford"]','[data-tour="nav-compare"]','[data-tour="nav-explore"]',"#langBtn"];
let tourStep=-1;
const LANG_KEY="gta-lang";
const savedLang=()=>{try{return localStorage.getItem(LANG_KEY)}catch(e){return null}};
const saveLang=l=>{try{localStorage.setItem(LANG_KEY,l)}catch(e){}};
// First visit: greet in both languages and let the visitor pick one; the tour then runs in that language.
function showWelcome(){
  if(tourSeen()||$("welcome"))return;
  const en=S.en.tour,zh=S.zh.tour,el=document.createElement("div");el.id="welcome";el.className="welcome";el.setAttribute("role","dialog");el.setAttribute("aria-label",`${en.welcomeTitle} ${zh.welcomeTitle}`);
  el.innerHTML=`<div class="bi"><b>${en.welcomeHead}</b><b lang="zh-CN">${zh.welcomeHead}</b></div>
    <div class="bi small muted"><span>${en.chooseLang}</span><span lang="zh-CN">${zh.chooseLang}</span></div>
    <div class="row langpick"><button type="button" class="cta sm" data-pick-lang="en">English</button><button type="button" class="cta sm" data-pick-lang="zh" lang="zh-CN">中文</button></div>
    <button type="button" class="linkbtn small" id="wLater">${en.later} · <span lang="zh-CN">${zh.later}</span></button>`;
  document.body.appendChild(el);
  el.querySelectorAll("[data-pick-lang]").forEach(b=>b.onclick=()=>{saveLang(b.dataset.pickLang);startTour(b.dataset.pickLang)});
  $("wLater").onclick=()=>{el.remove();markTourSeen()};
}
// Starts the tour on the home page, switching language first when one is given.
function startTour(toLang){
  markTourSeen();if($("welcome"))$("welcome").remove();
  const want=toLang||lang;
  if(ROUTE==="home"&&want===lang){tourStep=0;drawTour();return}
  try{sessionStorage.setItem("gta-start-tour","1")}catch(e){}
  location.href=BASE+(want==="zh"?"zh/":"");
}
function endTour(){tourStep=-1;["tourDim","tourSpot","tourCard"].forEach(id=>$(id)&&$(id).remove());document.removeEventListener("keydown",tourKeys)}
function tourKeys(e){if(e.key==="ArrowRight")stepTour(1);else if(e.key==="ArrowLeft")stepTour(-1)}
function stepTour(d){const n=tourStep+d;if(n<0)return;if(n>=TOUR_TARGETS.length)return endTour();tourStep=n;drawTour()}
function drawTour(){
  if(tourStep<0)return;const t=T().tour,[title,body]=t.steps[tourStep],target=document.querySelector(TOUR_TARGETS[tourStep]);
  if(!$("tourDim")){
    // The dim layer blocks clicks on the page; only Skip (or Done on the last step) ends the tour.
    const dim=document.createElement("div");dim.id="tourDim";dim.className="tour-dim";
    const spot=document.createElement("div");spot.id="tourSpot";spot.className="spot";
    const card=document.createElement("div");card.id="tourCard";card.className="tourcard";card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");
    document.body.append(dim,spot,card);document.addEventListener("keydown",tourKeys);
  }
  const last=tourStep===TOUR_TARGETS.length-1,card=$("tourCard");
  card.innerHTML=`<div class="meta"><span>${t.of(tourStep+1,TOUR_TARGETS.length)}</span><div class="dots">${TOUR_TARGETS.map((_,k)=>`<i class="${k===tourStep?"on":""}"></i>`).join("")}</div></div><h3>${title}</h3><p>${body}</p><div class="row" style="justify-content:space-between"><button type="button" class="linkbtn" id="tSkip">${t.skip}</button><span class="row">${tourStep>0?`<button type="button" class="btn" id="tBack">${t.back}</button>`:""}<button type="button" class="cta sm" id="tNext">${last?t.done:t.next}</button></span></div>`;
  $("tSkip").onclick=endTour;$("tNext").onclick=()=>stepTour(1);if($("tBack"))$("tBack").onclick=()=>stepTour(-1);
  if(target)target.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  placeTour(target);setTimeout(()=>{placeTour(target);$("tNext")&&$("tNext").focus({preventScroll:true})},target?450:0);
}
function placeTour(target){
  const spot=$("tourSpot"),card=$("tourCard");if(!spot||!card)return;
  const vw=innerWidth,vh=innerHeight,pad=8;
  if(!target){spot.style.cssText="width:0;height:0;left:50%;top:50%";card.style.left=`${(vw-card.offsetWidth)/2}px`;card.style.top=`${(vh-card.offsetHeight)/2}px`;return}
  const r=target.getBoundingClientRect();
  Object.assign(spot.style,{left:`${r.left-pad}px`,top:`${r.top-pad}px`,width:`${r.width+pad*2}px`,height:`${r.height+pad*2}px`});
  const cw=card.offsetWidth,ch=card.offsetHeight,below=r.bottom+pad+14,above=r.top-pad-14-ch;
  const top=below+ch<vh-12?below:above>12?above:Math.max(12,vh-ch-12);
  const left=Math.min(Math.max(16,r.left+r.width/2-cw/2),vw-cw-16);
  card.style.top=`${top}px`;card.style.left=`${left}px`;
}
// Keep the spotlight on its target while the page scrolls (including smooth scrolling) or resizes.
const replaceTour=()=>{if(tourStep>=0)placeTour(document.querySelector(TOUR_TARGETS[tourStep]))};


/* ---------- page data, meta, and start-up ---------- */
function prepare(data){D=data;D.cities.forEach(c=>{BYSLUG[slug(c)]=c;if(/^Toronto [CEW]\d\d$/.test(c))ZH[c]=c.replace("Toronto","多伦多")});TREE=buildTree()}
function pageHtml(p){
  const pg=p[0];
  if(pg==="areas")return pageAreas();if(pg==="area")return pageArea(p);if(pg==="explore")return pageExplore();
  if(pg==="letters")return pageLetters();if(pg==="letter")return pageLetter(p);if(pg==="afford")return pageAfford();
  if(pg==="compare")return pageCompare();return pageHome();
}
function pageMeta(p){
  const t=T(),zh=lang==="zh",i=L(),pg=p[0],brand=t.brand;
  if(pg==="area"){const c=BYSLUG[p[1]],ti=+p[2]||0,a=ser(c,ti),y=yoy(a.m,i);
    return {title:zh?`${cn(c)}${tn(ti)}房价与市场报告 · ${mfull(i)} · ${brand}`:`${c} ${tn(ti)} prices and market report · ${mfull(i)} · ${brand}`,
      description:zh?`${cn(c)}${tn(ti)}${mfull(i)}${pl(ti)} ${price(a.m[i])}（同比 ${pct(y)}），成交 ${a.s[i]} 套，平均在售 ${a.d[i]??"—"} 天。附价格走势、竞争程度、买房成本与附近更便宜的地区。`:`${c} ${tn(ti).toLowerCase()} ${pl(ti).toLowerCase()} ${price(a.m[i])} in ${mfull(i)} (${pct(y)} y/y), ${a.s[i]} sales, ${a.d[i]??"—"} days on market. Price trend, competition, true cost to buy, and cheaper areas nearby.`}}
  if(pg==="letter"){const k=Math.max(0,D.months.indexOf(p[1])),lt=letter(k);return {title:`${lt.head} · ${mfull(k)} · ${brand}`,description:lt.paras[0]}}
  const names={home:[`${brand} · ${zh?"各地区房价与市场报告":"Prices and market reports for every area"}`,t.heroLede],explore:[`${t.exploreTitle} · ${brand}`,t.exploreLede],
    areas:[`${t.areasTitle} · ${brand}`,t.areasLede],letters:[`${t.lettersTitle} · ${brand}`,t.lettersLede],afford:[`${t.affTitle} · ${brand}`,t.affLede],compare:[`${t.cmpTitle} · ${brand}`,t.cmpLede]};
  const [title,description]=names[pg]||names.home;return {title,description};
}
// Used by the build: pre-renders one page so its content is in the HTML before any script runs.
export function renderPage(data,route,language,base){
  if(D!==data)prepare(data);ROUTE=route;lang=language;BASE=base;
  const p=route.split(".");return {html:pageHtml(p),shell:shellParts(p),meta:pageMeta(p),brand:{name:T().brand,sub:T().sub,badge:T().badge}};
}
export const routeHelpers={pathFor,slug,TSLUG};
export const letterFeedItem=(data,i,language)=>{if(D!==data)prepare(data);lang=language;const lt=letter(i);return {title:lt.head,summary:lt.paras[0],month:D.months[i]}};
export const areaRoutes=data=>{if(D!==data)prepare(data);const out=[];for(const x of TREE)D.types.forEach((_,k)=>{if(ser(x.c,k))out.push(`area.${slug(x.c)}.${k}`)});return out};

function render(){
  if(!D)return;const p=route();killCharts();shell(p);const pg=p[0];
  if(pg==="areas"){app.innerHTML=pageAreas();let ti=0;const go=()=>fillAreas(ti,$("q").value);$("q").oninput=go;onSeg("aType",b=>{ti=+b.dataset.v;go()});go()}
  else if(pg==="area"){app.innerHTML=pageArea(p);drawAreaCharts(p,"all");wireCost();if($("rangeSeg"))onSeg("rangeSeg",b=>drawAreaCharts(p,b.dataset.v))}
  else if(pg==="explore"){app.innerHTML=pageExplore();$("sArea").onchange=$("sType").onchange=drawExplore;onSeg("pRange",b=>{exRange=b.dataset.v;drawExplore()});exRange="all";drawExplore();$("lbType").onchange=drawLb;onSeg("lbSeg",drawLb);drawLb()}
  else if(pg==="letters"){app.innerHTML=pageLetters()}
  else if(pg==="letter"){app.innerHTML=pageLetter(p);let i=D.months.indexOf(p[1]);if(i<0)i=L();$("mkPoster").onclick=()=>showPoster(i,"numbers");$("mkSummary").onclick=()=>showPoster(i,"summary");$("cpSummary").onclick=()=>copySummary(i);$("lType").onchange=()=>drawLetterChart(i);drawLetterChart(i);if($("lmType")){const f=ti=>$("lMovers").innerHTML=moversBlock(i,ti,4);onSeg("lmType",b=>f(+b.dataset.v));f(1)}}
  else if(pg==="afford"){affShowAll=false;app.innerHTML=pageAfford();wireAfford()}
  else if(pg==="compare"){app.innerHTML=pageCompare();[0,1,2,3].forEach(k=>$("cmp"+k).onchange=drawCompare);$("cmpT").onchange=drawCompare;drawCompare()}
  else{app.innerHTML=pageHome();$("pick").onsubmit=e=>{e.preventDefault();const c=$("pArea").value;let ti=+$("pType").value;if(!ser(c,ti))ti=0;location.href=h(`area.${slug(c)}.${ti}`)};
    const hm=()=>$("hmList").innerHTML=moversBlock(L(),+$("hmType").value,4);$("hmType").onchange=hm;hm();
    const pp=()=>{const ti=+$("popType").value;$("popList").innerHTML=POPULAR.map(c=>areaRow(c,ti)).join("")};$("popType").onchange=pp;pp()}
  if(tourStep>=0)drawTour();else{if($("welcome"))$("welcome").remove();setTimeout(showWelcome,700)}
}
function boot(){
  const b=document.body.dataset;ROUTE=b.route;lang=b.lang;BASE=b.base;app=$("app");
  if(ROUTE==="home"&&lang==="en"){
    // Links to the original dashboard carried filters in the address (?city=…); send those to the legacy page.
    if(/[?&](city|type|from|to|price|vol)=/.test(location.search)){location.replace(BASE+"legacy/"+location.search);return}
    if(savedLang()==="zh"){location.replace(BASE+"zh/");return}
  }
  try{if(sessionStorage.getItem("gta-start-tour")==="1"){sessionStorage.removeItem("gta-start-tour");if(ROUTE==="home")tourStep=0}}catch(e){}
  $("langBtn").onclick=()=>{saveLang(lang==="zh"?"en":"zh");location.href=langHref()};
  addEventListener("resize",replaceTour);addEventListener("scroll",replaceTour,{passive:true});
  document.addEventListener("click",e=>{if(e.target.closest("[data-start-tour]"))startTour()});
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",render);
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  fetch(BASE+"data/site-data.json").then(r=>r.json()).then(j=>{prepare(j);render()}).catch(e=>{console.error(e)});
}
if(typeof document!=="undefined")boot();
