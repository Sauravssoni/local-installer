# Signed release artifact contract v1 — proposed

The future public release endpoint should serve a UTF-8 JSON manifest and a detached Ed25519 signature over the EXACT original manifest bytes. NEVER trust a public signing key fetched from the same unsigned endpoint without an independently pinned trust root.

Manifest fields:
- schemaVersion: 1
- releaseVersion: semver
- publishedAt: ISO timestamp
- signingKeyId: audited publisher key identifier
- protocolVersion and installerMinVersion
- artifacts[]: target (linux-x64, linux-arm64, darwin-arm64, darwin-x64, win32-x64 only if tested), HTTPS artifact URL, exact bytes, sha256
- changelogUrl and supported/required runtime version

Bootstrap checks:
1. TLS fetch with bounded response size.
2. Pinned Ed25519 key verifies detached signature against exact manifest file bytes before parsing or using URLs.
3. HTTPS artifact URL host strict allowlist; refuse untrusted redirects.
4. Check downloaded artifact length and SHA-256 before extraction.
5. Reject absolute paths, traversal, symlinks, hardlinks, device nodes and unexpected archive root.
6. Install per-user, preserve existing policy and running agents, no silent replacement or root execution.
7. Signature verification for all updates and rollbacks; explicit revocation and downgrade policy.

Per-user MCP URL is a public account locator, NOT an authorization secret; the OAuth bearer must be scoped both to account ID and to exact resource URL.

BLOCKED: actual publisher key and artifacts endpoint do not exist, so public script must fail closed until signed releases ship.
