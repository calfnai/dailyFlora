import{S as m,H as b,D as v,P as F,W as $,a as y,V as S,f as k}from"./floraPrimitives-4rXDGYNg.js";const h=new URLSearchParams(window.location.search).get("debug"),C=new URLSearchParams(window.location.search).has("debug")&&h!=="0"&&h!=="false";if(!C)throw document.body.innerHTML=`
          <main class="debug-lock">
            <section class="debug-lock-card">
              <p class="eyebrow">DailyFlora debug gate</p>
              <h1>审美复盘只在 debug 版开放</h1>
              <p>在主页面 URL 加上 <code>?debug=1</code> 后，从右下角的“审美审核”按钮进入。普通观赏模式不显示这页入口。</p>
              <a class="pill" href="../?debug=1">打开 debug 版</a>
            </section>
          </main>
        `,new Error("Aesthetic review dashboard requires debug mode.");const T={blocked:"blocked","needs-work":"needs-work","needs-owner-review":"待用户验收",pass:"pass"},B={creativeDirector:"创意总监",artDirector:"美术指导",projectDirector:"项目主任",cto:"生成架构审查",shapeCurator:"花材库管理员"},w={DiskFlower:"盘状花",CosmosOpenFlower:"波斯菊/小面花型",LayeredDahliaFlower:"层叠大丽花/团瓣型",RuffledRoseFlower:"褶皱玫瑰型",StarPinwheelFlower:"星形/风车型",TulipCupFlower:"郁金香/杯型",TrumpetThroatFlower:"洋水仙管心型",FrilledNarcissusFlower:"褶边副冠水仙型",DaturaTrumpetFlower:"大喇叭型",OrchidButterflyFlower:"兰花/蝴蝶型",CallaCurledBract:"马蹄莲/卷曲苞片型",UmbelMiniCluster:"伞状/小簇型",FullHydrangeaCloud:"绣球/云团型",FruitPodCluster:"果材/荚果型",HangingBellFruit:"吊坠风铃果型",FoliageGrassBranch:"叶材/草线/枝条型",LayeredRoundFlower:"层叠圆花",SpikeFlower:"穗状花",OpenSculptureFlower:"开口雕塑花",ClusterFlower:"簇花",BerryCluster:"果材",AirFiller:"空气填充"},P={"disk-face-flower":"DiskFlower","cosmos-open-face":"CosmosOpenFlower","layered-dahlia-form":"LayeredDahliaFlower","ruffled-rose-form":"RuffledRoseFlower","star-pinwheel-form":"StarPinwheelFlower","tulip-cup-form":"TulipCupFlower","trumpet-throat-form":"TrumpetThroatFlower","frilled-narcissus-corona":"FrilledNarcissusFlower","datura-trumpet-form":"DaturaTrumpetFlower","orchid-butterfly-form":"OrchidButterflyFlower","calla-curled-bract":"CallaCurledBract","spike-vertical-form":"SpikeFlower","umbel-mini-cluster":"UmbelMiniCluster","hydrangea-cloud-cluster":"FullHydrangeaCloud","fruit-pod-form":"FruitPodCluster","hanging-bell-fruit":"HangingBellFruit","foliage-grass-branch":"FoliageGrassBranch"},L={DiskFlower:["#fff8e7","#f7edd2","#f0c83a","#7f8e3e"],CosmosOpenFlower:["#fffdf2","#f6efdc","#f4cf2e","#7f8e3e"],LayeredDahliaFlower:["#f8c9d8","#fff1f5","#e7a7bb","#86a762"],RuffledRoseFlower:["#f8b9cf","#fff3f6","#e77da0","#9bb36b"],StarPinwheelFlower:["#ff8b32","#ffd15a","#e9565d","#7aa65a"],TulipCupFlower:["#ffbf5a","#fff0c2","#f58aa2","#5d8a55"],TrumpetThroatFlower:["#fff9e8","#ffffff","#ffc847","#f08b36"],FrilledNarcissusFlower:["#fff4c8","#ffe8a7","#f3b13e","#ffd86a","#78a66a"],DaturaTrumpetFlower:["#ffffff","#f2e3ff","#8a5ab8","#58783f"],OrchidButterflyFlower:["#f8c8eb","#fff6fb","#e078b8","#cc8b4f"],CallaCurledBract:["#fff7df","#f6e8b5","#f2b84c","#6c8b57"],SpikeFlower:["#8bb8ff","#b699ff","#d9d1ff","#59775c"],UmbelMiniCluster:["#ffffff","#fff6d8","#e8f5ff","#89a86a"],FullHydrangeaCloud:["#c9eea8","#e9ffd4","#a9d981","#f3ffe6"],FruitPodCluster:["#4566d9","#273f91","#bbd1ff","#5f7a51"],HangingBellFruit:["#ff9f26","#ffd45d","#78a55a","#f7be45"],FoliageGrassBranch:["#5f8f62","#86b86f","#c6d88a","#2f573b"]},u=[];function t(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function d(e){return`<ul>${e.map(a=>`<li>${t(a)}</li>`).join("")}</ul>`}function f(e){return`<span class="status ${t(e)}">${t(T[e]||e)}</span>`}async function R(){try{const e=await fetch("../data/aesthetic-review-dashboard.json",{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}catch{const e=document.querySelector("#fallback-data");return JSON.parse(e.textContent)}}function D(e){const a=e.gate;document.querySelector("#gate-card").innerHTML=`
          <div>${f(a.status)}</div>
          <div>
            <h2>${t(a.title)}</h2>
            <p class="section-copy">${t(a.summary)}</p>
          </div>
          ${d(a.rules)}
          <div class="link-row">
            ${a.links.map(r=>`<a class="pill" href="${t(r.href)}">${t(r.label)}</a>`).join("")}
          </div>
        `}function H(e){document.querySelector("#role-grid").innerHTML=e.roles.map(a=>`
              <article class="panel">
                <h3>${t(a.name)}</h3>
                <p>${t(a.brief)}</p>
                <p><strong>状态：</strong>${t(a.status||"按需启用")}</p>
                <p><strong>启用频率：</strong>${t(a.cadence||"任务需要时")}</p>
                <p><strong>本次审计：</strong>${t(a.audit||"保留观察")}</p>
              </article>
            `).join("")}function M(e){document.querySelector("#primitive-grid").innerHTML=e.primitiveGate.map(a=>{const r=a.ownerStatus?`<p><strong>用户判定：</strong>${t(a.ownerStatus)}</p>`:"",s=a.ownerFeedback?`<p><strong>反馈口径：</strong>${t(a.ownerFeedback)}</p>`:"",i=a.ownerAcceptance?`<p><strong>验收结论：</strong>${t(a.ownerAcceptance)}</p>`:"";return`
                <article class="panel">
                  <div>${f(a.status)}</div>
                  <h3>${t(a.humanName)}</h3>
                  <p class="en">${t(a.primitive)}</p>
                  <p>${t(a.acceptance)}</p>
                  ${r}
                  ${s}
                  ${i}
                  <p><strong>下一步：</strong>${t(a.nextTask)}</p>
                </article>
              `}).join("")}function j(e){const a=e.reusableAestheticRules||[];document.querySelector("#rules-grid").innerHTML=a.map(r=>`
              <article class="panel">
                <h3>${t(r.title)}</h3>
                <p>${t(r.summary)}</p>
                <div class="subpanel">
                  <h4>原则</h4>
                  ${d(r.principles||[])}
                </div>
                <div class="subpanel">
                  <h4>拒绝信号</h4>
                  ${d(r.rejectSignals||[])}
                </div>
                <p><strong>验收：</strong>${t(r.ownerAcceptance||"")}</p>
              </article>
            `).join("")}function q(e){const a=e.dailyBouquetCorrections||[];document.querySelector("#daily-correction-grid").innerHTML=a.map(r=>`
              <article class="panel">
                <div>${f(r.status)}</div>
                <h3>${t(r.date)} · ${t(r.name)}</h3>
                <p><strong>用户反馈：</strong>${t(r.ownerFeedback)}</p>
                <p><strong>本轮修正：</strong>${t(r.correction)}</p>
                <a class="pill" href="${t(r.url)}">打开日期花束</a>
              </article>
            `).join("")}function G(e){const a=e.targetShapeVocabulary||[];document.querySelector("#shape-grid").innerHTML=a.map(r=>{const s=P[r.id]||"";return`
              <article class="panel">
                <div class="shape-preview">
                  <canvas data-shape-preview="${t(s)}" aria-label="${t(r.name)} model preview"></canvas>
                </div>
                <h3>${t(r.name)}</h3>
                <p class="en">${t(r.englishName||r.id)}</p>
                <p class="en">${t(r.id)}</p>
                <p><strong>对应模型：</strong>${t(w[s]||s||"未映射")}</p>
                <p><strong>例子：</strong>${t(r.examples)}</p>
                <p><strong>为什么需要：</strong>${t(r.whyNeeded)}</p>
              </article>
            `}).join("")}function A(e){const a=e.candidateShapeVocabulary||[];document.querySelector("#candidate-shape-grid").innerHTML=a.map(r=>`
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
            `).join("")}function N(){u.splice(0,u.length),Array.from(document.querySelectorAll("[data-shape-preview]")).forEach(a=>{const r=a.dataset.shapePreview,s=k[r];if(!s)return;const i=new m;i.add(new b("#fff4dc","#182014",1.9));const o=new v("#ffffff",2.25);o.position.set(2.2,3.2,4.6),i.add(o);const l=new F(38,1,.1,20);l.position.set(0,.35,4.1),l.lookAt(0,.02,0);const n=new $({canvas:a,antialias:!0,alpha:!0});n.outputColorSpace=y,n.setPixelRatio(Math.min(window.devicePixelRatio,1.4));const c=s({seed:`dashboard-target-shape:${r}`,position:new S(0,0,0),scale:r==="FoliageGrassBranch"?.92:r==="SpikeFlower"?.84:r==="FrilledNarcissusFlower"?.9:1.02,colorPalette:L[r]||["#ffffff","#f7d78a","#80ad65","#cc8b4f"],openness:["OrchidButterflyFlower","TrumpetThroatFlower","FrilledNarcissusFlower","DaturaTrumpetFlower","CallaCurledBract"].includes(r)?.95:.7,density:["UmbelMiniCluster","FullHydrangeaCloud","FruitPodCluster","FoliageGrassBranch"].includes(r)?1.08:.92,curvature:["SpikeFlower","FoliageGrassBranch","CallaCurledBract"].includes(r)?.86:.42,role:["SpikeFlower","FoliageGrassBranch"].includes(r)?"line":"secondary"});c.rotation.x=["DiskFlower","CosmosOpenFlower","LayeredDahliaFlower","RuffledRoseFlower","StarPinwheelFlower","TrumpetThroatFlower","FrilledNarcissusFlower"].includes(r)?-.7:r==="FoliageGrassBranch"?-.34:-.1,r==="FoliageGrassBranch"&&(c.rotation.z=-.38),i.add(c),u.push({renderer:n,scene:i,camera:l,model:c,canvas:a,primitive:r})})}function g(){const e=performance.now()*.001;u.forEach(({renderer:a,scene:r,camera:s,model:i,canvas:o,primitive:l},n)=>{const c=Math.max(1,o.clientWidth),p=Math.max(1,o.clientHeight);(o.width!==Math.floor(c*a.getPixelRatio())||o.height!==Math.floor(p*a.getPixelRatio()))&&(a.setSize(c,p,!1),s.aspect=c/p,s.updateProjectionMatrix()),i.rotation.y=e*.22+n*.18,(l==="HangingBellFruit"||l==="FoliageGrassBranch")&&(i.rotation.y=e*.16+n*.12),a.render(r,s)}),window.requestAnimationFrame(g)}function x(e){return`
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
                ${e.primitives.map(a=>`<span class="pill">${t(w[a]||a)}</span>`).join("")}
              </div>
              <div class="link-row">
                ${e.referenceLinks.map(a=>`<a class="pill" href="${t(a.href)}">${t(a.label)}</a>`).join("")}
              </div>
              <div class="split">
                <div class="subpanel">
                  <h4>正向信号</h4>
                  ${d(e.positiveSignals)}
                </div>
                <div class="subpanel">
                  <h4>负向约束</h4>
                  ${d(e.negativeConstraints)}
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
                ${d(e.nextTasks)}
              </div>
              <div class="role-review">
                ${Object.entries(e.roleReview).map(([a,r])=>`
                      <div class="subpanel">
                        <h4>${t(B[a]||a)}</h4>
                        <p>${t(r)}</p>
                      </div>
                    `).join("")}
              </div>
            </div>
          </article>
        `}function O(e){const a=document.querySelector("#group-grid");a.innerHTML=e.reviewGroups.map(x).join("")}function E(){const e=[["all","全部"],["blocked","blocked"],["needs-work","needs-work"],["pass","pass"],["positive","正向"],["negative","反向"]];document.querySelector("#filters").innerHTML=e.map(([a,r],s)=>`
              <button class="filter-button" type="button" data-filter="${a}" aria-pressed="${s===0?"true":"false"}">
                ${r}
              </button>
            `).join("")}function U(){const e=Array.from(document.querySelectorAll(".filter-button")),a=Array.from(document.querySelectorAll(".group-card")),r=document.querySelector("#empty");e.forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.filter;e.forEach(l=>l.setAttribute("aria-pressed",String(l===s)));let o=0;a.forEach(l=>{const n=i==="all"||l.dataset.status===i||l.dataset.kind===i;l.classList.toggle("is-hidden",!n),n&&(o+=1)}),r.hidden=o>0})})}R().then(e=>{D(e),H(e),j(e),q(e),G(e),A(e),N(),g(),M(e),O(e),E(),U()});
//# sourceMappingURL=aestheticReviewDashboard-DLBua9Ul.js.map
