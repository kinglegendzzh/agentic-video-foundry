# Third-party integration ledger

Agentic Video Foundry orchestrates but does not redistribute these projects.

| Project | Reviewed revision | License | Role |
|---|---|---|---|
| [diffusionstudio/lottie](https://github.com/diffusionstudio/lottie) | v1.0.0 / `a4e20b894d6335b02a29e4bcdec864bab5104675` | MIT | Text-to-Lottie Skill and Skia/Skottie verification workspace |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | v0.7.62 / `7f761709569dcc1d8a46c132e629d85fbe68dcb2` | Apache-2.0 | Optional HTML/GSAP/Lottie video backend and authoring skills |
| [lifeprompt-team/remotion-scenes](https://github.com/lifeprompt-team/remotion-scenes) | Resolve and pin before per-project vendoring | MIT | Optional Remotion React/TSX scene source library; not an Agent Skill |

The local installation intentionally omits HyperFrames `media-use`: the reviewed version includes a `curl | bash` installer suggestion that conflicts with the repository supply-chain policy. Agentic Video Foundry keeps media generation, credentials, provenance, and audio mastering in its own controlled pipeline.
