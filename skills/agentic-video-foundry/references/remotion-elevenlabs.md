# Remotion + ElevenLabs 实施要点

本实现指南来自一条内部 Remotion + ElevenLabs 竖屏短视频的完整生产记录。案例摘要、探测结果与输出哈希见 [case-study.md](case-study.md)；付费音频和源项目不随 Skill 再分发。复制架构与验收方式，不复制主题、声线或固定音量。

## 推荐结构

```text
src/
  Root.jsx
  Video.jsx
  theme/
  scenes/
  data/script.json
  data/timeline.json
  data/captions.json
  data/audio-manifest.json
scripts/
  generate-audio.mjs
  lib/audio-helpers.mjs
public/audio/{auditions,voiceover,sfx}/
public/audio/bgm.mp3
out/{video.mp4,cover.png,stills/}
```

让 ElevenLabs 的字符或词级对齐生成字幕和场景时间轴；让 Remotion 只消费本地、版本化且有哈希的资产。旁白按段保存，便于只重生成变化段。Music 和 Sound Effects 使用明确的时长、结构与禁用项提示词。

## 凭据

优先从 macOS Keychain 服务读取，也可从进程环境读取。禁止 `.env` 进入交付包；禁止把密钥作为 CLI 参数，因为它可能进入 shell history 和进程列表。用户曾在对话中粘贴的密钥视为已暴露，后续应轮换。

## 已验证兼容性陷阱

- `eleven_v3` 的 timestamped TTS 不接受 `previous_text` / `next_text` 时，按模型分支省略；Multilingual v2 可按实时 API 能力使用上下文。
- Shared Voice 查询带 `language=zh` 仍可能返回主要语言不是中文的声线，必须本地再次过滤。
- 中文字幕切分要把连续拉丁字母、数字、点号及内部空格视为原子单元。
- 某些 macOS Chromium/Remotion 组合下，`backdrop-filter` 会造成单帧矩形污染；用更高不透明度背景和明确 z-index，并复查精确问题帧。
- macOS `say` 生成的 AIFF 可能无法被 Remotion 附带 FFmpeg 解复用；若仅作离线兜底，先用 `afconvert` 转成 48 kHz WAV。
- 提高 BGM 或更换声线后，必须重测整条成片的 LUFS 与 dBTP；轨道百分比不能代表最终响度。

## HyperFrames 判断

不要仅因它“更 agent-native”就引入。当前参考项目的核心需求是 9 个音频驱动场景、逐帧字幕和可重复混音，Remotion 单链更直接。只有网页组件复用、HTML/CSS/GSAP 导入或 DOM 组合效率成为主瓶颈时，再做一段 5–10 秒同稿对照验证；比较实现复杂度、帧稳定性、字幕同步、编码次数和维护成本后再决定。
