# Little Counter — Emma's Game App

This repository contains "Little Counter" (v1 MVP), a toddler counting app built with Expo + React Native + TypeScript. This branch implements the v1 scaffold used to build the single-activity counting experience described in spec.md.

Privacy-by-design
- The app stores zero personal information. It persists only one local integer: `highestCountReached` in AsyncStorage.
- No accounts, no analytics, no microphone/camera, no network calls by design.

How to run (development)
1. Install dependencies: npm install
2. Start Expo: npm start
3. Open Expo Go on a physical device and scan the QR code.
4. To verify offline behavior: open the app once while online so Expo Go caches the bundle, then enable airplane mode and re-open the app on the device.

This branch is a work-in-progress scaffold. The next commits will implement the single counting activity, audio, persistence, and parent-gate.
