# 介绍片的制作脚本

成片是 `video/xuanze-jueding-mingyun.mp4`。画面是逐帧拍的游戏真实操作，旁白用作者的声音样本合成。

**声音样本不在这个仓库里。** 没有它，`tts_run.py` 只能换成别的声音。

## 顺序

| 步骤 | 脚本 | 输出 |
|---|---|---|
| 1 | `python3 tts_run.py` | `narration.wav`、`timeline.json`：按 `script.py` 的讲解稿合成旁白 |
| 2 | `python3 check_asr.py` | 用语音识别逐句回读，写出每个气口的起点 `phrases.json` |
| 3 | `python3 shoot.py [场景名…]` | `scenes/*.mp4`、`sfx.json`、`cut.json`：用 Playwright 按旁白时间逐帧拍摄 20 个场景 |
| 4 | `python3 subs.py` | 字幕 `subs.ass` 和 `.srt` |
| 5 | `python3 mix.py` | `mix.wav`：旁白、合成的琴声、落子声 |
| 6 | 见下 | 合成 |

```
printf "file 'scenes/%s.mp4'\n" open title board year lot handi play click cross seed zhu risk qi clock review detail thousand use basis end > concat.txt
ffmpeg -f concat -safe 0 -i concat.txt -c copy video_nosub.mp4
ffmpeg -i video_nosub.mp4 -i mix.wav -map 0:v -map 1:a -vf "ass=subs.ass" -c:v libx264 -crf 18 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out.mp4
```

- `clock.js` 是虚拟时钟：页面里的定时器、动画帧和 CSS 动画都按帧推进，机器快慢不影响画面。
- `direct.js` 是导演：镜头推拉、光标、点击圈，以及把一局棋快进到指定的节点。只在拍片时注入，不进游戏。
- 环境变量 `VOICE_LIB` 指向声音库，`TTS_DIR` 指向语音模型目录。
