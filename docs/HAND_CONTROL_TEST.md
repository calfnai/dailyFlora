# DailyFlora hand-control test

This integration is intentionally isolated from the normal DailyFlora page. Open the test deployment with `?hand-control=1`; without that query parameter none of the hand-control modules are loaded.

The browser reads the camera directly with `getUserMedia` and runs MediaPipe Tasks in the page. There is no localhost WebSocket, local app, Python, OpenCV, extension, or background service. Camera permission is requested only after the user presses **启用摄像头**.

The hand-control feature is split so it can be moved into another DailyFlora branch or another project:

- `src/hand-control/browserHandTracker.ts`: project-independent camera, MediaPipe, landmarks, semantic values, smoothing, and spread derivatives.
- `src/hand-control/gestureInterpreter.ts`: project-independent pinch arbitration, hysteresis, cooldowns, priority, and limiters.
- `src/hand-control/monitor.ts`: optional browser preview and actual-output monitor.
- `src/dailyFloraHandControl.ts`: the only DailyFlora-specific gesture mapping.

The DailyFlora adapter is a lazy chunk loaded only behind `?hand-control=1`. The MediaPipe JavaScript is another lazy chunk, and the WASM/model assets are fetched only after camera activation. The normal DailyFlora entry does not preload them.

## Gesture mapping

- Right thumb + index: hold to move the bouquet on the X/Y axes.
- Right thumb + middle: cycle density.
- Right thumb + ring: cycle rendering detail.
- Right thumb + pinky: toggle the clock.
- Fully open right palm: move toward/away from the camera to zoom with depth priority.
- Slightly closed right palm: rotate; a fully open palm never rotates.
- Both hands: when depth is stable, spread acceleration supplies secondary zoom.
- Left thumb + index: toggle the automatic camera path.
- Left thumb + pinky: toggle webpage immersive mode.

Discrete gestures have a 450 ms cooldown and continuous controls pause for 350 ms after a discrete command. Pinch ambiguity, two-hand settling, per-frame deltas, scene framing, rotation, and zoom are bounded before they reach the visual system.

Keyboard fallback for testing: `1` density, `2` detail, `3` clock, `4` restore automatic camera, and `5` immersive mode.
