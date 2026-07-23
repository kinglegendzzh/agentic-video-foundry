# 波普漫画印刷动效

`id: comic-pop-art-motion`

这是面向短视频生产的通用波普艺术模块，使用二十世纪中叶漫画印刷、粗黑轮廓、网点、色块错位和分格叙事语言；不复刻特定艺术家的签名构图，也不使用受版权保护的角色或商标。

## 目录

1. 适用范围
2. 五阶段状态机
3. 视觉系统
4. 运动语言
5. Identity Block 与连续性
6. 证据、文字与生成提示块
7. 实现建议
8. 硬失败与 QA
9. 自定义扩展

## 1. 适用范围

适合产品发布、观点钩子、功能对比、榜单、营销短片、知识解释和高能 CTA。它依靠强对比色块与漫画分格快速建立注意力，不适合严肃政务、低刺激疗愈、奢侈品极简或需要长时间阅读密集表格的内容。

支持 `text-to-video`、`image-to-video`、`video-restyle` 与 `idea-to-video`。产品与工具视频仍必须规划真实证据；波普图形只能聚焦证据，不能把真实操作替换成虚构漫画界面。

默认 preset：[`../../assets/style-presets/comic-pop-art-motion.json`](../../assets/style-presets/comic-pop-art-motion.json)。

## 2. 五阶段状态机

| 阶段 | 产物 | 完成条件 |
| --- | --- | --- |
| S01 诊断 | `01-brief.md` | 锁定受众、平台、时长、唯一结论、CTA、证据、情绪强度与禁止项 |
| S02 分格 | `02-storyboard.md` | 每镜一个 Hero；写明 panel、主动作、文字、证据、进退场与音效落点 |
| S03 锁定风格 | `03-style-spec.md` + `style-preset.json` | 固定墨色、线宽、网点、字体、阴影、错版量、转场族与 Identity Block |
| S04A 关键帧 | `keyframes/` + contact sheet | 钩子、转折、高潮、CTA 的印刷语言与信息层级一致 |
| S04B 合成 | 可编辑工程与预览 | 动作服从统一的 snap 节奏，真实证据像素保持可读 |
| S05 验收 | `05-qa.md` + 交付清单 | 清零闪屏、摩尔纹、文字过载、色彩漂移与音效刺耳问题 |

## 3. 视觉系统

### 材质与构图

- 全片采用平面四色印刷感：粗黑轮廓、纯色块、局部细网点、轻微套色偏移。
- 默认一镜一个漫画 panel；高潮最多使用 2–3 格，但必须有一格占主导。
- Hero 占画面约 40%–68%；支持物最多两个。
- 使用斜切分格、放射爆炸框、速度线或对话气泡时，每帧最多选一种强调装置。
- 大面积背景保持纯色或低密度网点，不叠加渐变、玻璃、噪点和光效。

### 配色

- 墨黑 `#101010`、纸白 `#FFF7E8`。
- 主色默认电光黄 `#FFD400`、亮青 `#00B7D9`、热红 `#F2385A`。
- 可选辅助色钴蓝 `#2457D6`、荧光绿 `#7AC943`。
- 同屏最多三种高饱和色加黑白；颜色承担叙事分组，不能随机轮换。
- 真实 UI 区域不得覆盖高密度网点或色偏滤镜，以免文字与细线失真。

### 排版

- 中文使用粗黑体，标题 2–10 个汉字；同屏最多一个主标题和一个短拟声/标签。
- 英文只保留产品名、命令、文件名或不可替代品牌词。
- 允许 `啪！`、`砰！`、`咔！` 等拟声字，但每个镜头最多一个，并必须对应真实音效落点。
- 精确字幕、网址、数字、Logo 和命令后期合成，不交给图像生成模型。

### 网点与套色

- 网点直径以 1080px 画布计 5–10px，间距 10–18px；只用于阴影或单块背景。
- 网点必须以固定 SVG/CSS 图案生成，禁止缩放视频纹理造成摩尔纹。
- 套色偏移仅用于装饰轮廓，默认 3–8px；正文、Logo、UI 和人脸不得错版。
- 阴影使用单一硬边黑色偏移，不叠加柔光、环境光和多方向投影。

## 4. 运动语言

定位为 `kinetic-sharp`，人格为 `Energetic`，但通过停顿防止全片持续喊叫。

| 属性 | 规则 |
| --- | --- |
| 基础时间单位 | 6 帧；大动作使用 12 或 18 帧 |
| 主缓动 | `ease-out-expo` 等价逐帧曲线 |
| 进场 | 画外 snap slide、panel cut、遮罩揭示 |
| 转场 | panel slam、ink wipe、match cut；全片最多两族 |
| 级联 | 3–6 帧错开 |
| 过冲 | Hero 最大 12%，支持物最大 5% |
| 停顿 | 每个主要落点保持至少 18 帧 |
| Ambient | 默认静止；网点和套色不得持续漂移 |

允许：

- 100%→112%→100% 的一次性 punch；
- 2–6° 的分级旋转落位；
- 分格从画外推入、遮罩切开、色块硬切；
- 同一主体在预制姿态之间切换；
- 音画同步的单次拟声字冲击。

禁止：

- 全片持续缩放、镜头呼吸、无种子抖动；
- 多个爆炸框、速度线、气泡和拟声字同时争抢；
- 弹性果冻、液体变形、3D 旋转卡片；
- 高频逐帧黑白闪烁或超过一次的强烈闪光；
- 把每个词都做成 kinetic typography。

## 5. Identity Block 与连续性

重复角色、产品、漫画面板和拟声装置分别建立 Identity Block：

| 字段 | 必须记录 |
| --- | --- |
| 轮廓 | 黑线宽度、转角、外形比例 |
| 配色 | 主色、阴影色、允许的套色偏移 |
| 网点 | 图案 ID、直径、间距、角度 |
| 锚点 | 主体中心、panel 边界、对话气泡尾部 |
| 状态 | 起始姿态、高潮姿态、结束保持 |
| 禁止变化 | 字体、Logo、产品几何、人物面部与肤色 |

逐镜记录 `enter_from`、`exit_to`、`start_state`、`end_state`、`panel_id` 与 `identity_ids`。相邻镜头优先通过共同色块、轮廓或 panel 边缘 match cut；没有共同锚点时使用完整遮罩覆盖后再切镜，禁止元素凭空消失。

## 6. 证据、文字与生成提示块

真实 UI、终端、源码和成片进入漫画 panel 时：

- 内部像素保持原样，不加网点、套色、透视和漫画滤镜；
- 外围可加粗黑边、短标签、箭头或单次放射强调；
- 同时只放大一个证据区域；
- 细小文字在 1080px 成片上不可读时，改为真实裁切放大，而不是重新绘制。

### 全局正向提示块

```text
Bold flat comic pop-art print for vertical motion graphics. Clean mid-century four-color print language, thick consistent black ink outlines, solid cyan yellow red and warm-white color blocks, restrained fine halftone dots only in selected shadow areas, slight controlled ink-registration offset on decorative outlines, one dominant comic panel and one clear hero, sharp diagonal composition, crisp speech-bubble or burst accents only when narratively required. Deterministic frame-to-frame identity, flat 2D layers, high legibility, strong negative space, snap poses with intentional holds. Precise text and logos will be composited later.
```

### 全局负向提示块

```text
No 3D rendering, no glossy plastic, no glassmorphism, no gradients, no realistic depth of field, no painterly brushwork, no grunge overload, no dense full-screen halftone, no moire patterns, no neon glow, no random extra panels, no extra text, no watermark, no copyrighted characters, no artist signature, no face drift, no logo distortion, no continuous camera breathing, no liquid morphing, no strobing black-white flashes.
```

## 7. 实现建议

Remotion 默认实现：

- 用固定 SVG path 或 CSS polygon 创建 panel、气泡与爆炸框；
- 网点使用固定像素 `radial-gradient` 或 SVG pattern，不随帧缩放；
- 轮廓、阴影和套色偏移全部由 preset token 生成；
- 用帧函数实现 snap、punch 和 hold，不使用 CSS animation；
- 提供 `ComicPanel`、`PopHeadline`、`BurstBadge`、`HalftoneField`、`EvidencePanel` 五个基础组件；
- 强调音效先限制高频与峰值，再对齐 punch 落点；转场附近检查波形与频谱。

Text-to-Lottie 适合单次拟声字、Logo reveal 和可复用 burst；HyperFrames 仅在已有网页漫画组件可直接复用时选择。最终仍由唯一主时间轴合成和验收。

## 8. 硬失败与 QA

硬失败：

- 同屏超过三种高饱和色，或每镜任意换色；
- 网点覆盖正文、Logo、UI 或人脸；
- 高频网点缩放产生摩尔纹或闪烁；
- 3D 翻转、玻璃、霓虹、柔光破坏平面印刷语言；
- 多 Hero、多爆炸框、多拟声字造成视觉喊叫；
- 精确文字由生成模型生成；
- 漫画滤镜损坏真实证据；
- 转场音效出现刺啦、削波或高频突刺；
- panel、角色或产品跨镜变形、改色、换线宽。

专项 QA：

1. 输出全片 contact sheet，核对四色、线宽、网点密度、panel 规则与 Hero 层级。
2. 在 100% 尺寸检查网点与细线；再按手机尺寸检查摩尔纹和字幕。
3. 逐帧检查每个 panel slam、punch 和遮罩前后 5 帧，无闪白、背面翻转或抗锯齿跳变。
4. 对转场前后各 1 秒单独提取音频，检查波形、频谱、削波和非预期宽带瞬态。
5. 带声音完整观看，确认拟声字与真实音效一一对应且不过密。

## 9. 自定义扩展

允许覆盖：品牌色映射、黑线宽度、网点直径/间距、装饰套色偏移、panel 斜角、punch 强度、拟声字词表和两种转场族。

不得覆盖：单一 Hero、三色上限、精确文字后合成、真实证据可读性、确定性帧驱动、无 3D 翻转、无高频闪烁、平台安全区与最终视听验收。
