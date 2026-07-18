# Agentic Video Foundry 场景路由规范

## 路由原则

先按镜头需求选择最窄的能力，再由一个主合成器完成最终时间轴与音频。不要因为安装了更多框架就提高架构复杂度。

| 镜头需求 | 默认路线 | 交付给主时间轴的冻结产物 |
|---|---|---|
| 多场景、旁白驱动、React/数据模板、精确字幕 | Remotion | Composition 源码与本地媒体 |
| Logo reveal、图标、流程图、KPI、微交互、透明矢量循环 | Text-to-Lottie | `lottie.json`、controls、字体/图片、校验截图 |
| HTML/CSS/GSAP、网页素材、动态图表、可 lint 的 DOM 动画 | HyperFrames | 独立 MP4/透明覆盖层，或完整 HyperFrames 项目 |
| 快速复用现成 React 动效场景 | Remotion Scenes | vendored TSX + 许可证归属 + 统一 tokens |
| 真人素材复杂剪辑 | NLE/FFmpeg/专用剪辑路线 | 锁定时长的视频片段与音轨 |

## Text-to-Lottie 资产支线

1. 只有适合矢量表达的 beat 才进入该支线；整条旁白视频仍由主时间轴负责。
2. 用真实 SVG、Logo、品牌 token 或数据做输入。明确画布、fps、总帧数、透明背景、循环方式和可编辑 slots。
3. 使用固定版本的官方播放器工作区。当前审查基线为 `diffusionstudio/lottie` v1.0.0 / commit `a4e20b894d6335b02a29e4bcdec864bab5104675`；脚手架命令应固定 tag 或 commit，不使用可变 `main`。
4. 在 Skia Skottie 播放器检查 frame 0、midpoint、`op - 1`，并验证 JSON、字体、图片、slots 与透明度。
5. Remotion 路线用官方 `@remotion/lottie` 按主帧同步；HyperFrames 路线用其 Lottie frame adapter。最终渲染器必须再验一次，Skottie 通过不代表跨渲染器完全兼容。

## Remotion Scenes 资产支线

`lifeprompt-team/remotion-scenes` 是 MIT 的 React/TSX 场景库，不是 Agent Skill。不要全量注入上下文或安装为全局技能。

按 storyboard 选择 1–3 个组件，固定 commit 后 vendoring 到项目，保留许可证和来源，统一 props、字体、颜色与 motion tokens；随后做 9:16 安全区、性能和逐帧检查。不要假设 201+ 场景 API 与风格完全统一。

## HyperFrames 后端

当前审查基线为 `heygen-com/hyperframes` v0.7.62 / commit `7f761709569dcc1d8a46c132e629d85fbe68dcb2`，Apache-2.0，要求 Node.js 22+ 与 FFmpeg。

把它作为可选场景或项目后端，不接管 Agentic Video Foundry 的 creative brief、付费 TTS、音乐生成、版权清单或最终母带 QA。优先使用本地冻结的 VO/BGM/SFX。运行 `lint`、`validate`、`inspect` 和代表帧检查后再 render。

不要执行第三方文档中的 `curl | bash` 安装命令。Agentic Video Foundry 当前只安装经过审查的 HyperFrames 核心 authoring skills，媒体生成继续由本管线的安全凭据与 manifest 机制负责。
