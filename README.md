# SplitMint

<p align="center">
  <a href="demo/demo.mp4"><img src="demo/demo.gif" alt="SplitMint demo" width="300"></a>
</p>

Demo walkthrough: sign up, create a group, add a member, split expenses equally and exactly, record a payment, confirm it as the other person, and see balances return to zero. Click the animation to open the full video: [demo/demo.mp4](demo/demo.mp4).

Share expenses in a group and settle up. A React Native app (Expo, TypeScript) on a Spring Boot + PostgreSQL backend. Demo project with fake data; it records payments but never moves money.

## Tech stack

- **App** — React Native + Expo (TypeScript), React Navigation (tabs + stacks), Expo Secure Store for the auth token, AsyncStorage for the theme choice. Runs in Expo Go on a physical phone.
- **Backend** — Spring Boot 3 (Java 21), Spring Security with JWT, Spring Data JPA, Flyway migrations, PostgreSQL, Maven. Tests: JUnit 5 + MockMvc against an embedded PostgreSQL.
- **CI** — GitHub Actions runs the backend tests and the app typecheck + unit tests on every push.

## Features

- Email + password accounts with hashed passwords and expiring JWT sessions
- Groups: create, add registered members by email, leave (only when your balance is zero)
- Expenses: title, amount, date, who paid, who shares; equal, exact or percentage splits, validated server-side
- Money is integer minor units everywhere; rounding leftovers are assigned in a fixed order so shares always add up exactly (100.00 / 3 = 33.34, 33.33, 33.33)
- Per-group balances plus suggested settlements (greedy heuristic; settles everyone, not guaranteed to be the fewest transfers)
- Record a payment between two people; the other side confirms before it changes balances; expenses lock once a payment exists (correct with a reversing expense)
- Idempotent creates: every save carries a client request id, so a double tap or retry saves once
- Per-group activity feed; one fixed currency per group
- Light, Dark or Match phone theme in Settings, remembered on the device

## How to run

Backend (needs Java 21+ and Docker for the database):

```bash
cd backend
docker compose up -d          # starts PostgreSQL
cp .env.example .env          # optional; defaults work locally
./mvnw spring-boot:run        # API on http://localhost:8080
```

Windows PowerShell one-command setup and run: `scripts\run.ps1`

App (needs Node 20+ and the Expo Go app on your phone):

```bash
cd app
npm install
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8080 npx expo start
```

Scan the QR code with Expo Go. The phone and computer must be on the same network.

Tests:

```bash
cd backend && ./mvnw test          # split rules, access rules, full API flow
cd app && npm test                 # split preview + money parsing
```

## Code flow

### Backend

Every request goes through the same path: JWT filter, controller, service, repository, PostgreSQL.

```mermaid
flowchart LR
    App["Expo app<br/>api.ts"] -->|"HTTPS + Bearer JWT"| Filter["JwtAuthFilter<br/>reads token, sets current user"]
    Filter --> Ctl["Controllers<br/>Auth, Group, Expense, Payment, Activity"]
    Ctl --> Svc["Services<br/>GroupService, SplitService,<br/>BalanceService, SettlementService"]
    Svc --> Repo["Spring Data repositories"]
    Repo --> DB[("PostgreSQL<br/>Flyway schema")]
    Ctl -. "errors" .-> Err["ApiErrorHandler<br/>JSON error + status"]
```

Saving an expense, and what protects edits afterwards:

```mermaid
flowchart TD
    E["POST /groups/{id}/expenses"] --> M{"Is the caller a member?"}
    M -- no --> X["403"]
    M -- yes --> I{"Request id already saved?"}
    I -- yes --> R["Return the saved expense<br/>(retries save once)"]
    I -- no --> V{"Payer and sharers<br/>are group members?"}
    V -- no --> X2["400"]
    V -- yes --> S["SplitService<br/>EQUAL / EXACT / PERCENT<br/>validate, round to minor units"]
    S --> T["One transaction:<br/>expense + expense_share rows"]
    T --> B["BalanceService<br/>paid - shares +/- confirmed payments"]
    B --> G["SettlementService<br/>greedy suggested transfers"]
    P["PUT / DELETE an expense"] --> C{"Caller created it?"}
    C -- no --> X3["403"]
    C -- yes --> L{"Payment recorded in the group?"}
    L -- yes --> X4["409 locked"]
    L -- no --> OK["Edit or delete"]
```

Recording and confirming a payment:

```mermaid
sequenceDiagram
    participant A as Payer (app)
    participant API as Backend
    participant DB as PostgreSQL
    participant B as Receiver (app)
    A->>API: POST /groups/{id}/payments
    API->>DB: insert payment (PENDING)
    API-->>A: pending, balances unchanged
    B->>API: POST /payments/{id}/confirm
    Note over API: only the other side may confirm
    API->>DB: status = CONFIRMED
    B->>API: GET /groups/{id}/balances
    API-->>B: balances include the payment
```

### Frontend

```mermaid
flowchart TD
    Boot["App.tsx<br/>load saved token"] --> Q{"Signed in?"}
    Q -- no --> Auth["AuthScreen<br/>register / log in"]
    Auth -->|"token + user id saved"| Tabs
    Q -- yes --> Tabs["Main tabs"]
    Tabs --> Groups["GroupsScreen<br/>list of groups"]
    Tabs --> Settings["SettingsScreen<br/>theme, log out"]
    Groups -->|"+"| New["NewGroupScreen"]
    Groups -->|"tap a group"| Detail["GroupDetailScreen<br/>balances, settlements, payments,<br/>expenses, members, activity"]
    New --> Detail
    Detail -->|"+"| Add["AddExpenseScreen<br/>add or edit, split preview"]
    Detail -->|"Record payment"| Pay["RecordPaymentScreen<br/>From / To / amount"]
    Add --> Detail
    Pay --> Detail
```

```mermaid
flowchart LR
    Screen["Screen"] --> Api["api.ts<br/>adds Bearer token, request id"]
    Api -->|"fetch"| Backend["Spring Boot API"]
    Api --> Store["Secure Store<br/>(token, user id)"]
    Screen --> Theme["theme.tsx<br/>Light / Dark / Match phone<br/>kept in AsyncStorage"]
    Screen --> Split["split.ts / format.ts<br/>split preview, money parsing"]
```

## Repo layout

| Path | What it is |
| ---- | ---------- |
| `app/` | Expo React Native app (screens, theme, API client) |
| `backend/` | Spring Boot API (domain, services, controllers, Flyway) |
| `backend/src/main/resources/db/migration/` | Database schema |
| `scripts/` | One-command setup and run |
| `demo/` | Demo video (`demo.mp4`) and preview animation |
| `.github/workflows/` | CI: backend tests, app typecheck and tests |

## Notes

- Demo project: seeded fake data, secrets come from environment variables (see `backend/.env.example`), nothing real is committed.
- A real deployment would need its own credentials and a security review; this repo is a portfolio demo, not a production service.
