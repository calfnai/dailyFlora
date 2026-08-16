import"./modulepreload-polyfill-B5Qt9EMX.js";import{W as k}from"./three.module-DbrOcTXO.js";import{f as T}from"./floraPrimitives-CPewheSJ.js";import{S as R,H as P,D as H,P as L,a as B,V as j}from"./three.core-DEHjaKId.js";import"./random-CVcU7mnd.js";const v=new URLSearchParams(window.location.search).get("debug"),D=new URLSearchParams(window.location.search).has("debug")&&v!=="0"&&v!=="false";if(!D)throw document.body.innerHTML=`
          <main class="debug-lock">
            <section class="debug-lock-card">
              <p class="eyebrow">DailyFlora debug gate</p>
              <h1>审美复盘只在 debug 版开放</h1>
              <p>在主页面 URL 加上 <code>?debug=1</code> 后，从右下角的“审美审核”按钮进入。普通观赏模式不显示这页入口。</p>
              <a class="pill" href="../?debug=1&amp;render=high&amp;density=high">打开 debug 版</a>
            </section>
          </main>
        `,new Error("Aesthetic review dashboard requires debug mode.");const G={blocked:"blocked","needs-work":"needs-work","needs-owner-review":"待用户验收",reject:"不通过",pass:"pass","scifi-only":"SciFi only","display-bug":"显示 bug"},M={creativeDirector:"创意总监",artDirector:"美术指导",projectDirector:"项目主任",cto:"生成架构审查",shapeCurator:"花材库管理员"},$={DiskFlower:"盘状花",CosmosOpenFlower:"波斯菊/小面花型",LayeredDahliaFlower:"层叠大丽花/团瓣型",RuffledRoseFlower:"褶皱玫瑰型",StarPinwheelFlower:"星形/风车型",TulipCupFlower:"郁金香/杯型",TrumpetThroatFlower:"洋水仙管心型",FrilledNarcissusFlower:"褶边副冠水仙型",OrbitalPulseFlower:"星环脉冲花型",DaturaTrumpetFlower:"大喇叭型",OrchidButterflyFlower:"兰花/蝴蝶型",CallaCurledBract:"马蹄莲/卷曲苞片型",UmbelMiniCluster:"伞状/小簇型",FullHydrangeaCloud:"绣球/云团型",FruitPodCluster:"果材/荚果型",HangingBellFruit:"吊坠风铃果型",FoliageGrassBranch:"叶材/草线/枝条型",LayeredRoundFlower:"层叠圆花",SpikeFlower:"穗状花",OpenSculptureFlower:"开口雕塑花",ClusterFlower:"簇花",BerryCluster:"果材",AirFiller:"空气填充"},A={daisy:["雏菊","Daisy"],chamomile:["洋甘菊","Chamomile"],gerbera:["非洲菊","Gerbera Daisy"],sunflower:["太阳花","Sunflower"],anemone:["银莲花","Anemone"],cosmos:["波斯菊","Cosmos"],dahlia:["大丽花","Dahlia"],rose:["玫瑰","Rose"],ranunculus:["花毛茛","Ranunculus"],camellia:["山茶","Camellia"],peony:["牡丹","Peony"],"pompon-mum":["乒乓菊","Pompon Chrysanthemum"],tulip:["郁金香","Tulip"],narcissus:["洋水仙","Narcissus"],phalaenopsis:["蝴蝶兰","Phalaenopsis Orchid"],calla:["马蹄莲","Calla Lily"]},F={"disk-face-flower":"DiskFlower","cosmos-open-face":"CosmosOpenFlower","layered-dahlia-form":"LayeredDahliaFlower","ruffled-rose-form":"RuffledRoseFlower","star-pinwheel-form":"StarPinwheelFlower","tulip-cup-form":"TulipCupFlower","trumpet-throat-form":"TrumpetThroatFlower","frilled-narcissus-corona":"FrilledNarcissusFlower","datura-trumpet-form":"DaturaTrumpetFlower","orchid-butterfly-form":"OrchidButterflyFlower","calla-curled-bract":"CallaCurledBract","spike-vertical-form":"SpikeFlower","umbel-mini-cluster":"UmbelMiniCluster","hydrangea-cloud-cluster":"FullHydrangeaCloud","fruit-pod-form":"FruitPodCluster","hanging-bell-fruit":"HangingBellFruit","foliage-grass-branch":"FoliageGrassBranch"},q={DiskFlower:["#fff8e7","#f7edd2","#f0c83a","#7f8e3e"],CosmosOpenFlower:["#fffdf2","#f6efdc","#f4cf2e","#7f8e3e"],LayeredDahliaFlower:["#f8c9d8","#fff1f5","#e7a7bb","#86a762"],RuffledRoseFlower:["#f8b9cf","#fff3f6","#e77da0","#9bb36b"],StarPinwheelFlower:["#ff8b32","#ffd15a","#e9565d","#7aa65a"],TulipCupFlower:["#ffbf5a","#fff0c2","#f58aa2","#5d8a55"],TrumpetThroatFlower:["#fff9e8","#ffffff","#ffc847","#f08b36"],FrilledNarcissusFlower:["#fff4c8","#ffe8a7","#f3b13e","#ffd86a","#78a66a"],OrbitalPulseFlower:["#6cf4ff","#8f7bff","#ff63d8","#dcff6b","#375c58"],DaturaTrumpetFlower:["#ffffff","#f2e3ff","#8a5ab8","#58783f"],OrchidButterflyFlower:["#f8c8eb","#fff6fb","#e078b8","#cc8b4f"],CallaCurledBract:["#fff7df","#f6e8b5","#f2b84c","#6c8b57"],SpikeFlower:["#8bb8ff","#b699ff","#d9d1ff","#59775c"],UmbelMiniCluster:["#ffffff","#fff6d8","#e8f5ff","#89a86a"],FullHydrangeaCloud:["#c9eea8","#e9ffd4","#a9d981","#f3ffe6"],FruitPodCluster:["#4566d9","#273f91","#bbd1ff","#5f7a51"],HangingBellFruit:["#ff9f26","#ffd45d","#78a55a","#f7be45"],FoliageGrassBranch:["#5f8f62","#86b86f","#c6d88a","#2f573b"]},m=[];function t(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function h(e){return`<ul>${e.map(a=>`<li>${t(a)}</li>`).join("")}</ul>`}function f(e){return`<span class="status ${t(e)}">${t(G[e]||e)}</span>`}function I(e){return e.length?`<ul class="acceptance-list">${e.map(a=>`<li><a href="${t(a.href)}">${t(a.label)}</a>${a.status?f(a.status):""}</li>`).join("")}</ul>`:'<p class="acceptance-note">暂无记录。</p>'}function N(e){const a=e.acceptedRealisticFlowerGate||{},r=(a.flowerIds||[]).map(s=>{const[p,C]=A[s]||[s,s];return{label:`${p} · ${C}`,href:`./realistic-flower-lab.html?flower=${encodeURIComponent(s)}#flower-${encodeURIComponent(s)}`,status:"pass"}}),n=e.leafFoliageGate||{},i=(n.confirmedMembers||[]).map(s=>({label:`${s.cn} · ${s.en}`,href:`./leaf-flower-pairing-lab.html#flower-${encodeURIComponent(s.id)}`,status:"pass"})),c=e.primitiveGate||[],o={...Object.fromEntries(Object.entries(F).map(([s,p])=>[p,s])),OrbitalPulseFlower:"orbital-pulse-flower"},l=s=>c.filter(p=>p.status===s).map(p=>({label:p.humanName,href:`./primitive-lab.html?shape=${encodeURIComponent(o[p.primitive]||"")}#shape-${encodeURIComponent(o[p.primitive]||"")}`,status:s})),d=(e.candidateShapeVocabulary||[]).filter(s=>s.status==="pass").map(s=>({label:`${s.name} · ${s.englishName}`,href:`./primitive-lab.html?shape=${encodeURIComponent(s.id)}#shape-${encodeURIComponent(s.id)}`,status:"pass"})),u=l("pass"),w=l("scifi-only"),g=l("reject"),b=l("display-bug"),S=[{title:"R01-R16 写实花型",count:`${r.length} / 16`,note:a.ownerAcceptance||"本轮用户已确认。",items:r},{title:"普通花束可用 · C01 / 抽象",count:`${d.length+u.length} 项`,note:"C01 与 primitive pass 可作为普通花束候选；只通过颜色不等于形态通过。",items:[...d,...u]},{title:"花叶搭配",count:n.coverage||`${i.length} 组`,note:n.ownerAcceptance||"当前只记录搭配 LAB 中明确列出的关系。",items:i},{title:"仅 SciFi",count:`${w.length} 项`,note:"H01 星环脉冲花型和 01 盘状花保留在 SciFi，不进入普通花束。",items:w},{title:"不采用",count:`${g.length} 项`,note:"用户明确不通过；普通花束不生成。",items:g},{title:"显示 bug · 暂不入束",count:`${b.length} 项`,note:"13 绣球/云团型与 14 果材/荚果型先修复显示，再重新验收。",items:b}];document.querySelector("#flower-acceptance-overview").innerHTML=S.map(s=>`
            <article class="panel acceptance-card">
              <h3>${t(s.title)}</h3>
              <div class="acceptance-count">${t(s.count)}</div>
              ${I(s.items)}
              <p class="acceptance-note">${t(s.note)}</p>
            </article>
          `).join("")}async function O(){try{const e=await fetch("../data/aesthetic-review-dashboard.json",{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}catch{const e=document.querySelector("#fallback-data");return JSON.parse(e.textContent)}}function x(e){const a=e.gate;document.querySelector("#gate-card").innerHTML=`
          <div>${f(a.status)}</div>
          <div>
            <h2>${t(a.title)}</h2>
            <p class="section-copy">${t(a.summary)}</p>
          </div>
          ${h(a.rules)}
          <div class="link-row">
            ${a.links.map(r=>`<a class="pill" href="${t(r.href)}">${t(r.label)}</a>`).join("")}
          </div>
        `}function U(e){document.querySelector("#role-grid").innerHTML=e.roles.map(a=>`
              <article class="panel">
                <h3>${t(a.name)}</h3>
                <p>${t(a.brief)}</p>
                <p><strong>状态：</strong>${t(a.status||"按需启用")}</p>
                <p><strong>启用频率：</strong>${t(a.cadence||"任务需要时")}</p>
                <p><strong>本次审计：</strong>${t(a.audit||"保留观察")}</p>
              </article>
            `).join("")}function E(e){document.querySelector("#primitive-grid").innerHTML=e.primitiveGate.map(a=>{const r=a.ownerStatus?`<p><strong>用户判定：</strong>${t(a.ownerStatus)}</p>`:"",n=a.ownerFeedback?`<p><strong>反馈口径：</strong>${t(a.ownerFeedback)}</p>`:"",i=a.ownerAcceptance?`<p><strong>验收结论：</strong>${t(a.ownerAcceptance)}</p>`:"";return`
                <article class="panel">
                  <div>${f(a.status)}</div>
                  <h3>${t(a.humanName)}</h3>
                  <p class="en">${t(a.primitive)}</p>
                  <p>${t(a.acceptance)}</p>
                  ${r}
                  ${n}
                  ${i}
                  <p><strong>下一步：</strong>${t(a.nextTask)}</p>
                </article>
              `}).join("")}function V(e){const a=e.reusableAestheticRules||[];document.querySelector("#rules-grid").innerHTML=a.map(r=>`
              <article class="panel">
                <h3>${t(r.title)}</h3>
                <p>${t(r.summary)}</p>
                <div class="subpanel">
                  <h4>原则</h4>
                  ${h(r.principles||[])}
                </div>
                <div class="subpanel">
                  <h4>拒绝信号</h4>
                  ${h(r.rejectSignals||[])}
                </div>
                <p><strong>验收：</strong>${t(r.ownerAcceptance||"")}</p>
              </article>
            `).join("")}function z(e){const a=e.dailyBouquetCorrections||[];document.querySelector("#daily-correction-grid").innerHTML=a.map(r=>`
              <article class="panel">
                <div>${f(r.status)}</div>
                <h3>${t(r.date)} · ${t(r.name)}</h3>
                <p><strong>用户反馈：</strong>${t(r.ownerFeedback)}</p>
                <p><strong>本轮修正：</strong>${t(r.correction)}</p>
                <a class="pill route" href="${t(r.url)}">打开日期花束 · ${t((r.url||"").replace("../","/"))}</a>
              </article>
            `).join("")}function W(e){const a=e.targetShapeVocabulary||[];document.querySelector("#shape-grid").innerHTML=a.map(r=>{const n=F[r.id]||"";return`
              <article class="panel">
                <div class="shape-preview">
                  <canvas data-shape-preview="${t(n)}" aria-label="${t(r.name)} model preview"></canvas>
                </div>
                <h3>${t(r.name)}</h3>
                <p class="en">${t(r.englishName||r.id)}</p>
                <p class="en">${t(r.id)}</p>
                <p><strong>对应模型：</strong>${t($[n]||n||"未映射")}</p>
                <p><strong>例子：</strong>${t(r.examples)}</p>
                <p><strong>为什么需要：</strong>${t(r.whyNeeded)}</p>
              </article>
            `}).join("")}function J(e){const a=e.shapeVocabularyInventory||{reviewEntries:43,abstractCore:16,realisticConcrete:25,acceptedHybrid:1,candidate:1,note:"16 是核心抽象词表，不是全部花型数量。"},r=[["reviewEntries","审核记录"],["abstractCore","核心抽象"],["realisticConcrete","偏写实花型"],["acceptedHybrid","已验收混合"],["candidate","候选花型"]];document.querySelector("#shape-inventory").innerHTML=r.map(([n,i])=>`
          <article class="panel inventory-card">
            <strong>${t(a[n])}</strong>
            <span>${t(i)}</span>
          </article>
        `).join(""),document.querySelector("#shape-inventory-note").textContent=a.note||""}function K(e){const a=e.acceptedHybridVocabulary||[];document.querySelector("#accepted-hybrid-grid").innerHTML=a.map(r=>`
              <article class="panel">
                <div>${f(r.status)}</div>
                <div class="shape-preview">
                  <canvas data-shape-preview="${t(r.primitive)}" aria-label="${t(r.name)} model preview"></canvas>
                </div>
                <h3>${t(r.name)}</h3>
                <p class="en">${t(r.englishName)}</p>
                <p class="en">${t(r.primitive)} · ${t(r.id)}</p>
                <p><strong>正式分类：</strong>写实骨架 × 非现实配色</p>
                <p><strong>验收结论：</strong>${t(r.acceptance)}</p>
                <p><strong>登记说明：</strong>${t(r.ownerNote)}</p>
              </article>
            `).join("")}function Q(e){const a=e.candidateShapeVocabulary||[];document.querySelector("#candidate-shape-grid").innerHTML=a.map(r=>`
              <article class="panel candidate-panel">
                <div>${f(r.status)}</div>
                <div class="shape-preview candidate-preview-link">
                  <a class="pill" href="./primitive-lab.html#candidate-title">打开独立 3D 候选验收窗口</a>
                </div>
                <h3>${t(r.name)}</h3>
                <p class="en">${t(r.englishName)}</p>
                <p class="en">${t(r.primitive)} · ${t(r.id)}</p>
                <p><strong>来源：</strong>${t(r.source)}</p>
                <p><strong>例子：</strong>${t(r.examples)}</p>
                <p><strong>为什么需要：</strong>${t(r.whyNeeded)}</p>
                <p><strong>验收口径：</strong>${t(r.acceptance)}</p>
                <p><strong>登记规则：</strong>${t(r.ownerNote)}</p>
              </article>
            `).join("")}function X(){m.splice(0,m.length),Array.from(document.querySelectorAll("[data-shape-preview]")).forEach(a=>{const r=a.dataset.shapePreview,n=T[r];if(!n)return;const i=new R;i.add(new P("#fff4dc","#182014",1.9));const c=new H("#ffffff",2.25);c.position.set(2.2,3.2,4.6),i.add(c);const o=new L(38,1,.1,20);o.position.set(0,.35,4.1),o.lookAt(0,.02,0);const l=new k({canvas:a,antialias:!0,alpha:!0});l.outputColorSpace=B,l.setPixelRatio(Math.min(window.devicePixelRatio,1.4));const d=n({seed:`dashboard-target-shape:${r}`,position:new j(0,0,0),scale:r==="FoliageGrassBranch"?.92:r==="SpikeFlower"?.84:r==="FrilledNarcissusFlower"?.9:1.02,colorPalette:q[r]||["#ffffff","#f7d78a","#80ad65","#cc8b4f"],openness:["OrchidButterflyFlower","TrumpetThroatFlower","FrilledNarcissusFlower","DaturaTrumpetFlower","CallaCurledBract"].includes(r)?.95:.7,density:["UmbelMiniCluster","FullHydrangeaCloud","FruitPodCluster","FoliageGrassBranch"].includes(r)?1.08:.92,curvature:["SpikeFlower","FoliageGrassBranch","CallaCurledBract"].includes(r)?.86:.42,role:["SpikeFlower","FoliageGrassBranch"].includes(r)?"line":"secondary"});d.rotation.x=["DiskFlower","CosmosOpenFlower","LayeredDahliaFlower","RuffledRoseFlower","StarPinwheelFlower","TrumpetThroatFlower","FrilledNarcissusFlower"].includes(r)?-.7:r==="FoliageGrassBranch"?-.34:-.1,r==="FoliageGrassBranch"&&(d.rotation.z=-.38),i.add(d),m.push({renderer:l,scene:i,camera:o,model:d,canvas:a,primitive:r})})}function y(){const e=performance.now()*.001;m.forEach(({renderer:a,scene:r,camera:n,model:i,canvas:c,primitive:o},l)=>{const d=Math.max(1,c.clientWidth),u=Math.max(1,c.clientHeight);(c.width!==Math.floor(d*a.getPixelRatio())||c.height!==Math.floor(u*a.getPixelRatio()))&&(a.setSize(d,u,!1),n.aspect=d/u,n.updateProjectionMatrix()),i.rotation.y=e*.22+l*.18,(o==="HangingBellFruit"||o==="FoliageGrassBranch")&&(i.rotation.y=e*.16+l*.12),a.render(r,n)}),window.requestAnimationFrame(y)}function Y(e){return`
          <article class="group-card" data-kind="${t(e.kind)}" data-status="${t(e.status)}">
            <div class="thumb-strip">
              ${e.images.map(a=>`<img src="${t(a)}" alt="${t(e.title)} reference" loading="lazy" />`).join("")}
            </div>
            <div class="group-body">
              <div class="group-top">
                <div class="group-title">
                  <div class="kind">${t(e.kind)}</div>
                  <h3>${t(e.title)}</h3>
                  <div class="en">${t(e.englishTitle)}</div>
                </div>
                ${f(e.status)}
              </div>
              <p>${t(e.humanConclusion)}</p>
              <div class="primitive-list">
                ${e.primitives.map(a=>`<span class="pill">${t($[a]||a)}</span>`).join("")}
              </div>
              <div class="link-row">
                ${e.referenceLinks.map(a=>`<a class="pill" href="${t(a.href)}">${t(a.label)}</a>`).join("")}
              </div>
              <div class="split">
                <div class="subpanel">
                  <h4>正向信号</h4>
                  ${h(e.positiveSignals)}
                </div>
                <div class="subpanel">
                  <h4>负向约束</h4>
                  ${h(e.negativeConstraints)}
                </div>
              </div>
              <div class="split">
                <div class="subpanel">
                  <h4>当前实现</h4>
                  <p>${t(e.currentImplementation)}</p>
                </div>
                <div class="subpanel">
                  <h4>未通过原因</h4>
                  <p>${t(e.failureReason)}</p>
                </div>
              </div>
              <div class="subpanel">
                <h4>下一步任务</h4>
                ${h(e.nextTasks)}
              </div>
              <div class="role-review">
                ${Object.entries(e.roleReview).map(([a,r])=>`
                      <div class="subpanel">
                        <h4>${t(M[a]||a)}</h4>
                        <p>${t(r)}</p>
                      </div>
                    `).join("")}
              </div>
            </div>
          </article>
        `}function Z(e){const a=document.querySelector("#group-grid");a.innerHTML=e.reviewGroups.map(Y).join("")}function _(){const e=[["all","全部"],["blocked","blocked"],["needs-work","needs-work"],["pass","pass"],["positive","正向"],["negative","反向"]];document.querySelector("#filters").innerHTML=e.map(([a,r],n)=>`
              <button class="filter-button" type="button" data-filter="${a}" aria-pressed="${n===0?"true":"false"}">
                ${r}
              </button>
            `).join("")}function ee(){const e=Array.from(document.querySelectorAll(".filter-button")),a=Array.from(document.querySelectorAll(".group-card")),r=document.querySelector("#empty");e.forEach(n=>{n.addEventListener("click",()=>{const i=n.dataset.filter;e.forEach(o=>o.setAttribute("aria-pressed",String(o===n)));let c=0;a.forEach(o=>{const l=i==="all"||o.dataset.status===i||o.dataset.kind===i;o.classList.toggle("is-hidden",!l),l&&(c+=1)}),r.hidden=c>0})})}O().then(e=>{x(e),N(e),U(e),V(e),z(e),J(e),W(e),K(e),Q(e),E(e),Z(e),_(),ee();try{X(),y()}catch(a){console.warn("Dashboard 3D previews unavailable; text gate remains available.",a)}});
//# sourceMappingURL=aestheticReviewDashboard-XkEJt593.js.map
