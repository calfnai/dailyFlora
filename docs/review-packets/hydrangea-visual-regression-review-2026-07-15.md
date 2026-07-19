# DailyFlora 绣球视觉回退与复核包

日期：2026-07-15  
页面：`docs/realistic-flower-lab.html`  
当前重点文件：`src/realisticFlowerForms.ts`

## 给 ChatGPT 网页版的任务

请以本文截图为第一判断依据，帮助复核 DailyFlora 偏写实花型 LAB 中的绣球。不要把“更真实”理解成连续球壳、更多孔洞、更多随机贴片或更多内部零件。

本轮已经把绣球从错误的“蓝色洞洞壳”退回到由很多可读四萼片装饰花组成的花球。请先判断当前恢复版是否已经重新达到视觉基线；如果仍需修改，只提出最多三项、能够直接改善截图的克制调整，并且不要改动其他花型。

## 视觉基线

认可基线来自旧版 `createHydrangea`，可追溯到 commit `0b3655c`。

![认可的旧版绣球基线](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-approved-baseline.png)

成立特征：

- 先看到柔和蓝色花球，再看到组成它的独立小花。
- 四萼片装饰花可读，表面有花簇感。
- 外轮廓饱满但不是完美球体。
- 明暗温和，没有大面积黑孔或脏蓝碎块。

## 后续退化错误版

![错误版正面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-front.png)

![错误版顶视](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-top.png)

错误表现：连续光滑半球/球壳；花之间形成孔洞；单花不可读；顶视接近完整圆盘；表面细节像建模噪点而不是花簇。

## 本次恢复后的三视图

### 正面

![当前正面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-final-front.png)

### 侧面

![当前侧面](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-final-side.png)

### 顶视

![当前顶视](/Users/ziqing/.codex/visualizations/2026/07/14/019f5f8f-f205-7fa2-82b7-2fef255f6a83/hydrangea-final-top.png)

## 本次代码处理

只修改 `src/realisticFlowerForms.ts`，共 14 行差异：7 行增加、7 行删除。

1. 停止把 `hydrangea` 分派给新版 `createCalibratedHydrangea`。
2. 恢复旧生成器为当前活动路径，命名为 `createHydrangeaBaseline`。
3. 保留旧版 104 朵四萼片装饰花、黄金角分布、自然半球轮廓及内部支撑。
4. 单花缩放范围由 `0.90–1.08` 收窄到 `0.95–1.05`。
5. 花心改为相近蓝色混合，取消黄色、绿色和深色跳变。
6. 花瓣只在两种相近蓝色之间变化，白色混合控制在 `0.02–0.12`。
7. 没有强行加入半开花和花蕾，避免重新制造孔洞或碎片感。

## 当前活动生成器

```ts
function createHydrangeaBaseline(options: BuildOptions) {
  const rng = createRng(`${options.seed}:hydrangea`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5d7f54');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.025, -0.72, 0.015),
    new THREE.Vector3(0.035, -0.28, -0.02),
    new THREE.Vector3(0, 0.02, 0)
  ], 0.028, green, 16);
  group.add(stem.mesh);

  const flowerCount = 104;
  const cloudCenter = new THREE.Vector3(0, 0.4, 0);
  const softCenter = colorAt(options.palette, 1).clone()
    .lerp(colorAt(options.palette, 0), 0.55);
  const petals = new THREE.InstancedMesh(
    roundedSepalGeometry(0.15, 0.115, 0.014),
    flowerMaterial(colorAt(options.palette, 0), 0.84),
    flowerCount * 4
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.032, 8, 6),
    flowerMaterial(softCenter, 0.9),
    flowerCount
  );
  let petalIndex = 0;
  for (let i = 0; i < flowerCount; i += 1) {
    const yNorm = 0.98 - (i / Math.max(1, flowerCount - 1)) * 1.38;
    const angle = i * 2.39996 + rng.range(-0.08, 0.08);
    const ring = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const normal = new THREE.Vector3(
      Math.cos(angle) * ring,
      yNorm,
      Math.sin(angle) * ring
    ).normalize();
    const radius = rng.range(0.58, 0.65);
    const bloom = cloudCenter.clone().addScaledVector(normal, radius);
    const shortPedicel = bloom.clone().addScaledVector(normal, -0.1);
    group.add(cylinderBetween(shortPedicel, bloom, 0.0045, green));
    const scale = rng.range(0.95, 1.05);
    setInstance(centers, i, bloom, new THREE.Vector3(scale, scale, scale), softCenter, 0, normal);
    const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
    const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    for (let p = 0; p < 4; p += 1) {
      const pa = p / 4 * Math.PI * 2 + rng.range(-0.04, 0.04);
      const petalDirection = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa))
        .addScaledVector(normal, 0.08)
        .normalize();
      setInstance(
        petals,
        petalIndex,
        bloom,
        new THREE.Vector3(scale, scale, 1),
        colorAt(options.palette, p % 2).clone()
          .lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.12)),
        0,
        petalDirection
      );
      petalIndex += 1;
    }
  }
  const supportHub = new THREE.Vector3(0, 0.05, 0);
  for (let i = 0; i < 9; i += 1) {
    const angle = i / 9 * Math.PI * 2;
    const inner = cloudCenter.clone().add(new THREE.Vector3(
      Math.cos(angle) * 0.28,
      -0.08 + (i % 3) * 0.13,
      Math.sin(angle) * 0.28
    ));
    group.add(cylinderBetween(supportHub, inner, 0.007, green));
  }
  group.add(petals, centers);
  return group;
}
```

分派入口：

```ts
case 'hydrangea':
  return createHydrangeaBaseline(options);
```

## 验证结果与限制

- `npm run build`：成功，Vite 构建约 11.8 秒。
- 浏览器控制台：0 个错误、0 个警告。
- 当前 LAB：1 个共享 canvas，25 个花型。
- 当前绣球已经恢复独立花朵可读性，明显优于错误球壳版。
- 侧面和顶视仍存在少量由真实遮挡形成的暗缝，但没有连续壳面或大面积黑洞。
- 旧版为每朵花保留独立短花梗，因此 draw call 偏高；性能优化不能以重新合并成壳面为代价。

## 希望 ChatGPT 输出

请按以下格式回答：

1. 当前恢复版是否已经达到视觉基线，理由必须引用正面、侧面和顶视截图。
2. 如果仍需调整，只给最多三项，按视觉收益排序。
3. 每项明确指出要改哪个参数或哪段生成规则。
4. 明确列出不能恢复的错误结构。
5. 不要修改狐尾百合、蕾丝花、首页、daily bouquet、Special Edition、路由或其他 LAB 花型。
6. 如果建议代码，请提供针对 `createHydrangeaBaseline` 的最小 diff，不要重写整个花型。

