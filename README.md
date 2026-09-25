# FanPot

좋아하는 마음을 모아, 약속한 프로젝트를 함께.

K-pop 생일 광고·카페 프로젝트의 고정 예산 금고. **현재 단계는 Arc Testnet 시연이며, 실제 모금 서비스나 Mainnet 배포가 아닙니다.**

## 구현 기준

- `docs/reference/FanPot_Codex_Implementation_Handoff_KO.md`: 구현 기준.
- `docs/reference/FanPot_Product_and_Build_Spec_KO.md`: 배경·제품 방향.
- `docs/grant-readiness.md`: Arc Microgrants 공식 자격 요건과 현재 미충족 항목.
- Arc Testnet의 가상 캠페인 네 개와 시연 지갑 거래만 실행했습니다. Mainnet 배포·실제 상품 발주·공모전 제출은 실행하지 않았습니다.

## 이번에 구현한 것

- 비업그레이드 `FanPotFactory` + 캠페인별 독립 `FanPotCampaign`.
- 운영자 allowlist, Ownable2Step, 고정 검토자, 중복 draftRef 차단, 검토자 활성화.
- 1~100 USDC 목표·hard cap, 지갑당 누적 20 USDC, 최소 0.1 USDC와 최종 잔여액 예외.
- 1~3개 고정 예산, 운영자 1회 요청 → 검토자의 금액·증빙 hash 일치 확인 후 지급.
- 목표 미달/중단/기한 경과 환불, permissionless finalize/settle, 원래 주소로만 claimFor.
- 비례 환불, 무기한 미청구 권리, 0원 claim, rounding dust 유지, 직접 송금과 장부 분리.
- SafeERC20, storage ReentrancyGuard, CEI, Math.mulDiv, 입금 delta 검사.
- bigint 금액·gas 계산, canonical rules hash, 공개 개인정보 projection, 기여 receipt 검증.
- Next.js 영어 기본 홈/가상 프로젝트 상세/도움말/내 참여 안내/배포 증거 상태. `/arc-demo`는 네 캠페인의 **실제 Arc Testnet 상태**를 읽고 광고 캠페인에 MetaMask로 테스트 USDC를 보낼 수 있습니다. `/mainnet`은 Arc Mainnet과 USDC를 읽기 전용으로 확인합니다.
- 설정값·실제 배포 증거가 없는 상태에서 production 검사를 통과하지 못하도록 차단.

## 로컬 실행

Node **24.15.0** 이상 24.x, pnpm **11.19.0**, Git이 필요합니다. 아래 명령은 저장소 루트에서 실행합니다.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm setup:contracts
pnpm test:contracts
pnpm verify:size
pnpm abi
pnpm test
pnpm lint
pnpm typecheck
pnpm build:local
pnpm exec playwright install chromium
pnpm test:e2e
pnpm dev
```

앱은 `http://127.0.0.1:3000`에서 열립니다. 미리보기에는 계정·키가 필요하지 않습니다. E2E 실행 전 동일 포트의 개발 서버를 종료하세요. 브라우저 설치 경로를 바꿨다면 `PLAYWRIGHT_BROWSERS_PATH`를 설치와 실행에 동일하게 적용하세요.

### Arc Testnet 시연

`http://127.0.0.1:3000/arc-demo`에서 네 가상 캠페인의 체인 상태를 확인합니다. 광고 캠페인은 7/10 USDC 모금 중이고, 굿즈 캠페인은 10 모금 → 9 지급 → 1 환급, 카페 캠페인은 10 모금 → 8 지급·선택 예산 생략 → 2 환급, 중단된 광고 캠페인은 5 모금 → 5 전액 환급을 시연합니다. 후원자는 실제 팬이 아니라 이 프로젝트가 통제하는 테스트 지갑입니다. 지급은 상품 구매나 광고 게재가 아닙니다. 금액은 소규모 테스트용이며 실제 견적이 아닙니다. 거래 해시와 공개 주소는 `apps/web/data/arc-testnet-demo.json`에 있습니다.

재현하려면 `node scripts/create-demo-wallets.mjs`로 Git에서 제외된 `.demo/keys.json`을 만들고 시연 organizer와 fanC 주소에 각각 Arc Testnet faucet USDC를 받은 뒤 `node scripts/compile-demo.mjs`, `node scripts/deploy-testnet-demo.mjs`, `node scripts/deploy-extra-testnet-demo.mjs`를 순서대로 실행합니다. 시연 스크립트는 운영자·검토자·가상 후원자·가상 공급자 지갑을 모두 통제합니다. 기밀 키나 시드 문구를 Git, 채팅, 브라우저에 넣지 마세요. 기존 시연은 [상세 기록](docs/arc-testnet-demo.md)에 설명했습니다.

`pnpm setup:contracts`는 forge-std v1.9.7의 exact commit을 검사합니다. Windows에서는 공식 solc-bin의 Solidity 0.8.30 바이너리를 SHA-256으로 검증해 `.tools/`에 설치합니다. 다른 플랫폼은 Foundry가 `foundry.toml`의 0.8.30을 사용합니다. npm으로 고정한 Forge 1.7.1을 `pnpm test:contracts`가 실행합니다. 시스템 Forge를 쓰면 `cd packages/contracts && forge test`도 가능합니다(Windows solc 경로 별도 지정 가능).

`pnpm build:local`은 키 없는 UI 검증용 빌드입니다. **`pnpm build`는 실제 production 환경값 검사를 먼저 실행하며, 현재는 실패하는 것이 정상입니다.** `verify:config`는 환경의 형식만 검사하며 실제 네트워크 검증을 대신하지 않습니다. `.env.example`을 보고 각 환경에 필요한 값을 주입하세요. Node 스크립트는 `.env`를 자동 로드하지 않습니다.

## 검증 결과 — 2026-09-21

| 검사 | 결과 |
|---|---|
| Foundry | 38개 통과, 환불 fuzz 1,000회, invariant 256 runs × 128 depth = 32,768 calls |
| Vitest | 22개 통과, 정수 환불 계산 10,000 생성 사례 포함 |
| Playwright | 16개 통과: desktop, 360/390/430px, 언어 저장·키보드 이동·오류·송금 차단 |
| TypeScript / ESLint / 로컬 build | 통과 |
| Production dependencies audit | 알려진 취약점 0개 보고(검사 시점의 registry 데이터) |
| Production config / proof | 의도대로 차단. 운영 설정·실제 배포 증거 없음 |
| Coverage report | Windows Foundry Solar의 dependency 경로 해석 오류로 미산출. 통과한 테스트를 coverage 또는 감사 결과로 대체 주장하지 않음 |

기존 Playwright E2E는 **UI preview 검증**입니다. 실제 MetaMask/모바일 WalletConnect 자동화 테스트는 아직 구현하지 않았습니다. 별도로 Arc Testnet에서 create→activate→support→pay→refund 거래를 실행했고 체인 상태를 확인했습니다. 이 Testnet 기록은 Mainnet 증거가 아닙니다.

## 다음 구현 순서

1. Supabase SQL migration/RLS와 SIWE 일회 nonce·세션·행 소유권·CSRF.
2. prepared snapshot 고정, 이벤트 색인·receipt reconciliation·중복/역순 처리·원자적 cursor.
3. 완전한 지갑 상태 복구, pending/replacement 처리, 내 환불 화면. 현재 MetaMask 경로는 Arc Testnet 기여만 지원합니다.
4. 운영자 생성, 검토·지급 UI, 증빙 재인코딩·고정 SHA-256.
5. local-chain E2E → 실제 MetaMask 지갑 검증 → 독립 리뷰 → Mainnet 준비.

현재는 이 후속 단계가 완료되지 않았으므로 실제 금전 결제를 활성화하지 않습니다. `verify:proof`는 manifest가 생겨도 실시간 receipt/bytecode verifier를 구현하기 전에는 계속 실패합니다.

## 계정·운영값이 필요한 시점

| 시점 | 필요한 값 |
|---|---|
| 서버 통합 검증 | Supabase 개발 프로젝트 URL·server service role key·DB 연결, 앱 origin, 독립 random secrets |
| 실제 모바일 지갑 통합 | WalletConnect project ID·허용 origin |
| Testnet 배포 | organizer/reviewer/publisher 지갑 주소, 로컬 하드웨어 지갑 또는 암호화 keystore, 테스트용 USDC |
| Production 준비 | Vercel 계정·cron 지원, 운영 DB·도메인·RPC, 실제 배포 block/주소/receipt, 검토된 공급자·운영 조건 |

키나 시드 문구를 채팅·클라이언트·Git에 넣지 않습니다. 현재 단계에는 추가 계정값이 필요하지 않습니다.

## 구조와 한계

`packages/contracts` 금전 권리, `packages/shared` 순수 검증, `apps/web` UI, `scripts` 로컬 검증, `docs` 구현 상태·운영 인계입니다. ABI는 Forge 산출물에서 생성합니다. 서버/Factory owner에게 기존 금고의 출금·규칙 변경권이 없습니다. 검토자와 운영자의 공모, 공급자 미이행, 토큰 동결, 체인 장애는 계약만으로 방지하지 못합니다. [보안 메모](docs/security.md), [아키텍처](docs/architecture.md), [다음 단계](docs/implementation-status.md)를 참고하세요.

프로젝트 코드 MIT. Noto Sans KR은 SIL OFL-1.1, Lucide는 ISC, OpenZeppelin은 MIT이며 별도 고지를 `docs/licenses/`에 보존합니다. LUMI와 LUMI Together는 가상의 시연 이름이고 포스터는 독자적인 텍스트/CSS 작업입니다.
