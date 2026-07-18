# Internal validation case study

这是 Agentic Video Foundry 的方法验证记录，不是可下载的示例素材包。源项目包含付费生成音频，因此不在 MIT 仓库中再分发。

## 成片

- 内容：306 个 AI Skills 分享短视频
- 主合成器：Remotion 4.0.489 + React 18
- 音频：ElevenLabs `eleven_v3` 分段中文旁白、Music、5 类 SFX
- 场景：9 个旁白驱动场景
- 输出：1080×1920、30fps、H.264、AAC 48kHz 双声道
- 时长：48.554667 秒
- 码率：约 2,523,124 bit/s
- 最终母带记录：约 -15.35 LUFS、-1.00 dBTP

## 验收记录

- 旁白字符对齐生成字幕与连续时间轴。
- Hook、分类、工具网络、转折、`.learnings/`、晋升和 CTA 等代表帧已检查。
- 更换年轻男声并提高 BGM 后，重新完整渲染并重测母带。
- 自动审计复跑结果：33 个文本源文件、0 failure、0 warning；视频流与音频流探测通过。

## 输出哈希

以下哈希用于标识当时通过验收的内部产物；仓库不包含这些二进制文件。

```text
4e0e03863a49563c5e2aecfcdfc19777bb5c5f1da6ee79c4097381b439426c5a  final-video.mp4
828d2f77681697b88e1a1b647a184a97f0616c3ad7ca180bc3a248c5142f585e  cover.png
ea0d98e72335fe18cfee34a89eabbb36cf4847ccf153c008ef9b5e0d536f86e5  audio-manifest.json
```

该案例证明流程在一个真实项目上运行过，但不证明所有平台、字体、Lottie 特性、声音模型或渲染环境天然兼容。每个新项目仍须执行自己的代表帧、完整视听与技术验收。
