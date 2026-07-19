import"./modulepreload-polyfill-B5Qt9EMX.js";import{S as m,H as v,D as b,P as $,W as F,a as y,V as S}from"./three.module-CCfylkh_.js";import{f as k}from"./floraPrimitives-DoYoi1l7.js";import"./random-CVcU7mnd.js";const h=new URLSearchParams(window.location.search).get("debug"),C=new URLSearchParams(window.location.search).has("debug")&&h!=="0"&&h!=="false";if(!C)throw document.body.innerHTML=`
          <main class="debug-lock">
            <section class="debug-lock-card">
              <p class="eyebrow">DailyFlora debug gate</p>
              <h1>审美复盘只在 debug 版开放</h1>
              <p>在主页面 URL 加上 <code>?debug=1</code> 后，从右下角的“审美审核”按钮进入。普通观赏模式不显示这页入口。</p>
              <a class="pill" href="../?debug=1&amp;render=high&amp;density=high">打开 debug 版</a>
            </section>
          </main>
        `,new Error("Aesthetic review dashboard requires debug mode.");const T={blocked:"blocked","needs-work":"needs-work","needs-owner-review":"待用户验收",pass:"pass"},B={creativeDirector:"创意总监",artDirector:"美术指导",projectDirector:"项目主任",cto:"生成架构审查",shapeCurator:"花材库管理员"},w={DiskFlower:"盘状花",CosmosOpenFlower:"波斯菊/小面花型",LayeredDahliaFlower:"层叠大丽花/团瓣型",RuffledRoseFlower:"褶皱玫瑰型",StarPinwheelFlower:"星形/风车型",TulipCupFlower:"郁金香/杯型",TrumpetThroatFlower:"洋水仙管心型",FrilledNarcissusFlower:"褶边副冠水仙型",OrbitalPulseFlower:"星环脉冲花型",DaturaTrumpetFlower:"大喇叭型",OrchidButterflyFlower:"兰花/蝴蝶型",CallaCurledBract:"马蹄莲/卷曲苞片型",UmbelMiniCluster:"伞状/小簇型",FullHydrangeaCloud:"绣球/云团型",FruitPodCluster:"果材/荚果型",HangingBellFruit:"吊坠风铃果型",FoliageGrassBranch:"叶材/草线/枝条型",LayeredRoundFlower:"层叠圆花",SpikeFlower:"穗状花",OpenSculptureFlower:"开口雕塑花",ClusterFlower:"簇花",BerryCluster:"果材",AirFiller:"空气填充"},P={"disk-face-flower":"DiskFlower","cosmos-open-face":"CosmosOpenFlower","layered-dahlia-form":"LayeredDahliaFlower","ruffled-rose-form":"RuffledRoseFlower","star-pinwheel-form":"StarPinwheelFlower","tulip-cup-form":"TulipCupFlower","trumpet-throat-form":"TrumpetThroatFlower","frilled-narcissus-corona":"FrilledNarcissusFlower","datura-trumpet-form":"DaturaTrumpetFlower","orchid-butterfly-form":"OrchidButterflyFlower","calla-curled-bract":"CallaCurledBract","spike-vertical-form":"SpikeFlower","umbel-mini-cluster":"UmbelMiniCluster","hydrangea-cloud-cluster":"FullHydrangeaCloud","fruit-pod-form":"FruitPodCluster","hanging-bell-fruit":"HangingBellFruit","foliage-grass-branch":"FoliageGrassBranch"},H={DiskFlower:["#fff8e7","#f7edd2","#f0c83a","#7f8e3e"],CosmosOpenFlower:["#fffdf2","#f6efdc","#f4cf2e","#7f8e3e"],LayeredDahliaFlower:["#f8c9d8","#fff1f5","#e7a7bb","#86a762"],RuffledRoseFlower:["#f8b9cf","#fff3f6","#e77da0","#9bb36b"],StarPinwheelFlower:["#ff8b32","#ffd15a","#e9565d","#7aa65a"],TulipCupFlower:["#ffbf5a","#fff0c2","#f58aa2","#5d8a55"],TrumpetThroatFlower:["#fff9e8","#ffffff","#ffc847","#f08b36"],FrilledNarcissusFlower:["#fff4c8","#ffe8a7","#f3b13e","#ffd86a","#78a66a"],OrbitalPulseFlower:["#6cf4ff","#8f7bff","#ff63d8","#dcff6b","#375c58"],DaturaTrumpetFlower:["#ffffff","#f2e3ff","#8a5ab8","#58783f"],OrchidButterflyFlower:["#f8c8eb","#fff6fb","#e078b8","#cc8b4f"],CallaCurledBract:["#fff7df","#f6e8b5","#f2b84c","#6c8b57"],SpikeFlower:["#8bb8ff","#b699ff","#d9d1ff","#59775c"],UmbelMiniCluster:["#ffffff","#fff6d8","#e8f5ff","#89a86a"],FullHydrangeaCloud:["#c9eea8","#e9ffd4","#a9d981","#f3ffe6"],FruitPodCluster:["#4566d9","#273f91","#bbd1ff","#5f7a51"],HangingBellFruit:["#ff9f26","#ffd45d","#78a55a","#f7be45"],FoliageGrassBranch:["#5f8f62","#86b86f","#c6d88a","#2f573b"]},p=[];function a(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function d(r){return`<ul>${r.map(t=>`<li>${a(t)}</li>`).join("")}</ul>`}function f(r){return`<span class="status ${a(r)}">${a(T[r]||r)}</span>`}async function L(){try{const r=await fetch("../data/aesthetic-review-dashboard.json",{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}catch{const r=document.querySelector("#fallback-data");return JSON.parse(r.textContent)}}function R(r){const t=r.gate;document.querySelector("#gate-card").innerHTML=`
          <div>${f(t.status)}</div>
          <div>
            <h2>${a(t.title)}</h2>
            <p class="section-copy">${a(t.summary)}</p>
          </div>
          ${d(t.rules)}
          <div class="link-row">
            ${t.links.map(e=>`<a class="pill" href="${a(e.href)}">${a(e.label)}</a>`).join("")}
          </div>
        `}function D(r){document.querySelector("#role-grid").innerHTML=r.roles.map(t=>`
              <article class="panel">
                <h3>${a(t.name)}</h3>
                <p>${a(t.brief)}</p>
                <p><strong>状态：</strong>${a(t.status||"按需启用")}</p>
                <p><strong>启用频率：</strong>${a(t.cadence||"任务需要时")}</p>
                <p><strong>本次审计：</strong>${a(t.audit||"保留观察")}</p>
              </article>
            `).join("")}function M(r){document.querySelector("#primitive-grid").innerHTML=r.primitiveGate.map(t=>{const e=t.ownerStatus?`<p><strong>用户判定：</strong>${a(t.ownerStatus)}</p>`:"",s=t.ownerFeedback?`<p><strong>反馈口径：</strong>${a(t.ownerFeedback)}</p>`:"",i=t.ownerAcceptance?`<p><strong>验收结论：</strong>${a(t.ownerAcceptance)}</p>`:"";return`
                <article class="panel">
                  <div>${f(t.status)}</div>
                  <h3>${a(t.humanName)}</h3>
                  <p class="en">${a(t.primitive)}</p>
                  <p>${a(t.acceptance)}</p>
                  ${e}
                  ${s}
                  ${i}
                  <p><strong>下一步：</strong>${a(t.nextTask)}</p>
                </article>
              `}).join("")}function j(r){const t=r.reusableAestheticRules||[];document.querySelector("#rules-grid").innerHTML=t.map(e=>`
              <article class="panel">
                <h3>${a(e.title)}</h3>
                <p>${a(e.summary)}</p>
                <div class="subpanel">
                  <h4>原则</h4>
                  ${d(e.principles||[])}
                </div>
                <div class="subpanel">
                  <h4>拒绝信号</h4>
                  ${d(e.rejectSignals||[])}
                </div>
                <p><strong>验收：</strong>${a(e.ownerAcceptance||"")}</p>
              </article>
            `).join("")}function q(r){const t=r.dailyBouquetCorrections||[];document.querySelector("#daily-correction-grid").innerHTML=t.map(e=>`
              <article class="panel">
                <div>${f(e.status)}</div>
                <h3>${a(e.date)} · ${a(e.name)}</h3>
                <p><strong>用户反馈：</strong>${a(e.ownerFeedback)}</p>
                <p><strong>本轮修正：</strong>${a(e.correction)}</p>
                <a class="pill" href="${a(e.url)}">打开日期花束</a>
              </article>
            `).join("")}function G(r){const t=r.targetShapeVocabulary||[];document.querySelector("#shape-grid").innerHTML=t.map(e=>{const s=P[e.id]||"";return`
              <article class="panel">
                <div class="shape-preview">
                  <canvas data-shape-preview="${a(s)}" aria-label="${a(e.name)} model preview"></canvas>
                </div>
                <h3>${a(e.name)}</h3>
                <p class="en">${a(e.englishName||e.id)}</p>
                <p class="en">${a(e.id)}</p>
                <p><strong>对应模型：</strong>${a(w[s]||s||"未映射")}</p>
                <p><strong>例子：</strong>${a(e.examples)}</p>
                <p><strong>为什么需要：</strong>${a(e.whyNeeded)}</p>
              </article>
            `}).join("")}function A(r){const t=r.acceptedHybridVocabulary||[];document.querySelector("#accepted-hybrid-grid").innerHTML=t.map(e=>`
              <article class="panel">
                <div>${f(e.status)}</div>
                <div class="shape-preview">
                  <canvas data-shape-preview="${a(e.primitive)}" aria-label="${a(e.name)} model preview"></canvas>
                </div>
                <h3>${a(e.name)}</h3>
                <p class="en">${a(e.englishName)}</p>
                <p class="en">${a(e.primitive)} · ${a(e.id)}</p>
                <p><strong>正式分类：</strong>写实骨架 × 非现实配色</p>
                <p><strong>验收结论：</strong>${a(e.acceptance)}</p>
                <p><strong>登记说明：</strong>${a(e.ownerNote)}</p>
              </article>
            `).join("")}function N(r){const t=r.candidateShapeVocabulary||[];document.querySelector("#candidate-shape-grid").innerHTML=t.map(e=>`
              <article class="panel candidate-panel">
                <div>${f(e.status)}</div>
                <div class="shape-preview candidate-preview-link">
                  <a class="pill" href="./primitive-lab.html#candidate-title">打开独立 3D 候选验收窗口</a>
                </div>
                <h3>${a(e.name)}</h3>
                <p class="en">${a(e.englishName)}</p>
                <p class="en">${a(e.primitive)} · ${a(e.id)}</p>
                <p><strong>来源：</strong>${a(e.source)}</p>
                <p><strong>例子：</strong>${a(e.examples)}</p>
                <p><strong>为什么需要：</strong>${a(e.whyNeeded)}</p>
                <p><strong>验收口径：</strong>${a(e.acceptance)}</p>
                <p><strong>登记规则：</strong>${a(e.ownerNote)}</p>
              </article>
            `).join("")}function x(){p.splice(0,p.length),Array.from(document.querySelectorAll("[data-shape-preview]")).forEach(t=>{const e=t.dataset.shapePreview,s=k[e];if(!s)return;const i=new m;i.add(new v("#fff4dc","#182014",1.9));const l=new b("#ffffff",2.25);l.position.set(2.2,3.2,4.6),i.add(l);const n=new $(38,1,.1,20);n.position.set(0,.35,4.1),n.lookAt(0,.02,0);const o=new F({canvas:t,antialias:!0,alpha:!0});o.outputColorSpace=y,o.setPixelRatio(Math.min(window.devicePixelRatio,1.4));const c=s({seed:`dashboard-target-shape:${e}`,position:new S(0,0,0),scale:e==="FoliageGrassBranch"?.92:e==="SpikeFlower"?.84:e==="FrilledNarcissusFlower"?.9:1.02,colorPalette:H[e]||["#ffffff","#f7d78a","#80ad65","#cc8b4f"],openness:["OrchidButterflyFlower","TrumpetThroatFlower","FrilledNarcissusFlower","DaturaTrumpetFlower","CallaCurledBract"].includes(e)?.95:.7,density:["UmbelMiniCluster","FullHydrangeaCloud","FruitPodCluster","FoliageGrassBranch"].includes(e)?1.08:.92,curvature:["SpikeFlower","FoliageGrassBranch","CallaCurledBract"].includes(e)?.86:.42,role:["SpikeFlower","FoliageGrassBranch"].includes(e)?"line":"secondary"});c.rotation.x=["DiskFlower","CosmosOpenFlower","LayeredDahliaFlower","RuffledRoseFlower","StarPinwheelFlower","TrumpetThroatFlower","FrilledNarcissusFlower"].includes(e)?-.7:e==="FoliageGrassBranch"?-.34:-.1,e==="FoliageGrassBranch"&&(c.rotation.z=-.38),i.add(c),p.push({renderer:o,scene:i,camera:n,model:c,canvas:t,primitive:e})})}function g(){const r=performance.now()*.001;p.forEach(({renderer:t,scene:e,camera:s,model:i,canvas:l,primitive:n},o)=>{const c=Math.max(1,l.clientWidth),u=Math.max(1,l.clientHeight);(l.width!==Math.floor(c*t.getPixelRatio())||l.height!==Math.floor(u*t.getPixelRatio()))&&(t.setSize(c,u,!1),s.aspect=c/u,s.updateProjectionMatrix()),i.rotation.y=r*.22+o*.18,(n==="HangingBellFruit"||n==="FoliageGrassBranch")&&(i.rotation.y=r*.16+o*.12),t.render(e,s)}),window.requestAnimationFrame(g)}function O(r){return`
          <article class="group-card" data-kind="${a(r.kind)}" data-status="${a(r.status)}">
            <div class="thumb-strip">
              ${r.images.map(t=>`<img src="${a(t)}" alt="${a(r.title)} reference" loading="lazy" />`).join("")}
            </div>
            <div class="group-body">
              <div class="group-top">
                <div class="group-title">
                  <div class="kind">${a(r.kind)}</div>
                  <h3>${a(r.title)}</h3>
                  <div class="en">${a(r.englishTitle)}</div>
                </div>
                ${f(r.status)}
              </div>
              <p>${a(r.humanConclusion)}</p>
              <div class="primitive-list">
                ${r.primitives.map(t=>`<span class="pill">${a(w[t]||t)}</span>`).join("")}
              </div>
              <div class="link-row">
                ${r.referenceLinks.map(t=>`<a class="pill" href="${a(t.href)}">${a(t.label)}</a>`).join("")}
              </div>
              <div class="split">
                <div class="subpanel">
                  <h4>正向信号</h4>
                  ${d(r.positiveSignals)}
                </div>
                <div class="subpanel">
                  <h4>负向约束</h4>
                  ${d(r.negativeConstraints)}
                </div>
              </div>
              <div class="split">
                <div class="subpanel">
                  <h4>当前实现</h4>
                  <p>${a(r.currentImplementation)}</p>
                </div>
                <div class="subpanel">
                  <h4>未通过原因</h4>
                  <p>${a(r.failureReason)}</p>
                </div>
              </div>
              <div class="subpanel">
                <h4>下一步任务</h4>
                ${d(r.nextTasks)}
              </div>
              <div class="role-review">
                ${Object.entries(r.roleReview).map(([t,e])=>`
                      <div class="subpanel">
                        <h4>${a(B[t]||t)}</h4>
                        <p>${a(e)}</p>
                      </div>
                    `).join("")}
              </div>
            </div>
          </article>
        `}function E(r){const t=document.querySelector("#group-grid");t.innerHTML=r.reviewGroups.map(O).join("")}function U(){const r=[["all","全部"],["blocked","blocked"],["needs-work","needs-work"],["pass","pass"],["positive","正向"],["negative","反向"]];document.querySelector("#filters").innerHTML=r.map(([t,e],s)=>`
              <button class="filter-button" type="button" data-filter="${t}" aria-pressed="${s===0?"true":"false"}">
                ${e}
              </button>
            `).join("")}function V(){const r=Array.from(document.querySelectorAll(".filter-button")),t=Array.from(document.querySelectorAll(".group-card")),e=document.querySelector("#empty");r.forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.filter;r.forEach(n=>n.setAttribute("aria-pressed",String(n===s)));let l=0;t.forEach(n=>{const o=i==="all"||n.dataset.status===i||n.dataset.kind===i;n.classList.toggle("is-hidden",!o),o&&(l+=1)}),e.hidden=l>0})})}L().then(r=>{R(r),D(r),j(r),q(r),G(r),A(r),N(r),x(),g(),M(r),E(r),U(),V()});
//# sourceMappingURL=aestheticReviewDashboard-B0v1VBMs.js.map
