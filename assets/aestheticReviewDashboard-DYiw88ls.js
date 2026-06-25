import{S as m,H as v,D as g,P as b,W as F,a as $,V as y,f as S}from"./floraPrimitives-12VD3gmO.js";const k={blocked:"blocked","needs-work":"needs-work",pass:"pass"},C={creativeDirector:"创意总监",artDirector:"美术指导",projectDirector:"项目主任",cto:"CTO"},h={DiskFlower:"盘状花",LayeredDahliaFlower:"层叠大丽花/团瓣型",RuffledRoseFlower:"褶皱玫瑰型",StarPinwheelFlower:"星形/风车型",TulipCupFlower:"郁金香/杯型",TrumpetThroatFlower:"洋水仙管心型",DaturaTrumpetFlower:"大喇叭型",OrchidButterflyFlower:"兰花/蝴蝶型",CallaCurledBract:"马蹄莲/卷曲苞片型",UmbelMiniCluster:"伞状/小簇型",FullHydrangeaCloud:"绣球/云团型",FruitPodCluster:"果材/荚果型",HangingBellFruit:"吊坠风铃果型",FoliageGrassBranch:"叶材/草线/枝条型",LayeredRoundFlower:"层叠圆花",SpikeFlower:"穗状花",OpenSculptureFlower:"开口雕塑花",ClusterFlower:"簇花",BerryCluster:"果材",AirFiller:"空气填充"},T={"disk-face-flower":"DiskFlower","layered-dahlia-form":"LayeredDahliaFlower","ruffled-rose-form":"RuffledRoseFlower","star-pinwheel-form":"StarPinwheelFlower","tulip-cup-form":"TulipCupFlower","trumpet-throat-form":"TrumpetThroatFlower","datura-trumpet-form":"DaturaTrumpetFlower","orchid-butterfly-form":"OrchidButterflyFlower","calla-curled-bract":"CallaCurledBract","spike-vertical-form":"SpikeFlower","umbel-mini-cluster":"UmbelMiniCluster","hydrangea-cloud-cluster":"FullHydrangeaCloud","fruit-pod-form":"FruitPodCluster","hanging-bell-fruit":"HangingBellFruit","foliage-grass-branch":"FoliageGrassBranch"},B={DiskFlower:["#fff8e7","#f7edd2","#f0c83a","#7f8e3e"],LayeredDahliaFlower:["#f8c9d8","#fff1f5","#e7a7bb","#86a762"],RuffledRoseFlower:["#f8b9cf","#fff3f6","#e77da0","#9bb36b"],StarPinwheelFlower:["#ff8b32","#ffd15a","#e9565d","#7aa65a"],TulipCupFlower:["#ffbf5a","#fff0c2","#f58aa2","#5d8a55"],TrumpetThroatFlower:["#fff9e8","#ffffff","#ffc847","#f08b36"],DaturaTrumpetFlower:["#ffffff","#f2e3ff","#8a5ab8","#58783f"],OrchidButterflyFlower:["#f8c8eb","#fff6fb","#e078b8","#cc8b4f"],CallaCurledBract:["#fff7df","#f6e8b5","#f2b84c","#6c8b57"],SpikeFlower:["#8bb8ff","#b699ff","#d9d1ff","#59775c"],UmbelMiniCluster:["#ffffff","#fff6d8","#e8f5ff","#89a86a"],FullHydrangeaCloud:["#c9eea8","#e9ffd4","#a9d981","#f3ffe6"],FruitPodCluster:["#4566d9","#273f91","#bbd1ff","#5f7a51"],HangingBellFruit:["#ff9f26","#ffd45d","#78a55a","#f7be45"],FoliageGrassBranch:["#5f8f62","#86b86f","#c6d88a","#2f573b"]},f=[];function a(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function d(e){return`<ul>${e.map(r=>`<li>${a(r)}</li>`).join("")}</ul>`}function p(e){return`<span class="status ${a(e)}">${a(k[e]||e)}</span>`}async function P(){try{const e=await fetch("../data/aesthetic-review-dashboard.json",{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}catch{const e=document.querySelector("#fallback-data");return JSON.parse(e.textContent)}}function R(e){const r=e.gate;document.querySelector("#gate-card").innerHTML=`
          <div>${p(r.status)}</div>
          <div>
            <h2>${a(r.title)}</h2>
            <p class="section-copy">${a(r.summary)}</p>
          </div>
          ${d(r.rules)}
          <div class="link-row">
            ${r.links.map(t=>`<a class="pill" href="${a(t.href)}">${a(t.label)}</a>`).join("")}
          </div>
        `}function H(e){document.querySelector("#role-grid").innerHTML=e.roles.map(r=>`
              <article class="panel">
                <h3>${a(r.name)}</h3>
                <p>${a(r.brief)}</p>
              </article>
            `).join("")}function L(e){document.querySelector("#primitive-grid").innerHTML=e.primitiveGate.map(r=>{const t=r.ownerStatus?`<p><strong>用户判定：</strong>${a(r.ownerStatus)}</p>`:"",i=r.ownerFeedback?`<p><strong>反馈口径：</strong>${a(r.ownerFeedback)}</p>`:"",s=r.ownerAcceptance?`<p><strong>验收结论：</strong>${a(r.ownerAcceptance)}</p>`:"";return`
                <article class="panel">
                  <div>${p(r.status)}</div>
                  <h3>${a(r.humanName)}</h3>
                  <p class="en">${a(r.primitive)}</p>
                  <p>${a(r.acceptance)}</p>
                  ${t}
                  ${i}
                  ${s}
                  <p><strong>下一步：</strong>${a(r.nextTask)}</p>
                </article>
              `}).join("")}function j(e){const r=e.reusableAestheticRules||[];document.querySelector("#rules-grid").innerHTML=r.map(t=>`
              <article class="panel">
                <h3>${a(t.title)}</h3>
                <p>${a(t.summary)}</p>
                <div class="subpanel">
                  <h4>原则</h4>
                  ${d(t.principles||[])}
                </div>
                <div class="subpanel">
                  <h4>拒绝信号</h4>
                  ${d(t.rejectSignals||[])}
                </div>
                <p><strong>验收：</strong>${a(t.ownerAcceptance||"")}</p>
              </article>
            `).join("")}function D(e){const r=e.targetShapeVocabulary||[];document.querySelector("#shape-grid").innerHTML=r.map(t=>{const i=T[t.id]||"";return`
              <article class="panel">
                <div class="shape-preview">
                  <canvas data-shape-preview="${a(i)}" aria-label="${a(t.name)} model preview"></canvas>
                </div>
                <h3>${a(t.name)}</h3>
                <p class="en">${a(t.id)}</p>
                <p><strong>对应模型：</strong>${a(h[i]||i||"未映射")}</p>
                <p><strong>例子：</strong>${a(t.examples)}</p>
                <p><strong>为什么需要：</strong>${a(t.whyNeeded)}</p>
              </article>
            `}).join("")}function G(){f.splice(0,f.length),Array.from(document.querySelectorAll("[data-shape-preview]")).forEach(r=>{const t=r.dataset.shapePreview,i=S[t];if(!i)return;const s=new m;s.add(new v("#fff4dc","#182014",1.9));const n=new g("#ffffff",2.25);n.position.set(2.2,3.2,4.6),s.add(n);const l=new b(38,1,.1,20);l.position.set(0,.35,4.1),l.lookAt(0,.02,0);const o=new F({canvas:r,antialias:!0,alpha:!0});o.outputColorSpace=$,o.setPixelRatio(Math.min(window.devicePixelRatio,1.4));const c=i({seed:`dashboard-target-shape:${t}`,position:new y(0,0,0),scale:t==="FoliageGrassBranch"?.92:t==="SpikeFlower"?.84:1.02,colorPalette:B[t]||["#ffffff","#f7d78a","#80ad65","#cc8b4f"],openness:["OrchidButterflyFlower","TrumpetThroatFlower","DaturaTrumpetFlower","CallaCurledBract"].includes(t)?.95:.7,density:["UmbelMiniCluster","FullHydrangeaCloud","FruitPodCluster","FoliageGrassBranch"].includes(t)?1.08:.92,curvature:["SpikeFlower","FoliageGrassBranch","CallaCurledBract"].includes(t)?.86:.42,role:["SpikeFlower","FoliageGrassBranch"].includes(t)?"line":"secondary"});c.rotation.x=["DiskFlower","LayeredDahliaFlower","RuffledRoseFlower","StarPinwheelFlower","TrumpetThroatFlower"].includes(t)?-.7:t==="FoliageGrassBranch"?-.34:-.1,t==="FoliageGrassBranch"&&(c.rotation.z=-.38),s.add(c),f.push({renderer:o,scene:s,camera:l,model:c,canvas:r,primitive:t})})}function w(){const e=performance.now()*.001;f.forEach(({renderer:r,scene:t,camera:i,model:s,canvas:n,primitive:l},o)=>{const c=Math.max(1,n.clientWidth),u=Math.max(1,n.clientHeight);(n.width!==Math.floor(c*r.getPixelRatio())||n.height!==Math.floor(u*r.getPixelRatio()))&&(r.setSize(c,u,!1),i.aspect=c/u,i.updateProjectionMatrix()),s.rotation.y=e*.22+o*.18,(l==="HangingBellFruit"||l==="FoliageGrassBranch")&&(s.rotation.y=e*.16+o*.12),r.render(t,i)}),window.requestAnimationFrame(w)}function M(e){return`
          <article class="group-card" data-kind="${a(e.kind)}" data-status="${a(e.status)}">
            <div class="thumb-strip">
              ${e.images.map(r=>`<img src="${a(r)}" alt="${a(e.title)} reference" loading="lazy" />`).join("")}
            </div>
            <div class="group-body">
              <div class="group-top">
                <div class="group-title">
                  <div class="kind">${a(e.kind)}</div>
                  <h3>${a(e.title)}</h3>
                  <div class="en">${a(e.englishTitle)}</div>
                </div>
                ${p(e.status)}
              </div>
              <p>${a(e.humanConclusion)}</p>
              <div class="primitive-list">
                ${e.primitives.map(r=>`<span class="pill">${a(h[r]||r)}</span>`).join("")}
              </div>
              <div class="link-row">
                ${e.referenceLinks.map(r=>`<a class="pill" href="${a(r.href)}">${a(r.label)}</a>`).join("")}
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
                  <p>${a(e.currentImplementation)}</p>
                </div>
                <div class="subpanel">
                  <h4>未通过原因</h4>
                  <p>${a(e.failureReason)}</p>
                </div>
              </div>
              <div class="subpanel">
                <h4>下一步任务</h4>
                ${d(e.nextTasks)}
              </div>
              <div class="role-review">
                ${Object.entries(e.roleReview).map(([r,t])=>`
                      <div class="subpanel">
                        <h4>${a(C[r]||r)}</h4>
                        <p>${a(t)}</p>
                      </div>
                    `).join("")}
              </div>
            </div>
          </article>
        `}function A(e){const r=document.querySelector("#group-grid");r.innerHTML=e.reviewGroups.map(M).join("")}function q(){const e=[["all","全部"],["blocked","blocked"],["needs-work","needs-work"],["pass","pass"],["positive","正向"],["negative","反向"]];document.querySelector("#filters").innerHTML=e.map(([r,t],i)=>`
              <button class="filter-button" type="button" data-filter="${r}" aria-pressed="${i===0?"true":"false"}">
                ${t}
              </button>
            `).join("")}function x(){const e=Array.from(document.querySelectorAll(".filter-button")),r=Array.from(document.querySelectorAll(".group-card")),t=document.querySelector("#empty");e.forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.filter;e.forEach(l=>l.setAttribute("aria-pressed",String(l===i)));let n=0;r.forEach(l=>{const o=s==="all"||l.dataset.status===s||l.dataset.kind===s;l.classList.toggle("is-hidden",!o),o&&(n+=1)}),t.hidden=n>0})})}P().then(e=>{R(e),H(e),j(e),D(e),G(),w(),L(e),A(e),q(),x()});
//# sourceMappingURL=aestheticReviewDashboard-DYiw88ls.js.map
