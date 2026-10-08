# Syntheon Local distribution security

This is a private staging area for a future public installer. Do not claim the bootstrap is production-ready and do not mirror proprietary Syntheon Local control-plane source.

Never enter an account owner key, GitHub PAT, backend secret, device token or service-role key in the installer, pairing UI or support issue.

A new device requests a short-lived code. An already-authenticated user grants approval from dashboard or connected ChatGPT. Local trusted roots and permission mode apply to every operation, and the relay may not remotely extend them.

Security QA includes signatures, stale/downgraded releases, path traversal, symlink extraction, compromised CDN, credentials leakage, replayed pairing codes, cross-account IDOR, revoked-device races, forced logout, network partitions, encrypted result-outbox corruption and fencing tokens.

Verification failure must be fatal, BEFORE executable payloads run.
