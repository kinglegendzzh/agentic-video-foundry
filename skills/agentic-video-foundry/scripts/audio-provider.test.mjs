import test from 'node:test';
import assert from 'node:assert/strict';
import {buildElevenLabsRequest, buildVolcSeedAudioPayload, explainProviderFailure, manifestRecord, normalizeVolcAudioResponse, PROVIDERS, VOLCENGINE_VIDEO_PROFILES} from './audio-provider.mjs';

test('Volcengine TTS uses subtitles and a speaker reference', () => {
  const payload = buildVolcSeedAudioPayload({id: 'hook', kind: 'tts', text: '你好，视频工厂。', voiceId: 'voice-id', output: 'hook.wav'});
  assert.equal(payload.model, 'seed-audio-1.0-multilingual');
  assert.equal(payload.text_prompt, '你好，视频工厂。');
  assert.deepEqual(payload.references, [{speaker: 'voice-id'}]);
  assert.equal(payload.audio_config.enable_subtitle, true);
  assert.equal(payload.audio_config.sample_rate, 48000);
});

test('Volcengine music stays prompt-driven and subtitle-free', () => {
  const payload = buildVolcSeedAudioPayload({id: 'bgm', kind: 'music', prompt: 'Bright instrumental beat', output: 'bgm.mp3', durationMs: 30000});
  assert.equal(payload.text_prompt, 'Bright instrumental beat');
  assert.equal(payload.references, undefined);
  assert.equal(payload.audio_config.enable_subtitle, false);
});

test('Volcengine can audition a prompt-designed voice without a speaker id', () => {
  const payload = buildVolcSeedAudioPayload({
    id: 'audition', kind: 'tts', text: '只读这一句。',
    voiceDirection: '年轻中文男性，轻松、有笑意、兴奋但不叫卖', output: 'audition.wav',
  });
  assert.match(payload.text_prompt, /年轻中文男性/);
  assert.match(payload.text_prompt, /只读这一句/);
  assert.equal(payload.references, undefined);
  assert.equal(payload.audio_config.enable_subtitle, true);
});

test('Volcengine reference-audio narration explicitly anchors the selected audition', () => {
  const payload = buildVolcSeedAudioPayload({
    id: 'segment', kind: 'tts', text: '继续这一句。',
    voiceDirection: '年轻中文男性', referenceAudioData: 'YWJj', output: 'segment.wav',
  });
  assert.match(payload.text_prompt, /@音频1/);
  assert.deepEqual(payload.references, [{audio_data: 'YWJj'}]);
});

test('ElevenLabs TTS requires an explicit voice id', () => {
  assert.throws(() => buildElevenLabsRequest({id: 'hook', kind: 'tts', text: '你好'}), /voiceId/);
});

test('manifest records hashes and never credentials', () => {
  const record = manifestRecord(
    {id: 'hook', kind: 'tts', text: '你好'},
    {provider: 'volcengine', model: 'seed-audio-1.0', output: '/tmp/hook.wav', buffer: Buffer.from('audio-data')},
    '/tmp',
  );
  assert.equal(record.path, 'hook.wav');
  assert.equal(record.sha256.length, 64);
  assert.equal(JSON.stringify(record).includes('apiKey'), false);
});

test('provider capabilities stay explicit', () => {
  assert.deepEqual(PROVIDERS.elevenlabs.capabilities, ['tts', 'music', 'sfx']);
  assert.ok(PROVIDERS.volcengine.capabilities.includes('voice-clone'));
});

test('Volcengine invalid-key response identifies the required credential product', () => {
  const message = explainProviderFailure({status: 401, body: '{"code":45000010,"message":"Invalid X-Api-Key"}', label: 'Volcengine Seed Audio'});
  assert.match(message, /Doubao Speech API key/);
  assert.match(message, /Ark model-inference key/);
  assert.doesNotMatch(message, /sk_|ark-[a-z0-9]{20}/i);
});

test('Volcengine missing grant distinguishes authorization from credential failure', () => {
  const message = explainProviderFailure({status: 403, body: '{"code":45000030,"message":"[resource_id=volc.service_type.10074] requested resource not granted"}', label: 'Volcengine Seed Audio'});
  assert.match(message, /credential is recognized/);
  assert.match(message, /volc\.service_type\.10074/);
  assert.match(message, /Service Activation/);
});

test('Volcengine speaker-scope error recommends target-service voices', () => {
  const message = explainProviderFailure({status: 400, body: '{"code":45001115,"message":"speaker x not found in speaker_map"}', label: 'Volcengine Seed Audio'});
  assert.match(message, /service-scoped/);
  assert.match(message, /prompt-designed audition/);
});

test('Volcengine accepts documented and audio-bearing success response shapes', () => {
  assert.equal(normalizeVolcAudioResponse({code: 0, audio: 'abc'}).success, true);
  assert.equal(normalizeVolcAudioResponse({audio: 'abc'}).success, true);
  assert.equal(normalizeVolcAudioResponse({data: {audio: 'abc'}}).success, true);
  assert.equal(normalizeVolcAudioResponse({code: 45000030, message: 'denied'}).success, false);
});

test('Volcengine video profiles expose cost, balanced, and quality routes', () => {
  assert.deepEqual(Object.keys(VOLCENGINE_VIDEO_PROFILES), ['cost', 'balanced', 'quality']);
  assert.match(VOLCENGINE_VIDEO_PROFILES.balanced.narration, /speech-synthesis-2\.0/);
  assert.match(VOLCENGINE_VIDEO_PROFILES.quality.verification, /asr-2\.0/);
});
