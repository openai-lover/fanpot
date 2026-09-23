# FanPot

좋아하는 마음을 모아, 약속한 프로젝트를 함께.

K-pop 생일 광고·카페 프로젝트의 고정 예산 금고. **현재 단계는 로컬 개발 1차 구현이며, 실제 모금 서비스나 Mainnet 배포가 아닙니다.**

## 구현 기준

- `docs/reference/FanPot_Codex_Implementation_Handoff_KO.md`: 구현 기준.
- `docs/reference/FanPot_Product_and_Build_Spec_KO.md`: 배경·제품 방향.
- 이번 작업은 코드와 로컬 테스트를 시작하는 요청입니다. 문서에 포함된 공개 전환·배포·실제 송금·모집·지원서 제출은 실행하지 않았습니다.

## 이번에 구현한 것

- 비업그레이드 `FanPotFactory` + 캠페인별 독립 `FanPotCampaign`.
- 운영자 allowlist, Ownable2Step, 고정 검토자, 중복 draftRef 차단, 검토자 활성화.
- 1~100 USDC 목표·hard cap, 지갑당 누적 20 USDC, 최소 0.1 USDC와 최종 잔여액 예외.
- 1~3개 고정 예산, 운영자 1회 요청 → 검토자의 금액·증빙 hash 일치 확인 후 지급.
- 목표 미달/중단/기한 경과 환불, permissionless finalize/settle, 원래 주소로만 claimFor.
- 비례 환불, 무기한 미청구 권리, 0원 claim, rounding dust 유지, 직접 송금과 장부 분리.
- SafeERC20, storage ReentrancyGuard, CEI, Math.mulDiv, 입금 delta 검사.
- bigint 금액·gas 계산, canonical rules hash, 공개 개인정보 projection, 기여 receipt 검증.
- Next.js 영·한 홈/가상 프로젝트 상세/도움말/내 참여 안내/배포 증거 상태. UI는 **미리보기**이며 지갑 거래 기능은 연결 전입니다.
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

이 E2E는 **UI preview 검증**입니다. 명세의 local chain create→activate→support→pay→refund E2E, 실제 MetaMask/모바일 WalletConnect 테스트는 아직 구현하지 않았습니다. Foundry는 실제 Solidity bytecode를 로컬 EVM에서 실행하지만 Arc에서 실행한 결과는 아닙니다.

## 다음 구현 순서

1. Supabase SQL migration/RLS와 SIWE 일회 nonce·세션·행 소유권·CSRF.
2. prepared snapshot 고정, 이벤트 색인·receipt reconciliation·중복/역순 처리·원자적 cursor.
3. wagmi/viem 지갑 연결과 exact approval→contribution, pending/replacement 복구, 내 환불.
4. 운영자 생성, 검토·지급 UI, 증빙 재인코딩·고정 SHA-256.
5. local-chain E2E → Testnet 실제 지갑 검증 → 독립 리뷰 → Mainnet 준비.

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
