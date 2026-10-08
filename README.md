# Syntheon Local Installer

> **Pre-release distribution repository.** The public installer is not yet activated. Signed release artifacts and the account-first onboarding system are under engineering review. Do not run unofficial installation commands.

Syntheon Local links ChatGPT and other authorized AI clients to computers you own, with local trusted directories, explicit permission modes, outbound-only device agents and per-device revocation.

**Primary application:** https://syntheon-local.vercel.app

## What's here

- `install.sh` — Linux/macOS signed-release bootstrap **staged, disabled until release signing is commissioned**.
- `install.ps1` — Windows launcher placeholder, intentionally **disabled** until native packaging is independently verified.
- `RELEASE_CONTRACT.md` — precise security requirements for signed artifacts and cross-device updates.
- `SECURITY.md` — secure onboarding and vulnerability reporting principles.
- `docs/STATUS.md` — verified versus not-yet-released capabilities.

This repository is **deliberately separate** from the Syntheon Local control-plane source. Cloud relay, private APIs, tenancy data, environment files, signing secrets and customer material must never be committed here.

## Planned installation

One platform-appropriate command from the authenticated **Add computer** page will install a publisher-verified runtime. The account will issue a short-lived device code, which is approved in the signed-in dashboard or connected ChatGPT plugin. **The installer must never request the shared private-alpha owner key.**

The cross-platform installer must verify a pinned signing key, SHA-256, exact file length, trusted download origin and archive members **before executing any downloaded code**. Permission selection happens locally, initially in read-only mode. Installation is per-user without sudo/admin elevation.

**No fully functional one-command release exists yet.** The staged scripts fail closed. The current macOS and Ubuntu private pilots are usable by pre-authorized testers, but that does not constitute a public release.

## Safety and scope

- Linux Ubuntu pilot currently demonstrated on physical hardware; macOS developer pilot also connected.
- Windows installation, automatic lifecycle recovery, genuine individual sign-in and cloud transactional job fencing require release gates.
- Public endpoint URLs identify accounts; they **never** replace OAuth credentials or authorize device operations merely by being known.
- Do not paste API keys, OAuth refresh tokens, signing keys, local device state or owner keys into issues.

© 2026 Syntheon Technology Private Limited. All rights reserved unless a specific file carries a separate license.
