# SKYDRIVE X-1 宣傳影片（30 秒）

《未來飛天車》宣傳影片，使用 Remotion 製作，全部畫面以 SVG/CSS 程式繪製，不需外部素材。

- 規格：1920×1080、30fps、900 幀、H.264 + AAC
- 成品：`out/skydrive-x1.mp4`
- 配樂：`scripts/make-audio.mjs` 程式合成（環境低音、引擎嗡嗡聲、9–14s 風聲、19s 加速「嗖」、28s 收尾鐘音）

## 場景

| 時間 | 場景 | 程式 |
|---|---|---|
| 0–9s | 夜幕城市 + 飛天車亮相 | `NightCityScene` |
| 9–14s | 穿梭大樓、穿過霓虹光環 | `WeaveScene` |
| 14–19s | 懸停 + AI 導航 HUD | `HoverScene` |
| 19–24s | 加速 warp、速度表 0→300 | `WarpScene` |
| 24–28s | 夕陽剪影巡航 | `SunsetScene` |
| 28–30s | 霓虹 Logo | `LogoScene` |

字幕文字都在 `src/scenes.tsx`，場景時間點在 `src/Promo.tsx` 的 `SCENES`。

## 使用

```bash
npm install
npm run dev      # 合成音效並開啟 Remotion Studio 預覽
npm run render   # 合成音效並輸出 out/skydrive-x1.mp4
```
