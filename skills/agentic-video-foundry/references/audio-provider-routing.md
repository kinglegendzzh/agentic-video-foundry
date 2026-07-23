# 音频供应商路由：ElevenLabs 与火山豆包语音

本管线把音频供应商当作可替换后端，而不是把供应商字段散落在 Remotion 场景里。短视频仍遵守同一事实链：脚本 → 真实音频 → 对齐数据 → 时间轴/字幕 → 混音 → 完整母带重测。

## 先纠正命名

`openspeech.bytedance.com` 下的接口属于火山引擎豆包语音/OpenSpeech。它们与火山方舟通用大模型推理 API 不是同一套协议。配置名统一使用 `volcengine`，避免把 `ark` 当成请求协议或 endpoint 名称。

## 能力矩阵

| 任务 | ElevenLabs | 火山豆包语音 | 默认路由 |
|---|---|---|---|
| 30–90 秒中文旁白 | Timestamped TTS | Seed Audio `/api/v3/tts/create` 或 V3 TTS | 同稿 3 个试听后选择 |
| 字幕时间 | 字符级 alignment | `enable_subtitle=true` 的句/词时间 | 直接作为时间轴事实源 |
| BGM | Music API | Seed Audio 纯提示词生成 | 先低成本试听，再按剧本弧生成 |
| SFX | Sound Effects API | Seed Audio 纯提示词生成 | 只做关键落点 |
| 音色设计 | Voice Design/Library | `/api/v3/tts/voice_design` | 可选；不是每条视频都新建 |
| 声音复刻 | 需相应计划/授权 | `/api/v3/tts/voice_clone` | 可选高级能力；需样本与 speaker ID |
| 音色状态 | 供应商接口 | `/api/v3/tts/get_voice` | 复刻后必须查询到 2/4 才可合成 |
| 10 万字长文本 | 非短视频默认链 | `/api/v3/tts/submit` + `/query` | 单独工作流，不进入 30–90 秒默认链 |
| 双人播客 | Studio/项目能力 | `/api/v3/sami/podcasttts` | 单独节目形态，不冒充普通旁白 |

## “只给 API Key”的真实边界

新版控制台的 Seed Audio、音色设计、声音复刻与音色查询可以使用 `X-Api-Key`。这能覆盖短视频旁白、BGM、SFX 和可选音色流程。

这里的 Key 必须来自[豆包语音新版控制台的 API Key 管理](https://console.volcengine.com/speech/new/setting/apikeys?projectName=default)。普通火山方舟模型推理 Key（常见 `ark-` 前缀）不能用于 OpenSpeech 的 `X-Api-Key`，即使它已经成功写入 Keychain。`doctor` 只检查凭据是否已存储，首次付费试听才会验证产品归属与权限。

API Key 还必须与已开通目标能力的同一项目匹配。`45000030 requested resource not granted` 表示 Key 已被识别，但对应服务未授权；进入新版控制台的「开通管理」，为该项目开通「语音合成大模型 → 音频生成」或请求实际调用所需的对应服务。开通可能改变计费状态，管线只诊断和引导，不自动替用户开通。

但以下能力不能承诺只靠 API Key：

- 声音复刻还需要合法语音样本、`speaker_id`，后付费模式还需 `custom_speaker_id`；
- 音色设计需要预先取得可用的 `speaker_id`；
- 用户提供的长文本与播客材料仍显示 `App ID + Access Token + Resource ID` 鉴权；除非官方新版文档明确迁移，否则不能伪装成单 Key 接口；
- 内置音色合成仍需一个已授权的音色 ID。若没有音色 ID，只能走纯提示词生成并先核对是否逐字忠实。

## 安全存储

对话里粘贴过的密钥视为已暴露，先在控制台轮换。然后在本机交互式保存：

```bash
~/.agents/skills/agentic-video-foundry/scripts/store-audio-credential.sh volcengine
~/.agents/skills/agentic-video-foundry/scripts/store-audio-credential.sh elevenlabs
```

服务名分别是 `codex-volcengine-speech-api-key` 和 `codex-elevenlabs-api-key`。脚本隐藏输入；源码、计划、manifest、日志和命令行都不得出现密钥。

## 供应商无关计划

`audio-provider.mjs` 消费一个无密钥 JSON 计划。默认是 dry-run；真正付费生成必须显式添加 `--execute`。

```json
{
  "provider": "volcengine",
  "projectRoot": "/absolute/path/to/video-project",
  "manifest": "/absolute/path/to/video-project/src/data/audio-manifest.json",
  "assets": [
    {
      "id": "hook",
      "kind": "tts",
      "text": "脚本不是成片。真正的工作，从声音和演示开始。",
      "voiceId": "authorized-speaker-id",
      "output": "public/audio/voiceover/hook.wav",
      "model": "seed-audio-1.0-multilingual",
      "speechRate": 4,
      "loudnessRate": 6,
      "pitchRate": 1
    },
    {
      "id": "bgm",
      "kind": "music",
      "prompt": "118 BPM playful maker-tech instrumental, crisp percussion, no vocals, clean ending",
      "output": "public/audio/bgm.wav",
      "model": "seed-audio-1.0-multilingual"
    }
  ]
}
```

```bash
node ~/.agents/skills/agentic-video-foundry/scripts/audio-provider.mjs generate \
  --plan /absolute/path/to/audio-plan.json

node ~/.agents/skills/agentic-video-foundry/scripts/audio-provider.mjs generate \
  --plan /absolute/path/to/audio-plan.json \
  --execute
```

## 试听与定稿规则

1. 同一 8–12 秒文案生成至少 3 个同角色候选；先听发音、停连、情绪和是否像真人，再看“模型先进”标签。
2. TTS 请求开启供应商字幕/对齐；火山返回文本与原稿不一致时自动失败，禁止让改词音频进入时间轴。
3. 正式旁白按语义段生成。片段变化只重生成该片段，但任何声线变化都重建完整时间轴和混音。
4. BGM 用相同结构提示生成 2–3 个候选；选择基于钩子稀疏、主体律动、转折留白、高潮和干净结尾。
5. 火山 Seed Audio 单次最长 120 秒；超长内容使用长文本工作流，不通过倍速或截尾规避。
6. 声音复刻首次正式合成可能触发音色槽位费用。训练试听满意前，不调用正式旁白合成。

## 供应商切换验收

换供应商等于换了音频系统，不是换一个 URL。必须重新生成/校准：

- 每段实际时长；
- 句/词时间戳与字幕分页；
- 场景切点、J/L cut 和节拍落点；
- VO/BGM/SFX 增益与 ducking；
- 完整成片 LUFS、dBTP、削波、爆音和手机外放听感。

旧供应商的音量百分比、时间轴或母带结果一律作废。
