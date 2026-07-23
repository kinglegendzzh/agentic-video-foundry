# 手撕纸拼贴定格

`id: flat-paper-collage-stop-motion`

这是根据用户提供的可观察界面与成品示例重建的通用工作流，不声称复原原 Agent 的隐藏提示词、模型或内部实现。

## 目录

1. 适用范围
2. 五阶段状态机
3. 视觉系统
4. 定格运动语法
5. 不变量、Identity Block 与衔接
6. 输入、关键帧与生成提示块
7. 实现建议
8. 硬失败与 QA
9. 自定义扩展

## 1. 适用范围

适合治愈叙事、概念解释、品牌短片、产品功能与工作流介绍。它通过材质统一和有限运动减少视觉噪声，不适合需要写实镜头连续性、复杂三维空间或大量精密数据同时可读的项目。

支持四种入口：

- `text-to-video`：已有文案或口播；
- `image-to-video`：已有角色图、产品图或关键帧；
- `video-restyle`：保留原片证据和动作，用纸片窗口、撕边与注释重构外围视觉；
- `idea-to-video`：只有主题，先补齐传播结论与故事弧。

只询问仍未知且会改变路线的信息。最低决策集是内容入口、目标平台/画幅、目标时长和一句话主题；产品片还必须有证据计划。

默认 preset：[`../../assets/style-presets/flat-paper-collage-stop-motion.json`](../../assets/style-presets/flat-paper-collage-stop-motion.json)。

## 2. 五阶段状态机

不得从模糊主题直接跳到生成镜头。

| 阶段 | 产物 | 完成条件 |
| --- | --- | --- |
| S01 诊断素材 | `01-brief.md` | 锁定入口、平台、时长、结论、受众、CTA、素材、证据、变量与排除项 |
| S02 拆解分镜 | `02-storyboard.md` | 每镜只含一个 Hero；写明时码、旁白、证据、纸片层和转场 |
| S03 锁定视觉 | `03-style-spec.md` + `style-preset.json` | 固定材质、配色、排版、撕边、阴影、密度、定格步长和角色 identity block |
| S04A 关键帧 | `keyframes/` + contact sheet | 先验证起点、转折、高潮和终点；关键帧不通过不得批量做视频 |
| S04B 镜头合成 | 可编辑工程与预览视频 | 由关键帧扩展为定格镜头，动作遵循离散步进且素材 identity 不漂移 |
| S05 质量检查 | `05-qa.md` + 交付清单 | 清零硬失败，完成代表帧、编码、音画、安全区和主观观看检查 |

15 秒概念片可使用 5 镜 × 2–3 秒；更长的视频按旁白语义扩展镜头数，不机械套用五镜。每个阶段将已确认信息向后传递，不重复提问。

`01-brief.md` 还要保存不变量、允许改动、工具路线、已知风险和当前状态。`02-storyboard.md` 的每镜至少写：叙事作用、画面构成、主要动作、纸片组、进场、离场、关键帧、文字、声音和连续性约束。先做动作因果与镜头衔接检查，再进入 S03。`03-style-spec.md` 必须给重复角色与道具建立 Identity Block。

## 3. 视觉系统

### 材质与层级

- 全幅暖米色纤维纸底；避免纯白数字画布。
- 主体统一为 `illustrated-cutout`：扁平插画纸片、简化明暗与五官；同一镜头不得混用写实抠图、3D 图标和玻璃拟态。
- 所有可动纸片具有温白撕边或裁切白边，边缘粗糙度保持同一量级。
- 阴影统一向右下，短距离、低模糊、轻柔克制；禁止多方向霓虹光与悬浮玻璃阴影。
- 每帧一个 Hero，最多两个支持物。装饰纸屑只用于构图平衡，静止且低对比。

### 配色

- 默认底纸 `#F5EDD8`。
- 主色不超过三种，默认泥土棕、草绿、天蓝；允许一个小面积情绪强调色。
- 黑色仅用于短标题与轮廓，避免大面积科技黑面板。
- 产品品牌色作为纸片墨色使用，不改变纸张材质和阴影体系。
- 默认复古胶印色值可使用泥土棕 `#8B6340`、深棕 `#6B4A2E`、嫩绿 `#5C8A3A`、淡蓝 `#7EC8E3`、薰衣草紫 `#9B7EBD`、暖黄 `#F0C75E`、深褐线条 `#3D2B1F`、温白撕边 `#FAF6EC`；项目品牌色可映射到同等低饱和纸墨色。

### 排版与语言

- 中文优先。除不可替代的产品名、命令和文件名外，不使用英文装饰词。
- 单屏只保留一个短标题和至多两个短标签；标题建议不超过 12 个汉字，标签不超过 8 个汉字。
- 长解释交给旁白；真实命令或文件列表放入可读的“证据纸片”，不再叠加同义字幕。
- 字体使用一套中文黑体或圆体家族，通过字重区分层级，禁止同屏混搭多种展示字体。
- 精确字幕、网址、数字和标志必须后期合成，不交给图像或视频生成模型；生成提示词明确禁止额外文字与水印。

### 真实证据

产品与工具片不能把真实 Demo 变成虚构插画。真实界面、终端、源码和输出以“贴在纸上的照片/窗口”存在：

- 保留画面内部像素与原始动作；
- 外围使用纸框、胶带角、撕边遮罩、手绘箭头和短中文注释；
- 同一时间只突出一个证据区域；
- 有真实证据时，建议维持 45%–70% 的有效观看时长。

## 4. 定格运动语法

最终交付可为 24/25/30/60 fps，但主体位移、旋转和缩放采用离散姿态：每个姿态保持 2–6 个输出帧，动作越快保持越短，关键结果帧停留 0.25–0.6 秒。保持时长使用固定、可复现的不规则序列，避免机械均匀感。

允许：

- 手工摆放感：短距离平移、0.3–3°分级旋转、轻微等比尺度跳变；
- 纸片从画外滑入后落桌，最多一次克制过冲；
- 关节纸偶绕固定铆点转动；
- 撕纸揭幕、纸片覆盖、页面推移、胶带贴合；
- 通过替换预制纸片状态表达生长、展开、完成。

禁止：

- 连续漂浮、无限呼吸、弹簧乱晃和每个元素同时运动；
- 形状插值、液态变形、五官或产品轮廓漂移；
- 粒子爆炸、玻璃拟态、霓虹光、无关 3D 元素；
- 为追求“手作”而使用无种子随机抖动。

动画函数必须以帧为输入。可用固定种子产生每个对象不变的 `jitterProfile`，再按不规则保持序列取样；随机值不能每帧重新生成。静止纸片可有 ±2–6px、±0.3–1° 的异步微摆，但各元素相位不同、状态离散，不形成正弦漂浮。动作节奏采用“摆放—停住—替换/推进—停住”，而不是持续匀速。

## 5. 不变量、Identity Block 与衔接

先写不变量清单，至少覆盖：叙事因果链、重复主体轮廓/肤色/比例/勾线、关键道具形状/颜色/尺寸/位置、底纸、撕边、阴影和刚性纸片运动。允许变化必须另列，不能靠生成模型自行推断。

每个重复主体或道具的 Identity Block 至少记录：

| 字段 | 示例 |
| --- | --- |
| 轮廓与比例 | 简化五指手掌剪影；宽度约占画面 25% |
| 材质与颜色 | 扁平纸片；肤粉/深棕/嫩绿等固定色 |
| 勾线 | 深褐细线，全片一致 |
| 锚点与轴心 | 种子位置、茎垂直轴、窗口中心点 |
| 出场镜头 | 首次出现、状态变化、最后保持 |
| 必须保持 | 轮廓、颜色、比例、位置或允许变化范围 |

逐镜写 `enter_from`、`exit_to`、`start_time`、`end_time`。元素必须从画外、遮挡纸片后或已存在的状态进入；不得在画面中间凭空出现/消失。默认旧主体先退、新场景组随后进入；需要跨镜保持的锚点明确标注。相邻元素错开 0.08–0.15 秒，避免齐步机械感。

分镜完成后检查：

- 因果链是否完整，每镜是否只有一个主要动词；
- 所有动作能否用刚性纸片的平移、分级旋转、等比缩放、遮罩揭示或静帧替换表达；
- 上一镜关键状态是否在下一镜保留、遮挡或明确退场；
- 复杂环境是否合并成大纸片组，而不是拆成满屏碎层。

## 6. 输入、关键帧与生成提示块

- 文案/主题：先转成语义动作，不把每个名词都变成图标。
- 图片：先确定主体 identity block，再统一扁平插画或同质纸片处理；不可一半照片、一半插画。
- 原片视频：保留关键动作和 UI，改变纸框、裁切、注释与场间转场，不伪造产品操作。
- 生成式关键帧：每镜先出一张，核对主体、材质、撕边、阴影和构图；失败镜头单独修正，不批量传播错误。

每项资产记录来源、生成参数或转换方式、尺寸与哈希。来自外部工具的图生视频只作为冻结视频资产进入主时间轴，不让其接管字幕和音频。

截图中观察到的工具路线是“图像节点生成关键帧 → i2v 视频节点扩展 → 画布组装”，但模块不硬编码特定产品或工具名。使用当前环境可用的图像/视频工具，关键是 S04A 与 S04B 的资产和验收契约。

图生视频时，关键帧必须作为严格首帧/构图锚点；提示词写明 preserve exactly。模型无法保持关键帧构图时，不继续批量生成，改用程序化刚性纸片动画或静帧替换。

### 全局风格提示块

用于每镜生成提示词，并在其后追加该镜的主体、纸片组、动作与构图：

```text
Flat 2D torn-paper cutout collage. Every subject, object, environment group and text label is a separate rigid matte paper piece. Clean irregular warm-white torn edges, consistent soft drop shadows down-right, parallel layered composition, subtle paper fiber, clean vintage offset-print palette, minimal fine halftone only in selected printed areas. Full-bleed paper background, no decorative outer frame. 3-6 large scene groups plus the subject and essential props. Stop-motion timing through discrete pose/frame changes and irregular holds. Rigid pieces may translate, rotate in discrete steps, or scale uniformly; they never bend, stretch, squash, melt or morph. Stationary pieces make tiny asynchronous stepped sways. Every element enters from off-screen or behind a paper mask and exits visibly; nothing appears or disappears instantly.
```

### 全局负面提示块

```text
No 3D rendering, no plastic or glossy materials, no realistic depth of field, no continuous shape interpolation, no liquid morphing, no rubber limbs, no face drift, no camera breathing, no smooth floating, no particle dissolve, no teleporting objects, no neon gradient, no heavy grunge, no thick black shadow, no large-area coarse halftone, no random extra objects, no extra text, no watermark.
```

每镜纸片组建议 3–6 组，主动主体约占画面 35%–60%；给进出路径留空间，不用四周统一留白制造海报边框。标题/短标签可以独立生成纸片形状，但精确文字仍由后期排版。

## 7. 实现建议

Remotion 默认实现：

- 用 SVG `clipPath` 或固定撕边路径裁切纸片；
- 纸张纹理使用本地、可追踪的小尺寸无缝纹理，低透明度叠加；
- `box-shadow`/SVG filter 统一由 preset 生成；
- 写一个接收 `holdPattern` 的姿态量化函数，而不是只按固定 fps 均匀抽帧；
- 写 `PaperPiece`、`PaperLabel`、`PastedEvidence`、`Tape`、`TornWipe` 五个基础组件，所有场景复用；
- 为每个元素保存进退场方向、时间、Identity Block ID 和固定种子；
- 主时间轴、字幕和音频保持 Foundry 既有数据结构。

Text-to-Lottie 只用于已经验证的矢量纸片替换动画。HyperFrames 仅在已有 HTML/GSAP 拼贴组件能直接复用时选择；二者都不能绕过关键帧 contact sheet 和最终主渲染器验收。

## 8. 硬失败与 QA

出现任一项即退回对应阶段：

- 同镜混用不一致的照片、插画、3D 或阴影体系；
- 主体或产品在镜间变脸、变形、改色、丢失关键结构；
- 运动连续丝滑到失去定格感，或随机抖动造成闪烁；
- 单屏多 Hero、装饰元素喧宾夺主、英文装饰过多；
- 真实 Demo 被抽象卡片或虚构界面替代；
- 撕边、纹理、阴影在镜间明显变化；
- 字幕、CTA 或证据进入平台遮挡区。
- 元素在画面中间无路径闪现/消失，或生成素材自行添加文字、标志、水印；
- 大面积粗网点、厚黑影、塑料光泽、真实景深、三维视差、相机呼吸；
- 每镜主要纸片组超过 6 组，或四周统一留白形成相框式外边框。

专项检查：

1. 输出关键帧 contact sheet，横向比较所有镜头的底纸、边缘、阴影和主体比例。
2. 逐帧检查镜头切入前后各 3–5 帧，确认没有平滑插值泄漏、闪帧或重影。
3. 对照 Identity Block 检查重复主体与道具的轮廓、比例、颜色、勾线、轴心和锚点。
4. 在静音状态确认画面仍能读懂主线；再带声音完整观看，确认纸张音效稀疏且与落点一致。
5. 运行 Foundry 通用严格审计；任何时间、SFX 或音乐变化后重新编码与测量。

## 9. 自定义扩展

允许覆盖：

- `palette`、`fontFamily`；
- `paper.textureOpacity`、`edge.roughness`；
- `shadow.offsetX/offsetY/blur/opacity`；
- `motion.holdPattern`、`motion.microSway`；
- `density.maxPaperGroups`、`density.subjectOccupancy`、`transitions.allowed`。

不得覆盖：单一 Hero、中文优先、统一主体处理、刚性纸片、确定性运动、真实证据、平台安全区和最终视听验收。
