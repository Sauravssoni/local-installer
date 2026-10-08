# Release status — Syntheon Local Installer

Updated 2026-10-08. Keep statements aligned with tested physical devices.

## Working private pilots

- MacBook Pro: existing macOS agent, connected to the hosted private-alpha relay.
- Ubuntu IdeaPad: physical Ubuntu x86_64 agent installed successfully under the user's home directory; systemd --user service active; paired through connected ChatGPT without entering the shared owner key.
- Both devices are visible online at the same time, each with a distinct ID.
- Ubuntu local runtime doctor passed; an outside-trust-root read and an unapproved write were both denied.

These are developer acceptance results, not complete cross-platform release certification.

## Public installer repository

- `install.sh`: pre-release Linux/macOS signed-manifest/bootstrap implementation; deliberately **fails closed** because no publisher public key has been configured.
- `install.ps1`: intentionally disabled Windows launcher; no verified Windows package exists.
- No signed artifact or supported one-command public installation is published yet.
- Neither private cloud repository nor customer authentication data is present in this repository.

## Required before enabling production installation

1. Package an audited standalone local runtime/agent for each supported OS+architecture; preferably bundle the Node runtime so consumer installation requires no separate developer toolchain.
2. Generate and securely manage Ed25519 publisher release signing key; pin its public half in each published bootstrap; implement reviewed rotation/revocation.
3. Publish immutable manifest and signed manifest bytes; verify exact target, content hash, length and archive path safety.
4. Test on fresh Ubuntu and macOS accounts, reconnect/reboot/sleep/logout/user-service lifecycle, upgrade, uninstall and revocation. Windows requires its own native tests and signing.
5. Replace private-alpha global owner-key login with independent personal OAuth/OIDC/passkey accounts and proper consent.
6. Validate per-account MCP endpoint resource/audience isolation, device authorization epoch and transactional job queue integration.
7. Run security and license scans and separate user-acceptance QA before public release.

**Never run the pre-release scripts expecting installation today.** Operators testing the private alpha should use the restricted internal pilot, not copy credentials into this repository.
