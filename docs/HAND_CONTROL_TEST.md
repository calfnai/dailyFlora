# DailyFlora hand-control test

This integration is intentionally isolated from the normal DailyFlora page. Open the test deployment with `?hand-control=1`; without that query parameter the receiver, status badge, and keyboard fallback are not started.

The webpage receives compact semantic JSON over `ws://127.0.0.1:8765`. It does not load OpenCV, MediaPipe, camera code, or model files. The local Camera Controller app owns camera permission, tracking, filtering, and its synchronized monitor.

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
