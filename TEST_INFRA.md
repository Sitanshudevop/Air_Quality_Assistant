# E2E Test Infra: Saans (Milestone M0 Foundation)

## Test Philosophy
- **Requirement-Driven**: Tests are derived strictly from user requirements in `ORIGINAL_REQUEST.md` and `PROMPT.md`, completely independent of implementation internals.
- **Opaque-Box Architecture**: The test suite treats the repository and its runtime as an external black box. Tests execute against filesystem artifacts, CLI commands, and wire HTTP network sockets via an ephemeral serverless harness.
- **Strict Isolation**: The E2E test runner is decoupled from Vitest to safeguard Milestone M0's strict unit test coverage thresholds (statements >= 92%, branches >= 85%, functions >= 90%, lines >= 93% with zero exclusions).
- **Native Reliability**: Built entirely with Node.js native `node:test` and `node:assert/strict` (supported on Node 20+ and v24.22.1 LTS) with zero external test-framework dependencies.

## Feature Inventory Mapping
| # | Feature Area | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|--------------|--------------------|:-----------------:|:-----------------:|:---------------------:|:-----------------:|
| F1 | Scaffolding & Tooling | ORIGINAL_REQUEST §12-13, PROJECT §71-75,87 | 5 | 5 | ✓ | ✓ |
| F2 | Code Quality Guardrails | ORIGINAL_REQUEST §13, PROJECT §76-83 | 5 | 5 | ✓ | ✓ |
| F3 | Serverless AI Status Contract | ORIGINAL_REQUEST §19, PROJECT §93,163-170 | 5 | 5 | ✓ | ✓ |
| F4 | Serverless AI Proxy Contract | ORIGINAL_REQUEST §19, PROJECT §94-105,126-162 | 5 | 5 | ✓ | ✓ |
| F5 | Vercel Security & Routing | ORIGINAL_REQUEST §21, PROJECT §106-110 | 5 | 5 | ✓ | ✓ |
| F6 | Verification Scripts | ORIGINAL_REQUEST §22, PROJECT §111-112 | 5 | 5 | ✓ | ✓ |
| F7 | CI Pipeline Configuration | ORIGINAL_REQUEST §16, PROJECT §92 | 5 | 5 | ✓ | ✓ |

## Test Architecture

### 1. Test Runner & Invocation
- **Location**: `tests/e2e/runner.mjs`
- **Invocation**: `node tests/e2e/runner.mjs` (or `npm run test:e2e`)
- **Semantics**:
  - Executes test files across all 4 tiers sequentially.
  - Aggregates individual test results.
  - Exits with code `0` on 100% test pass.
  - Exits with code `1` on any assertion failure with formatted failure diagnostics.

### 2. Directory Layout
```
tests/e2e/
├── runner.mjs                      # Master test runner and aggregator
├── helpers/
│   ├── server-harness.mjs          # In-process ephemeral HTTP server for wire-testing
│   └── workspace-inspect.mjs       # Static analysis and configuration inspectors
├── tier1-features.test.mjs         # 35 Tier 1 Feature Coverage tests
├── tier2-boundary.test.mjs         # 35 Tier 2 Boundary and Edge tests
├── tier3-combinations.test.mjs     # 8 Tier 3 Cross-Feature Combination tests
└── tier4-scenarios.test.mjs        # 5 Tier 4 Real-World Application Scenario tests
```

### 3. Ephemeral Serverless Wire Harness (`server-harness.mjs`)
- Dynamically imports `api/ai.ts` and `api/ai-status.ts` using Node v24 ESM loader.
- Starts an in-process `node:http` server bound to OS-allocated port `127.0.0.1:0`.
- Translates network HTTP requests into standard Web `Request` objects.
- Dispatches requests to exported named Web Standard handlers (`GET` on `ai-status`, `POST` on `ai`).
- Returns wire HTTP responses with exact headers (`Content-Type: application/json`, `Cache-Control: no-store`, etc.) and status codes.
- Permits black-box `fetch()` testing over actual TCP sockets.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 4.1 | Clean Git Clone & Fresh Setup Verification | F1, F2, F5, F7 | Medium |
| 4.2 | Severe Smog Season Citizen Query & AI Advisory Flow | F3, F4, F5 | High |
| 4.3 | Adversarial Penetration, Fuzzing & Prompt Defense | F3, F4, F5 | High |
| 4.4 | Full Deployment Smoke Verification Simulation | F3, F4, F5, F6 | Medium |
| 4.5 | CI Pipeline Pre-Flight Verification Simulation | F1, F2, F5, F6, F7 | High |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: >= 5 tests per feature area across F1-F7 (Total: 35 tests).
- **Tier 2 (Boundary & Corner Cases)**: >= 5 boundary tests per feature area across F1-F7 (Total: 35 tests).
- **Tier 3 (Cross-Feature Combinations)**: >= 7 pairwise combination tests (Total: 8 tests).
- **Tier 4 (Real-World Application Scenarios)**: >= 5 realistic multi-step end-user scenarios (Total: 5 tests).
- **Total Suite Minimum**: >= 83 test cases.
