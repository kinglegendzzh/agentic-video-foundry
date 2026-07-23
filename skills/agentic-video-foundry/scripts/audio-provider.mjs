#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {basename, dirname, extname, isAbsolute, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PROVIDERS = {
  elevenlabs: {
    service: 'codex-elevenlabs-api-key',
    env: 'ELEVENLABS_API_KEY',
    capabilities: ['tts', 'music', 'sfx'],
  },
  volcengine: {
    service: 'codex-volcengine-speech-api-key',
    env: 'VOLCENGINE_SPEECH_API_KEY',
    capabilities: ['tts', 'music', 'sfx', 'voice-design', 'voice-clone', 'voice-status', 'voice-upgrade'],
  },
};

export const VOLCENGINE_VIDEO_PROFILES = {
  cost: {
    narration: 'speech-synthesis-1.0',
    score: 'audio-generation-1.0-single-candidate',
    verification: 'tts-alignment-first',
  },
  balanced: {
    narration: 'speech-synthesis-2.0-public-voice',
    score: 'audio-generation-1.0-two-music-candidates-key-sfx',
    verification: 'tts-alignment-with-asr-2.0-on-doubt',
  },
  quality: {
    narration: 'speech-synthesis-2.0-expressive-or-approved-clone-2.0',
    score: 'audio-generation-1.0-multi-candidate-scene-directed',
    verification: 'tts-alignment-plus-asr-2.0-and-manual-key-cues',
  },
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizedText = (value) => clean(value).replace(/[\s，。！？；：,.!?;:'“”‘’"()（）《》【】\-—]/g, '').toLowerCase();
const writeJson = (path, value) => {
  mkdirSync(dirname(path), {recursive: true});
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temp, path);
};

export const getCredential = (provider) => {
  const spec = PROVIDERS[provider];
  if (!spec) throw new Error(`Unknown provider: ${provider}`);
  const fromEnv = process.env[spec.env];
  if (fromEnv) return fromEnv;
  try {
    return execFileSync('/usr/bin/security', [
      'find-generic-password', '-a', process.env.USER, '-s', spec.service, '-w',
    ], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  } catch {
    throw new Error(`Missing ${provider} credential. Run store-audio-credential.sh ${provider}`);
  }
};

export const explainProviderFailure = ({status, body, label}) => {
  if (status === 401 && String(body).includes('45000010')) {
    return `${label} rejected X-Api-Key (45000010). Store a Doubao Speech API key from console.volcengine.com/speech/new/setting/apikeys; an Ark model-inference key (commonly prefixed ark-) is not valid for OpenSpeech.`;
  }
  if (status === 403 && String(body).includes('45000030')) {
    const resource = String(body).match(/resource_id=([^\]\s"]+)/)?.[1] ?? 'requested resource';
    return `${label} credential is recognized, but ${resource} is not granted (45000030). In the Doubao Speech console, open Service Activation and enable the matching Speech Synthesis / Audio Generation service for the same project as this API key.`;
  }
  if (status === 400 && String(body).includes('45001115')) {
    return `${label} rejected the selected speaker (45001115). Speaker IDs are service-scoped: a Podcast voice is not necessarily available to Audio Generation. Choose a speaker from the target service or use a prompt-designed audition without a speaker reference.`;
  }
  return `${label} failed (${status}): ${body}`;
};

const fetchChecked = async (url, init, label) => {
  const response = await fetch(url, {...init, signal: AbortSignal.timeout(240_000)});
  if (!response.ok) {
    const body = (await response.text()).slice(0, 1600);
    throw new Error(explainProviderFailure({status: response.status, body, label}));
  }
  return response;
};

export const buildVolcSeedAudioPayload = (asset) => {
  const kind = asset.kind;
  const isTts = kind === 'tts';
  const narration = clean(asset.text);
  const voiceDirection = clean(asset.voiceDirection);
  const referenceCue = asset.referenceAudioData ? '请参考@音频1的音色、年龄感、能量和口语节奏，' : '';
  const source = isTts
    ? voiceDirection
      ? `${referenceCue}请使用${voiceDirection}。只朗读书名号中的原文，不要朗读要求，不要增删或改写：《${narration}》`
      : narration
    : clean(asset.prompt);
  if (!source) throw new Error(`${asset.id ?? kind}: ${isTts ? 'text' : 'prompt'} is required`);
  const format = asset.format ?? (extname(asset.output ?? '').slice(1) || 'wav');
  return {
    model: asset.model ?? 'seed-audio-1.0-multilingual',
    text_prompt: source,
    references: asset.referenceAudioData
      ? [{audio_data: asset.referenceAudioData}]
      : asset.voiceId
        ? [{speaker: asset.voiceId}]
        : undefined,
    audio_config: {
      format,
      sample_rate: asset.sampleRate ?? 48000,
      speech_rate: isTts ? (asset.speechRate ?? 0) : undefined,
      loudness_rate: isTts ? (asset.loudnessRate ?? 0) : undefined,
      pitch_rate: isTts ? (asset.pitchRate ?? 0) : undefined,
      enable_subtitle: isTts,
    },
    watermark: asset.watermark,
  };
};

export const buildElevenLabsRequest = (asset) => {
  if (asset.kind === 'tts') {
    if (!asset.voiceId) throw new Error(`${asset.id}: ElevenLabs TTS requires voiceId`);
    return {
      path: `/v1/text-to-speech/${encodeURIComponent(asset.voiceId)}/with-timestamps?output_format=${asset.outputFormat ?? 'mp3_44100_192'}`,
      json: {
        text: clean(asset.text),
        model_id: asset.model ?? 'eleven_v3',
        language_code: asset.language ?? 'zh',
        seed: asset.seed,
        apply_text_normalization: 'on',
        voice_settings: asset.voiceSettings ?? {
          stability: 0.32,
          similarity_boost: 0.78,
          style: 0.46,
          use_speaker_boost: true,
          speed: 1,
        },
      },
    };
  }
  if (asset.kind === 'music') {
    return {
      path: `/v1/music?output_format=${asset.outputFormat ?? 'mp3_44100_192'}`,
      binary: true,
      json: {
        prompt: clean(asset.prompt),
        music_length_ms: asset.durationMs,
        model_id: asset.model ?? 'music_v1',
        force_instrumental: asset.forceInstrumental ?? true,
      },
    };
  }
  if (asset.kind === 'sfx') {
    return {
      path: `/v1/sound-generation?output_format=${asset.outputFormat ?? 'mp3_44100_192'}`,
      binary: true,
      json: {
        text: clean(asset.prompt),
        duration_seconds: asset.durationSeconds,
        loop: asset.loop ?? false,
        prompt_influence: asset.promptInfluence ?? 0.42,
        model_id: asset.model ?? 'eleven_text_to_sound_v2',
      },
    };
  }
  throw new Error(`Unsupported ElevenLabs kind: ${asset.kind}`);
};

const saveRemoteAudio = async (url, output) => {
  const response = await fetchChecked(url, {}, 'Audio download');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) throw new Error(`Generated audio is unexpectedly small: ${basename(output)}`);
  mkdirSync(dirname(output), {recursive: true});
  writeFileSync(output, buffer);
  return buffer;
};

export const normalizeVolcAudioResponse = (body) => {
  const payload = body?.data && typeof body.data === 'object' ? body.data : body;
  const code = body?.code == null ? null : Number(body.code);
  const hasAudio = Boolean(payload?.audio || payload?.url);
  const success = code === 0 || code === 20000000 || (code == null && hasAudio);
  return {payload, code, success};
};

const generateVolc = async (asset, apiKey) => {
  const payloadAsset = asset.referenceAudioPath
    ? {...asset, referenceAudioData: readFileSync(asset.referenceAudioPath).toString('base64')}
    : asset;
  const payload = buildVolcSeedAudioPayload(payloadAsset);
  const response = await fetchChecked('https://openspeech.bytedance.com/api/v3/tts/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Api-Request-Id': randomUUID(),
    },
    body: JSON.stringify(payload),
  }, 'Volcengine Seed Audio');
  const body = await response.json();
  const normalized = normalizeVolcAudioResponse(body);
  const payloadBody = normalized.payload;
  if (!normalized.success) {
    const keys = Object.keys(body ?? {}).filter((key) => !['audio', 'data'].includes(key)).join(',');
    throw new Error(`Volcengine Seed Audio failed (${normalized.code ?? 'no-code'}): ${body.message ?? payloadBody?.message ?? 'unknown error'}; response keys=${keys || 'none'}`);
  }
  if (asset.kind === 'tts' && payloadBody.subtitle?.text) {
    if (normalizedText(payloadBody.subtitle.text) !== normalizedText(asset.text)) {
      throw new Error(`${asset.id}: provider transcript differs from requested narration`);
    }
  }
  const output = resolve(asset.output);
  const buffer = payloadBody.audio
    ? Buffer.from(payloadBody.audio, 'base64')
    : payloadBody.url
      ? await saveRemoteAudio(payloadBody.url, output)
      : null;
  if (!buffer || buffer.length < 1024) throw new Error(`${asset.id}: Volcengine returned no usable audio`);
  if (payloadBody.audio) {
    mkdirSync(dirname(output), {recursive: true});
    writeFileSync(output, buffer);
  }
  return {
    provider: 'volcengine',
    model: payload.model,
    voiceId: asset.voiceId ?? null,
    durationMs: Number.isFinite(payloadBody.duration) ? Math.round(payloadBody.duration * 1000) : null,
    originalDurationMs: Number.isFinite(payloadBody.original_duration) ? Math.round(payloadBody.original_duration * 1000) : null,
    alignment: payloadBody.subtitle ?? null,
    requestId: response.headers.get('x-tt-logid') ?? null,
    output,
    buffer,
  };
};

const generateEleven = async (asset, apiKey) => {
  const request = buildElevenLabsRequest(asset);
  const response = await fetchChecked(`https://api.elevenlabs.io${request.path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'xi-api-key': apiKey},
    body: JSON.stringify(request.json),
  }, 'ElevenLabs');
  const output = resolve(asset.output);
  mkdirSync(dirname(output), {recursive: true});
  let buffer;
  let alignment = null;
  if (request.binary) {
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    const body = await response.json();
    buffer = Buffer.from(body.audio_base64 ?? '', 'base64');
    alignment = body.normalized_alignment ?? body.alignment ?? null;
  }
  if (buffer.length < 1024) throw new Error(`${asset.id}: ElevenLabs returned no usable audio`);
  writeFileSync(output, buffer);
  const durationMs = alignment?.character_end_times_seconds?.length
    ? Math.round(Math.max(...alignment.character_end_times_seconds) * 1000)
    : null;
  return {
    provider: 'elevenlabs',
    model: request.json.model_id,
    voiceId: asset.voiceId ?? null,
    durationMs,
    alignment,
    requestId: response.headers.get('request-id') ?? response.headers.get('x-trace-id') ?? null,
    output,
    buffer,
  };
};

export const manifestRecord = (asset, generated, root) => ({
  id: asset.id,
  kind: asset.kind,
  provider: generated.provider,
  routingProfile: asset.routingProfile ?? null,
  service: asset.service ?? null,
  model: generated.model ?? null,
  voiceId: generated.voiceId ?? null,
  voiceDirectionSha256: asset.voiceDirection ? sha256(clean(asset.voiceDirection)) : null,
  referenceAudioSha256: asset.referenceAudioPath ? sha256(readFileSync(asset.referenceAudioPath)) : null,
  textSha256: asset.text ? sha256(clean(asset.text)) : null,
  promptSha256: asset.prompt ? sha256(clean(asset.prompt)) : null,
  durationMs: generated.durationMs ?? null,
  originalDurationMs: generated.originalDurationMs ?? null,
  path: relative(root, generated.output),
  bytes: generated.buffer.length,
  sha256: sha256(generated.buffer),
  requestId: generated.requestId ?? null,
  alignment: generated.alignment ?? null,
  cueScene: asset.cueScene ?? null,
  cueOffsetFrames: asset.cueOffsetFrames ?? null,
  mixGain: asset.mixGain ?? null,
});

const volcVoiceRequest = async (operation, body, apiKey) => {
  const endpoints = {
    'voice-design': 'voice_design',
    'voice-clone': 'voice_clone',
    'voice-status': 'get_voice',
    'voice-upgrade': 'upgrade_voice',
  };
  const endpoint = endpoints[operation];
  if (!endpoint) throw new Error(`Unknown voice operation: ${operation}`);
  const response = await fetchChecked(`https://openspeech.bytedance.com/api/v3/tts/${endpoint}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Api-Key': apiKey, 'X-Api-Request-Id': randomUUID()},
    body: JSON.stringify(body),
  }, `Volcengine ${operation}`);
  const payload = await response.json();
  if (payload.code !== 0 && payload.code !== 20000000) {
    throw new Error(`Volcengine ${operation} failed (${payload.code}): ${payload.message ?? 'unknown error'}`);
  }
  return {
    code: payload.code,
    message: payload.message,
    speakerId: payload.speaker_id ?? body.speaker_id,
    customSpeakerId: body.custom_speaker_id ?? null,
    status: payload.status ?? null,
    modelType: payload.model_type ?? null,
    availableTrainingTimes: payload.available_training_times ?? null,
    demoAudio: payload.demo_audio ?? null,
    requestId: response.headers.get('x-tt-logid') ?? null,
  };
};

const argv = process.argv.slice(2);
const command = argv[0];
const valueOf = (name) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const has = (name) => argv.includes(`--${name}`);

const main = async () => {
  if (!command || has('help')) {
    console.log('Usage: audio-provider.mjs doctor|routes|generate|voice-status|voice-design|voice-clone|voice-upgrade [options]');
    return;
  }
  const provider = valueOf('provider') ?? 'volcengine';
  if (!PROVIDERS[provider]) throw new Error(`Unknown provider: ${provider}`);
  if (command === 'routes') {
    console.log(JSON.stringify(provider === 'volcengine' ? VOLCENGINE_VIDEO_PROFILES : {note: 'Profiles are currently defined for Volcengine.'}, null, 2));
    return;
  }
  if (command === 'doctor') {
    const credential = getCredential(provider);
    console.log(JSON.stringify({
      provider,
      credential: credential ? 'stored-not-validated' : 'absent',
      note: 'Credential presence does not prove that the key belongs to the required product or is authorized.',
      capabilities: PROVIDERS[provider].capabilities,
    }, null, 2));
    return;
  }
  if (command === 'generate') {
    const planPath = resolve(valueOf('plan') ?? 'audio-plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));
    const projectRoot = resolve(plan.projectRoot ?? dirname(planPath));
    const selectedProvider = valueOf('provider') ?? plan.provider;
    if (!PROVIDERS[selectedProvider]) throw new Error(`Unknown provider: ${selectedProvider}`);
    const routingProfile = plan.routingProfile ?? 'balanced';
    if (selectedProvider === 'volcengine' && !VOLCENGINE_VIDEO_PROFILES[routingProfile]) {
      throw new Error(`Unknown Volcengine routing profile: ${routingProfile}`);
    }
    const requestedAsset = valueOf('asset');
    const assets = requestedAsset
      ? (plan.assets ?? []).filter((asset) => asset.id === requestedAsset)
      : (plan.assets ?? []);
    if (requestedAsset && !assets.length) throw new Error(`Audio plan has no asset named: ${requestedAsset}`);
    if (!assets.length) throw new Error('The audio plan contains no assets');
    const planned = assets.map((asset) => ({
      ...(plan.assetDefaults ?? {}),
      ...asset,
      routingProfile: asset.routingProfile ?? routingProfile,
      output: isAbsolute(asset.output) ? asset.output : join(projectRoot, asset.output),
      referenceAudioPath: asset.referenceAudioPath
        ? (isAbsolute(asset.referenceAudioPath) ? asset.referenceAudioPath : join(projectRoot, asset.referenceAudioPath))
        : plan.assetDefaults?.referenceAudioPath
          ? (isAbsolute(plan.assetDefaults.referenceAudioPath) ? plan.assetDefaults.referenceAudioPath : join(projectRoot, plan.assetDefaults.referenceAudioPath))
          : undefined,
    }));
    if (!has('execute')) {
      console.log(JSON.stringify({dryRun: true, provider: selectedProvider, routingProfile, assets: planned.map(({id, kind, output, model, voiceId, service}) => ({id, kind, output, model: model ?? null, voiceId: voiceId ?? null, service: service ?? null}))}, null, 2));
      return;
    }
    const apiKey = getCredential(selectedProvider);
    const manifestPath = resolve(plan.manifest ?? join(projectRoot, 'src/data/audio-manifest.json'));
    const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {assets: []};
    let manifestAssets = previous.assets ?? [];
    for (const asset of planned) {
      const generated = selectedProvider === 'volcengine'
        ? await generateVolc(asset, apiKey)
        : await generateEleven(asset, apiKey);
      const record = manifestRecord(asset, generated, projectRoot);
      manifestAssets = manifestAssets.filter((item) => `${item.kind}:${item.id}` !== `${record.kind}:${record.id}`);
      manifestAssets.push(record);
      writeJson(manifestPath, {schemaVersion: 1, provider: selectedProvider, routingProfile, generatedAt: new Date().toISOString(), assets: manifestAssets});
      console.log(`generated ${asset.id} (${asset.kind})`);
    }
    console.log(`manifest ${manifestPath}`);
    return;
  }
  if (provider !== 'volcengine') throw new Error(`${command} is only implemented for volcengine`);
  if (!has('execute')) throw new Error(`${command} is a paid or stateful operation; add --execute after reviewing the request`);
  const apiKey = getCredential(provider);
  const speakerId = valueOf('speaker');
  if (!speakerId) throw new Error('--speaker is required');
  let body = {speaker_id: speakerId};
  if (valueOf('custom-speaker')) body.custom_speaker_id = valueOf('custom-speaker');
  if (command === 'voice-design') {
    body = {
      ...body,
      text: valueOf('text'),
      prompt: {text_prompt: valueOf('prompt')},
      language: Number(valueOf('language') ?? 0),
    };
  }
  if (command === 'voice-clone') {
    const sample = resolve(valueOf('sample'));
    if (!existsSync(sample)) throw new Error('--sample must point to a local audio file');
    body = {
      ...body,
      audio: {data: readFileSync(sample).toString('base64'), format: extname(sample).slice(1)},
      text: valueOf('text'),
      language: Number(valueOf('language') ?? 0),
      extra_params: {
        demo_text: valueOf('demo-text'),
        enable_audio_denoise: has('denoise'),
        disable_volume_normalization: has('disable-volume-normalization'),
      },
    };
  }
  const result = await volcVoiceRequest(command, body, apiKey);
  console.log(JSON.stringify(result, null, 2));
};

if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
