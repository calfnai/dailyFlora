# DailyFlora hand-control test

This integration is intentionally isolated from the normal DailyFlora page. Open the test deployment with `?hand-control=1`; without that query parameter none of the hand-control modules are loaded.

The browser reads the camera directly with `getUserMedia` and runs MediaPipe Tasks in the page. There is no localhost WebSocket, local app, Python, OpenCV, extension, or background service. Camera permission is requested only after the user presses **启用摄像头**.

The raw webcam handedness labels are swapped by default because MediaPipe's handedness convention assumes mirrored selfie input while recognition receives the unmirrored camera frame. The monitor shows the physical `RIGHT` and `LEFT` tracking state; if a particular browser or virtual camera already mirrors its input, disable **左右手校正** in the monitor.

The hand-control feature is split so it can be moved into another DailyFlora branch or another project:

- `src/hand-control/browserHandTracker.ts`: project-independent camera, MediaPipe, landmarks, semantic values, smoothing, and spread derivatives.
- `src/hand-control/gestureInterpreter.ts`: project-independent pinch arbitration, hysteresis, cooldowns, priority, and limiters.
- `src/hand-control/monitor.ts`: optional browser preview and actual-output monitor.
- `src/dailyFloraHandControl.ts`: the only DailyFlora-specific gesture mapping.

The DailyFlora adapter is a lazy chunk loaded only behind `?hand-control=1`. The MediaPipe JavaScript is another lazy chunk, and the WASM/model assets are fetched only after camera activation. The normal DailyFlora entry does not preload them.

## Gesture mapping

- Pointing-up `☝` with either hand: cycle density.
- Victory `✌` with either hand: cycle rendering detail.
- Index + middle + ring raised on either hand: toggle the clock. MediaPipe has no built-in three-finger category, so this is derived from the 21 landmarks.
- Thumbs-up `👍` with either hand: toggle the automatic camera path.
- Four fingers raised with the thumb folded on either hand: toggle webpage immersive mode. This is also derived from landmarks so it remains distinct from a fully open palm.
- Closed fist `✊` on either hand: safety brake; suppress every continuous output while held.
- Right thumb + index: hold to move the bouquet on the X/Y axes. The normalized distance threshold intentionally accepts visibly touching/near-touching fingertips instead of requiring landmark centers to overlap.
- Fully open palm on either hand: move toward/away from the camera to zoom with depth priority. The finalized direction is reversed from the previous test build: moving the hand farther away brings the bouquet closer, while moving the hand closer pushes the bouquet farther away.
- Slightly closed palm on either hand: rotate; a fully open palm never rotates.
- Both hands: when depth is stable, spread acceleration supplies secondary zoom.

The monitor keeps this entire gesture list visible together with the physical-hand tracking state, normalized input values, current control mode, FPS, and the exact action sent to DailyFlora.

Symbolic gestures must remain stable for 280 ms before firing once; the fist starts braking immediately and confirms after 120 ms. A gesture must be released before it can fire again, and continuous controls pause for 350 ms after a discrete command. Pinch hysteresis, ambiguity rejection, two-hand settling, per-frame deltas, scene framing, rotation, and zoom are bounded before they reach the visual system.

When both hands are visible, a continuous one-hand control keeps its current physical hand while that hand remains eligible; otherwise it selects the right hand first and then the left. This prevents controller identity from swapping every frame.

Keyboard fallback for testing: `1` density, `2` detail, `3` clock, `4` restore automatic camera, and `5` immersive mode.
