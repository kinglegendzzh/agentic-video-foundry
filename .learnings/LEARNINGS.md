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

## LRN-20260720-004: 区分 GitHub 仓库不存在与沙箱凭据不可见

- 类型：发布与环境隔离
- 状态：已验证

### 现象

用户在宿主终端完成 `gh auth login` 后，Codex 沙箱内的 `gh auth status` 仍可能报告 token 无效；与此同时，向一个尚未创建的远端地址执行 `git push` 会返回 `Repository not found`。这两个现象叠加时，容易把仓库不存在误诊为用户登录失败。

### 解决方案

先核对本地 `origin`、分支和提交，再在能访问宿主 Keychain 与网络的环境中分别执行 `gh auth status` 和 `gh repo view OWNER/REPO`。若登录有效而 `gh repo view` 明确返回仓库无法解析，先创建远端仓库，再推送并比较本地 `HEAD` 与 `origin/main` 的完整提交哈希。

### 提升条件

所有 GitHub 首次发布流程都应把“认证状态”“远端对象是否存在”“推送权限”作为三个独立检查项，不再用单次 `git push` 错误推断根因。
