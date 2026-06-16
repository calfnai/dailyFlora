# DailyFlora_TD TouchDesigner Notes

This version is implemented as a WebGL shader so it can be published as a static page. The visual structure is designed to map cleanly to TouchDesigner if a native `.toe` version is needed later.

## Network Sketch

```text
constant TOP / ramp TOP
  -> GLSL TOP: polar flower field
  -> feedback TOP: slow bloom persistence
  -> level TOP: contrast and exposure
  -> bloom TOP
  -> composite TOP: date/title overlay
  -> out TOP
```

## Core Parameters

```text
seed          daily deterministic seed
petal_count   5-13
layer_count   9
flow_amount   0.04-0.08
core_glow     1.2-1.8
grain_density 42-66
palette_a/b/c from DailyFlora theme
```

## Porting Notes

- Use the fragment shader logic in `src/dailyfloraTD.ts` as the GLSL TOP starting point.
- Replace `uResolution`, `uTime`, `uSeed`, and palette uniforms with GLSL TOP uniforms.
- Drive `uSeed` from a Table DAT containing the date string hash.
- Export stills or loops from Movie File Out TOP, then place them in the web version if a fully static archive is preferred.
