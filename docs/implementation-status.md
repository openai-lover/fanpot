# Implementation status / next handoff

2026-09-21: completed the first local implementation milestone requested by the user. The full implementation handoff remains the acceptance standard. This is not a completed MVP.

| Handoff area | State |
|---|---|
| §5–6 and §15.5–6 campaign/factory core | Implemented and exercised on Foundry local EVM |
| §15.13 integer amount checks | Shared parser and contribution limit checks implemented |
| §15.7 canonical rules hash | Pure schema and hashing implemented; DB prepared transaction and chain binding pending |
| §8 public projection | Pure helper implemented and tested; API/DB/RLS/cache boundary pending |
| §15.9 gas and receipt | Pure gas guard and contribution log validation implemented; wallet state machine pending |
| §4/7 UI | Responsive bilingual local preview, no real financial totals or payment actions |
| §15.4 SQL / auth / indexing / APIs | Pending; health endpoint only |
| Uploads / sanitized evidence | Pending |
| Create / support / thanks / manage flows | Pending |
| Deployment scripts / Arc Foundry / source verification | Pending |
| §15.16 local chain browser E2E | Pending; current Playwright suite tests the preview only |
| Actual desktop/mobile wallet and Testnet | Pending |
| Mainnet / public URL / proof / grant submission | Not performed |

Next concrete milestone: SQL schema/RLS and authenticated metadata lifecycle, then shared idempotent index ingestion. Preserve prepared snapshots and public/private output separation from the start. Keep code-only progress possible before user accounts are needed. Request Supabase development credentials only when connecting to a real development DB, and WalletConnect project ID only when enabling that connector.

Git origin is `https://github.com/openai-lover/fanpot.git`. This work is local; no GitHub push, repository visibility change, external message or transaction has been performed. Browser GitHub sign-in from earlier work is separate from CLI/connector authentication.
