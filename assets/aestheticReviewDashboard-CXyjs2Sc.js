import{S as g,H as b,D as v,P as F,W as $,a as y,V as S,f as k}from"./floraPrimitives-BORtS2FS.js";const h=new URLSearchParams(window.location.search).get("debug"),C=new URLSearchParams(window.location.search).has("debug")&&h!=="0"&&h!=="false";if(!C)throw document.body.innerHTML=`
          <main class="debug-lock">
            <section class="debug-lock-card">
              <p class="eyebrow">DailyFlora debug gate</p>
              <h1>审美复盘只在 debug 版开放</h1>
              <p>在主页面 URL 加上 <code>?debug=1</code> 后，从右下角的“审美审核”按钮进入。普通观赏模式不显示这页入口。</p>
              <a class="pill" href="../?debug=1">打开 debug 版</a>
            </section>
          </main>
        `,new Error("Aesthetic review dashboard requires debug mode.");const T={blocked:"blocked","needs-work":"needs-work","needs-owner-review":"待用户验收",pass:"pass"},B={creativeDirector:"创意总监",artDirector:"美术指导",projectDirector:"项目主任",cto:"生成架构审查",shapeCurator:"花材库管理员"},w={DiskFlower:"盘状花",CosmosOpenFlower:"波斯菊/小面花型",LayeredDahliaFlower:"层叠大丽花/团瓣型",RuffledRoseFlower:"褶皱玫瑰型",StarPinwheelFlower:"星形/风车型",TulipCupFlower:"郁金香/杯型",TrumpetThroatFlower:"洋水仙管心型",FrilledNarcissusFlower:"褶边副冠水仙型",DaturaTrumpetFlower:"大喇叭型",OrchidButterflyFlower:"兰花/蝴蝶型",CallaCurledBract:"马蹄莲/卷曲苞片型",UmbelMiniCluster:"伞状/小簇型",FullHydrangeaCloud:"绣球/云团型",FruitPodCluster:"果材/荚果型",HangingBellFruit:"吊坠风铃果型",FoliageGrassBranch:"叶材/草线/枝条型",LayeredRoundFlower:"层叠圆花",SpikeFlower:"穗状花",OpenSculptureFlower:"开口雕塑花",ClusterFlower:"簇花",BerryCluster:"果材",AirFiller:"空气填充"},P={"disk-face-flower":"DiskFlower","cosmos-open-face":"CosmosOpenFlower","layered-dahlia-form":"LayeredDahliaFlower","ruffled-rose-form":"RuffledRoseFlower","star-pinwheel-form":"StarPinwheelFlower","tulip-cup-form":"TulipCupFlower","trumpet-throat-form":"TrumpetThroatFlower","frilled-narcissus-corona":"FrilledNarcissusFlower","datura-trumpet-form":"DaturaTrumpetFlower","orchid-butterfly-form":"OrchidButterflyFlower","calla-curled-bract":"CallaCurledBract","spike-vertical-form":"SpikeFlower","umbel-mini-cluster":"UmbelMiniCluster","hydrangea-cloud-cluster":"FullHydrangeaCloud","fruit-pod-form":"FruitPodCluster","hanging-bell-fruit":"HangingBellFruit","foliage-grass-branch":"FoliageGrassBranch"},L={DiskFlower:["#fff8e7","#f7edd2","#f0c83a","#7f8e3e"],CosmosOpenFlower:["#fffdf2","#f6efdc","#f4cf2e","#7f8e3e"],LayeredDahliaFlower:["#f8c9d8","#fff1f5","#e7a7bb","#86a762"],RuffledRoseFlower:["#f8b9cf","#fff3f6","#e77da0","#9bb36b"],StarPinwheelFlower:["#ff8b32","#ffd15a","#e9565d","#7aa65a"],TulipCupFlower:["#ffbf5a","#fff0c2","#f58aa2","#5d8a55"],TrumpetThroatFlower:["#fff9e8","#ffffff","#ffc847","#f08b36"],FrilledNarcissusFlower:["#fff4c8","#ffe8a7","#f3b13e","#ffd86a","#78a66a"],DaturaTrumpetFlower:["#ffffff","#f2e3ff","#8a5ab8","#58783f"],OrchidButterflyFlower:["#f8c8eb","#fff6fb","#e078b8","#cc8b4f"],CallaCurledBract:["#fff7df","#f6e8b5","#f2b84c","#6c8b57"],SpikeFlower:["#8bb8ff","#b699ff","#d9d1ff","#59775c"],UmbelMiniCluster:["#ffffff","#fff6d8","#e8f5ff","#89a86a"],FullHydrangeaCloud:["#c9eea8","#e9ffd4","#a9d981","#f3ffe6"],FruitPodCluster:["#4566d9","#273f91","#bbd1ff","#5f7a51"],HangingBellFruit:["#ff9f26","#ffd45d","#78a55a","#f7be45"],FoliageGrassBranch:["#5f8f62","#86b86f","#c6d88a","#2f573b"]},f=[];function t(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function d(e){return`<ul>${e.map(r=>`<li>${t(r)}</li>`).join("")}</ul>`}function u(e){return`<span class="status ${t(e)}">${t(T[e]||e)}</span>`}async function R(){try{const e=await fetch("../data/aesthetic-review-dashboard.json",{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}catch{const e=document.querySelector("#fallback-data");return JSON.parse(e.textContent)}}function D(e){const r=e.gate;document.querySelector("#gate-card").innerHTML=`
          <div>${u(r.status)}</div>
          <div>
            <h2>${t(r.title)}</h2>
            <p class="section-copy">${t(r.summary)}</p>
          </div>
          ${d(r.rules)}
          <div class="link-row">
            ${r.links.map(a=>`<a class="pill" href="${t(a.href)}">${t(a.label)}</a>`).join("")}
          </div>
        `}function H(e){document.querySelector("#role-grid").innerHTML=e.roles.map(r=>`
              <article class="panel">
                <h3>${t(r.name)}</h3>
                <p>${t(r.brief)}</p>
              </article>
            `).join("")}function M(e){document.querySelector("#primitive-grid").innerHTML=e.primitiveGate.map(r=>{const a=r.ownerStatus?`<p><strong>用户判定：</strong>${t(r.ownerStatus)}</p>`:"",s=r.ownerFeedback?`<p><strong>反馈口径：</strong>${t(r.ownerFeedback)}</p>`:"",i=r.ownerAcceptance?`<p><strong>验收结论：</strong>${t(r.ownerAcceptance)}</p>`:"";return`
                <article class="panel">
                  <div>${u(r.status)}</div>
                  <h3>${t(r.humanName)}</h3>
                  <p class="en">${t(r.primitive)}</p>
                  <p>${t(r.acceptance)}</p>
                  ${a}
                  ${s}
                  ${i}
                  <p><strong>下一步：</strong>${t(r.nextTask)}</p>
                </article>
              `}).join("")}function j(e){const r=e.reusableAestheticRules||[];document.querySelector("#rules-grid").innerHTML=r.map(a=>`
              <article class="panel">
                <h3>${t(a.title)}</h3>
                <p>${t(a.summary)}</p>
                <div class="subpanel">
                  <h4>原则</h4>
                  ${d(a.principles||[])}
                </div>
                <div class="subpanel">
                  <h4>拒绝信号</h4>
                  ${d(a.rejectSignals||[])}
                </div>
                <p><strong>验收：</strong>${t(a.ownerAcceptance||"")}</p>
              </article>
            `).join("")}function G(e){const r=e.targetShapeVocabulary||[];document.querySelector("#shape-grid").innerHTML=r.map(a=>{const s=P[a.id]||"";return`
              <article class="panel">
                <div class="shape-preview">
                  <canvas data-shape-preview="${t(s)}" aria-label="${t(a.name)} model preview"></canvas>
                </div>
                <h3>${t(a.name)}</h3>
                <p class="en">${t(a.englishName||a.id)}</p>
                <p class="en">${t(a.id)}</p>
                <p><strong>对应模型：</strong>${t(w[s]||s||"未映射")}</p>
                <p><strong>例子：</strong>${t(a.examples)}</p>
                <p><strong>为什么需要：</strong>${t(a.whyNeeded)}</p>
              </article>
            `}).join("")}function q(e){const r=e.candidateShapeVocabulary||[];document.querySelector("#candidate-shape-grid").innerHTML=r.map(a=>`
              <article class="panel candidate-panel">
                <div>${u(a.status)}</div>
                <div class="shape-preview candidate-preview-link">
                  <a class="pill" href="./primitive-lab.html#candidate-title">打开独立 3D 候选验收窗口</a>
                </div>
                <h3>${t(a.name)}</h3>
                <p class="en">${t(a.englishName)}</p>
                <p class="en">${t(a.primitive)} · ${t(a.id)}</p>
                <p><strong>来源：</strong>${t(a.source)}</p>
                <p><strong>例子：</strong>${t(a.examples)}</p>
                <p><strong>为什么需要：</strong>${t(a.whyNeeded)}</p>
                <p><strong>验收口径：</strong>${t(a.acceptance)}</p>
                <p><strong>登记规则：</strong>${t(a.ownerNote)}</p>
              </article>
            `).join("")}function A(){f.splice(0,f.length),Array.from(document.querySelectorAll("[data-shape-preview]")).forEach(r=>{const a=r.dataset.shapePreview,s=k[a];if(!s)return;const i=new g;i.add(new b("#fff4dc","#182014",1.9));const o=new v("#ffffff",2.25);o.position.set(2.2,3.2,4.6),i.add(o);const l=new F(38,1,.1,20);l.position.set(0,.35,4.1),l.lookAt(0,.02,0);const n=new $({canvas:r,antialias:!0,alpha:!0});n.outputColorSpace=y,n.setPixelRatio(Math.min(window.devicePixelRatio,1.4));const c=s({seed:`dashboard-target-shape:${a}`,position:new S(0,0,0),scale:a==="FoliageGrassBranch"?.92:a==="SpikeFlower"?.84:a==="FrilledNarcissusFlower"?.9:1.02,colorPalette:L[a]||["#ffffff","#f7d78a","#80ad65","#cc8b4f"],openness:["OrchidButterflyFlower","TrumpetThroatFlower","FrilledNarcissusFlower","DaturaTrumpetFlower","CallaCurledBract"].includes(a)?.95:.7,density:["UmbelMiniCluster","FullHydrangeaCloud","FruitPodCluster","FoliageGrassBranch"].includes(a)?1.08:.92,curvature:["SpikeFlower","FoliageGrassBranch","CallaCurledBract"].includes(a)?.86:.42,role:["SpikeFlower","FoliageGrassBranch"].includes(a)?"line":"secondary"});c.rotation.x=["DiskFlower","CosmosOpenFlower","LayeredDahliaFlower","RuffledRoseFlower","StarPinwheelFlower","TrumpetThroatFlower","FrilledNarcissusFlower"].includes(a)?-.7:a==="FoliageGrassBranch"?-.34:-.1,a==="FoliageGrassBranch"&&(c.rotation.z=-.38),i.add(c),f.push({renderer:n,scene:i,camera:l,model:c,canvas:r,primitive:a})})}function m(){const e=performance.now()*.001;f.forEach(({renderer:r,scene:a,camera:s,model:i,canvas:o,primitive:l},n)=>{const c=Math.max(1,o.clientWidth),p=Math.max(1,o.clientHeight);(o.width!==Math.floor(c*r.getPixelRatio())||o.height!==Math.floor(p*r.getPixelRatio()))&&(r.setSize(c,p,!1),s.aspect=c/p,s.updateProjectionMatrix()),i.rotation.y=e*.22+n*.18,(l==="HangingBellFruit"||l==="FoliageGrassBranch")&&(i.rotation.y=e*.16+n*.12),r.render(a,s)}),window.requestAnimationFrame(m)}function N(e){return`
          <article class="group-card" data-kind="${t(e.kind)}" data-status="${t(e.status)}">
            <div class="thumb-strip">
              ${e.images.map(r=>`<img src="${t(r)}" alt="${t(e.title)} reference" loading="lazy" />`).join("")}
            </div>
            <div class="group-body">
              <div class="group-top">
                <div class="group-title">
                  <div class="kind">${t(e.kind)}</div>
                  <h3>${t(e.title)}</h3>
                  <div class="en">${t(e.englishTitle)}</div>
                </div>
                ${u(e.status)}
              </div>
              <p>${t(e.humanConclusion)}</p>
              <div class="primitive-list">
                ${e.primitives.map(r=>`<span class="pill">${t(w[r]||r)}</span>`).join("")}
              </div>
              <div class="link-row">
                ${e.referenceLinks.map(r=>`<a class="pill" href="${t(r.href)}">${t(r.label)}</a>`).join("")}
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
                ${Object.entries(e.roleReview).map(([r,a])=>`
                      <div class="subpanel">
                        <h4>${t(B[r]||r)}</h4>
                        <p>${t(a)}</p>
                      </div>
                    `).join("")}
              </div>
            </div>
          </article>
        `}function x(e){const r=document.querySelector("#group-grid");r.innerHTML=e.reviewGroups.map(N).join("")}function O(){const e=[["all","全部"],["blocked","blocked"],["needs-work","needs-work"],["pass","pass"],["positive","正向"],["negative","反向"]];document.querySelector("#filters").innerHTML=e.map(([r,a],s)=>`
              <button class="filter-button" type="button" data-filter="${r}" aria-pressed="${s===0?"true":"false"}">
                ${a}
              </button>
            `).join("")}function E(){const e=Array.from(document.querySelectorAll(".filter-button")),r=Array.from(document.querySelectorAll(".group-card")),a=document.querySelector("#empty");e.forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.filter;e.forEach(l=>l.setAttribute("aria-pressed",String(l===s)));let o=0;r.forEach(l=>{const n=i==="all"||l.dataset.status===i||l.dataset.kind===i;l.classList.toggle("is-hidden",!n),n&&(o+=1)}),a.hidden=o>0})})}R().then(e=>{D(e),H(e),j(e),G(e),q(e),A(),m(),M(e),x(e),O(),E()});
//# sourceMappingURL=aestheticReviewDashboard-CXyjs2Sc.js.map
