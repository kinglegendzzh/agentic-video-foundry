# Agentic Video Foundry repository constitution

All work in this repository MUST follow `skills/agentic-video-foundry/references/constitution.md` and the production/QC references linked from `SKILL.md`.

- Keep the distributable skill self-contained under `skills/agentic-video-foundry/`.
- Keep third-party projects as external optional integrations; do not vendor or relicense them in this repository.
- Pin reviewed third-party revisions in `THIRD_PARTY.md` and never use `curl | bash` installers.
- Never commit API keys, `.env` files, generated paid assets, or user media.
- Validate the skill, run the audit script against the reference project, and inspect Git status before release.
- Treat rendered visual and audio evidence as the completion standard.
