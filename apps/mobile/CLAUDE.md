@AGENTS.md

For Claude work in this folder:

- preserve React Native ownership
- prefer shared semantic contracts with mobile-specific rendering on top
- when a production build is needed, point the user at `pnpm build:aab` / `pnpm build:apk` and walk through the AGENTS.md pre-build checklist — do not launch the build yourself (interactive, long-running, hits EAS managed credentials)
- never regenerate, overwrite, or "fix" the Android keystore through `eas credentials` autonomously; ask the user first
