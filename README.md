# ArenaFlow: Smart Stadium & Tournament Operations Command Center

ArenaFlow is a premium, high-performance web dashboard designed for Stadium Managers, Tournament Directors, and Operations Leads. It bridges the gap between tournament flow (bracket scheduling, match operations) and physical venue logistics (crowd bottlenecks, safety dispatches, staff shifts).

---

## 🏟️ Core Features

1. **Shared Operational Picture (Overview)**
   - Dashboard summary cards highlighting live stadium capacity percentage, active safety issues, power grid loads, and workforce counts.
   - Real-time active matches ticker display.
   - Dynamic gate bottleneck trackers mapping queues (Low, Medium, High).

2. **Interactive SVG Venue Map**
   - Responsive vector blueprint mapping Gates (A, B, C, D), restrooms, concourses, and seating tiers (100 and 200 levels).
   - Real-time color coding indicating crowd density or alert statuses.
   - Interactive zone inspection details: click a sector to log new incidents or coordinate local responders.
   - Emergency pulsing warnings mapping active hazards.

3. **Knockout Bracket Controller**
   - Complete 8-team single-elimination tournament bracket visualization.
   - Score update panel with strict validations (checks for positive integers, resolves knockout draws).
   - Dynamic winner progression advancing qualifiers into Semifinals and Finals slots.
   - **Role Enforcement**: Edit actions restricted solely to the *Tournament Director* scope.

4. **Incident Dispatch & Coordination**
   - Active ticket board featuring category logs (Security, Traffic, Maintenance, Medical) and priority ratings (Low, Medium, High, Critical).
   - Full dispatcher flow: assign active personnel, track shifts, resolve tickets, and inspect logs.
   - **Role Enforcement**: Dispatching and resolving tickets is restricted to the *Director* and *Security Chief* scopes; *Guest Services* is restricted to filing new tickets.

5. **Workforce Shifts & Roster**
   - Shift coordination board tracking staff availability (Active Duty, On Break, Checked Out).
   - Displays real-time task allocations to monitor and prevent responder overloading.

6. **Operations Analytics Telemetry**
   - Cumulative ticket scanning graphs displaying gate throughput curves.
   - Queue duration charts comparing concessions and restrooms.
   - Incident ratios plotting issues logged per session.

---

## 🏗️ Architecture & Technical Stack

- **Core**: React 19, TypeScript 5, Vite 6
- **Styling**: Vanilla CSS (Cyberpunk dark theme, glassmorphic panels, glowing micro-animations, fully responsive)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Testing**: Vitest 4, React Testing Library, JSDOM
- **Persistence**: LocalStorage state synchronization

### State Isolation (SOLID Principles)
To decouple UI rendering from business logic, the application isolates operations state within a custom hook: `src/hooks/useStadiumState.ts`. It acts as the local database controller, managing data transformations, local storage sync, input validations, role restrictions, and mock sensor data telemetry streams.

---

## 📂 Folder Structure

```
SmartStadium/
├── src/
│   ├── assets/                 # SVGs and images
│   ├── components/             # Reusable UI dashboard panels
│   │   ├── AnalyticsDashboard.tsx   # Recharts telemetry graphs
│   │   ├── IncidentManager.tsx      # Dispatch safety alerts board
│   │   ├── StadiumMap.tsx           # Interactive SVG floor plan
│   │   ├── StaffShiftBoard.tsx      # Workforce shifts roster
│   │   └── TournamentBracket.tsx    # Brackets scheduler controller
│   ├── hooks/                  # Isolated business logic
│   │   └── useStadiumState.ts       # Main React state & operations hook
│   ├── test/                   # Test setups
│   │   └── setup.ts                 # LocalStorage polyfill setup
│   ├── App.tsx                 # Main layout shell and routing
│   ├── index.css               # Design system & HSL variables stylesheet
│   └── main.tsx                # Entry mount script
├── index.html                  # SEO & viewport headers
├── vite.config.ts              # Vite & Vitest setup configuration
└── package.json                # Project dependencies and script scripts
```

---

## 🚀 Installation & Local Run

### Prerequisites
- Node.js (version 18 or above recommended)
- npm or yarn

### Steps
1. Clone the project and navigate into the directory:
   ```bash
   cd SmartStadium
   ```
2. Install all base and development dependencies:
   ```bash
   npm install
   ```
3. Run the development server locally:
   ```bash
   npm run dev
   ```
   *Note: If port 5173 is in use, Vite will automatically bind to `http://localhost:5174/`.*

4. To run the automated unit tests:
   ```bash
   npm run test
   ```
   *(or `npx vitest run`)*

5. To verify and compile the production bundle:
   ```bash
   npm run build
   ```

---

## ⚙️ Environment Configurations

By design, ArenaFlow requires **zero external configuration files or credentials** to run, reducing setup friction. Mock telemetry streams are simulated automatically on interval cycles. 

To configure port bindings, update the `server` block in `vite.config.ts`:
```typescript
server: {
  port: 5173,
  strictPort: true
}
```

---

## 📋 Mock API Telemetry Documents

While ArenaFlow is a frontend SPA dashboard persisting states in LocalStorage, it mocks standard API formats for integration:

### 1. Match Object Schema
```json
{
  "id": 1,
  "round": 1,
  "team1": { "id": "1", "name": "Cyber Knights", "logoColor": "#00f0ff" },
  "team2": { "id": "2", "name": "Apex Wolves", "logoColor": "#ef4444" },
  "score1": 5,
  "score2": 3,
  "status": "completed",
  "winnerId": "1",
  "time": "14:00"
}
```

### 2. Incident Object Schema
```json
{
  "id": "inc-1720275883011",
  "title": "Restroom Leak North Wing",
  "description": "Water pipe leak in restrooms near Gate A.",
  "category": "maintenance",
  "priority": "medium",
  "status": "dispatched",
  "zone": "restrooms",
  "staffAssigned": "s5",
  "reportedAt": "2026-07-06T21:04:43.011Z"
}
```
