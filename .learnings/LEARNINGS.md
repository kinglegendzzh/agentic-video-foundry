# Agentic Video Foundry learnings

## LRN-20260718-001: 先消除社区工具名称歧义，再决定是否安装

- 类型：供应链与技术选型
- 状态：已验证

### 现象

“motion-scene”可指向多个不相干项目；精确名称的旧 RubyMotion/SceneKit gem 与 Agent 视频生产无关，而用户更可能指 Remotion Scenes。

### 解决方案

在安装前核对原仓库、SKILL.md、许可证、运行时和维护状态。`lifeprompt-team/remotion-scenes` 是 React/TSX 场景源码库，不是 Agent Skill；Agentic Video Foundry 只把它作为按项目固定 commit 的可选资产源。

### 提升条件

该模式已写入 Agentic Video Foundry 场景路由与第三方台账；未来所有名称相近的社区插件继续执行同一来源核验。

## LRN-20260718-002: 第三方 Skill Pack 应安装最小审查子集

- 类型：供应链安全
- 状态：已验证

### 现象

HyperFrames v0.7.62 的 `media-use` Skill 包含 `curl | bash` 安装建议，与本机全局安全宪法冲突；全量安装会把不需要的高权限路径带入后续任务上下文。

### 解决方案

固定 tag 与 commit，先离线检索危险命令，只安装 Agentic Video Foundry 所需的 router、core、animation、keyframes、creative、CLI 和 motion-graphics；继续由 Foundry 管理媒体生成、凭据、来源与母带。

### 提升条件

任何第三方 Skill Pack 都先做最小能力集、危险命令和自动副作用审查，不因官方来源而跳过。

## LRN-20260718-003: Lottie 进入最终视频时需要双渲染器验收

- 类型：跨渲染器兼容性
- 状态：规范化

### 现象

Text-to-Lottie 的官方正确性基线是 Skia Skottie，但最终成片可能由 Remotion 的 `@remotion/lottie` 或 HyperFrames Lottie adapter 渲染。字体、遮罩、slots 和 SVG 特性的支持面可能不同。

### 解决方案

先在官方 Skottie 播放器检查首帧、中点和末帧，再把冻结的 JSON、字体与图片交给最终渲染器，并在最终时间轴复查代表帧和短片。

### 提升条件

该规则已成为 Agentic Video Foundry 的 Lottie 资产硬闸门。
