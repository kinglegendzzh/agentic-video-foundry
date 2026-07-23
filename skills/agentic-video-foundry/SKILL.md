---
name: agentic-video-foundry
description: Orchestrate Agentic Video Foundry, a complete and repeatable short-form video workflow from creative brief, script and art direction through renderer, extensible style and scene routing, provider-selectable ElevenLabs or Volcengine voice/music/SFX generation, real product-demo evidence, Text-to-Lottie assets, timestamped captions, deterministic animation, audio mixing, rendering, visual and technical QA, delivery, and learning capture. Use when Codex is asked to make, revise, polish, render, or standardize a vertical video for Xiaohongshu, Douyin, TikTok, Reels, Shorts, Bilibili, product demos, knowledge sharing, or social promotion, especially when the request includes a named visual style such as torn-paper collage stop motion or comic pop-art print, narration, background music, sound effects, programmatic motion graphics, reusable scenes, or repeated future production.
---

# Agentic Video Foundry

Produce a finished, auditable video rather than stopping at a script, storyboard, or render command. Treat picture, voice, music, sound effects, captions, mastering, and delivery as one synchronized system.

This Skill is distributed under the MIT terms in [LICENSE.txt](LICENSE.txt).

## Load the governing documents

Read [references/constitution.md](references/constitution.md) before making production decisions. Read [references/production-spec.md](references/production-spec.md) when planning or implementing the pipeline. Read [references/qc-checklist.md](references/qc-checklist.md) before claiming delivery.

Read [references/scene-routing.md](references/scene-routing.md) whenever a scene may use Text-to-Lottie, Remotion Scenes, or HyperFrames. Read [references/audio-provider-routing.md](references/audio-provider-routing.md) whenever narration, music, SFX, voice design, or voice cloning is requested. When Volcengine is selected or its service inventory is being evaluated, also read [references/volcengine-model-routing.md](references/volcengine-model-routing.md) and choose the explicit `cost`, `balanced`, or `quality` profile before spending. For an ElevenLabs-specific implementation, also read [references/remotion-elevenlabs.md](references/remotion-elevenlabs.md). Use installed specialist skills such as `text-to-lottie`, `hyperframes`, `hyperframes-core`, `hyperframes-animation`, `hyperframes-keyframes`, `hyperframes-creative`, `motion-graphics`, `motion-art-direction`, `remotion-video`, `remotion-best-practices`, `beat-sync-editing`, `caption-animation`, and `video-delivery-specs` when their narrower instructions are needed; Agentic Video Foundry owns their sequencing and acceptance gates.

Read [references/style-routing.md](references/style-routing.md) when the user names a visual style, asks for style options, or criticizes visual inconsistency. Load only the selected style module. For torn-paper collage, illustrated cutouts, or rigid stop motion, read [references/styles/flat-paper-collage-stop-motion.md](references/styles/flat-paper-collage-stop-motion.md) and copy its preset JSON into the project before implementing scenes.
For comic pop art, four-color print, halftone panels, speech bubbles, or sharp marketing motion, read [references/styles/comic-pop-art-motion.md](references/styles/comic-pop-art-motion.md) and copy its preset JSON before implementation.

## Execute the workflow

1. Inspect the actual project, source material, current renders, and platform constraints. If revising an existing video, extract stream metadata and inspect representative frames before changing it.
2. Write a one-sentence communication goal, audience, platform, target duration, CTA, emotional arc, evidence plan, and explicit exclusions. Turn the narration into beats; do not narrate every on-screen list. Product and tool videos must show real operation, source, or output evidence; motion graphics explain and focus that evidence rather than replacing it.
3. Select one style preset and persist its token overrides before routing scenes. A style preset controls material, palette, typography, motion grammar, evidence treatment, transition family, density limits, and hard failures; it does not replace the content or renderer plan.
4. Route every scene before implementation. Default the final composition to Remotion for frame-accurate React, reusable data-driven scenes, and audio synchronization. Use Text-to-Lottie for compact vector beats, icon/Logo reveals, diagrams, KPI hits, lower-thirds, and loops. Use HyperFrames as an alternative HTML/GSAP/Lottie scene or project renderer when DOM reuse materially reduces complexity. Treat Remotion Scenes as an optional source library to vendor 1–3 components per project, never as an Agent Skill. Do not combine runtimes inside one composition without a frozen interchange artifact and parity test.
5. Define the visual system and timing before polishing scenes: aspect ratio, safe zones, type scale, palette, motion tokens, scene map, one hero per frame, intentional rests, and one or two peak moments.
6. Secure credentials before paid generation. Read secrets from Keychain or environment variables, never source, prompts, manifests, logs, or shell history. Select ElevenLabs or Volcengine per audio role using the provider-routing reference; for Volcengine, persist an explicit `cost`, `balanced`, or `quality` routing profile and do not call OpenSpeech endpoints “Ark inference”. Generate low-cost voice auditions before the full narration. Save profile, service, provider, model, voice, prompt/text hash, duration, seed where supported, and content hashes in a secret-free manifest.
7. Generate narration by semantic segment. Use provider timestamps to derive the master scene timeline and captions. Treat mixed Latin phrases as atomic subtitle units. Regenerate only failed or changed segments.
8. Generate music to the story arc and sound effects only for meaningful transitions. Mix against the actual voice, not fixed percentages copied from another project. Keep music clearly audible on phone speakers while preserving speech intelligibility.
9. Build deterministic frame-driven visuals. Centralize timeline, theme, captions, audio cues, and the selected style preset. Render representative stills before a full encode and inspect the exact frames where overlays, transitions, and platform-safe areas are most likely to fail.
10. Render the complete video, then run the audit script and the manual checks in the QC checklist. Any voice, music, SFX, timing, or gain change invalidates previous audio measurements and requires a fresh full render and master check.
11. Deliver the final video, cover, captions, editable source, secret-free manifest, final script, publish copy, and concise reproduction commands. Record only verified, reusable surprises in `.learnings/`; promote recurring patterns to project rules or a skill.

## Preserve decision gates

- Do not claim that a named tool or provider was used without source, manifest, or output evidence.
- Do not spend credits on a full voice pass before auditioning the intended role and language unless the user explicitly chooses a known voice.
- Do not compensate for an overlong script by mechanically speeding the voice. Cut or rewrite first.
- Do not approve a composition from code inspection alone. Inspect rendered frames and listen to the encoded result.
- Do not reuse loudness or gain values after replacing any major audio asset.
- Do not expose a key supplied in conversation. Treat it as compromised and move future use to a secure store.
- Do not claim “API-key-only” voice cloning: cloning also requires a lawful sample and speaker identity, and some legacy long-text/podcast interfaces require App ID, Access Token, and Resource ID.
- Do not deliver a product-demo video made entirely from abstract cards when real UI, commands, source files, or outputs are available.

## Audit a project

Run:

```bash
node "$HOME/.agents/skills/agentic-video-foundry/scripts/audit-video-project.mjs" \
  --project /absolute/path/to/project \
  --video /absolute/path/to/final.mp4 \
  --strict
```

The audit checks expected artifacts, common secret leakage, nondeterministic animation patterns, manifest integrity, and final stream metadata. `--strict` makes missing project structure or an absent/empty audio manifest fail delivery; omit it only for intentionally silent or nonstandard projects and document the exception. It is a gate, not a substitute for watching and listening.
