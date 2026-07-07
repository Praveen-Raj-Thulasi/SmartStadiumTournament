# ArenaFlow: Full-Stack MERN (MongoDB, Express, React, Node.js) Dashboard

We are migrating ArenaFlow to a full-stack **MERN stack** application. The React frontend will reside in a `/frontend` directory, and a Node.js + Express + TypeScript server using MongoDB (via Mongoose) will reside in a `/backend` directory.

## User Review Required

> [!IMPORTANT]
> - **MERN Stack Architecture**:
>   - **Frontend**: React + TypeScript + Vite.
>   - **Backend**: Node.js + Express + TypeScript.
>   - **Database**: MongoDB (persisted via Mongoose ODM).
> - **Database Connection**: The backend will connect to a local MongoDB instance at `mongodb://127.0.0.1:27017/arenaflow`. We will include environment variable configurations in a `.env` file to customize the URI.
> - **Database Auto-Seeding**: On backend startup, Mongoose schemas will check if collections are empty. If empty, the database will be automatically seeded with standard tournament quarterfinals, initial staff shifts, and starting incident logs so the dashboard displays operational telemetry immediately.
> - **Security Middleware**: Express middleware will intercept requests to check for the presence and validity of the `x-user-role` header on restricted endpoints (bracket updates and responder dispatches), enforcing security on the server.

## Open Questions

> [!NOTE]
> No critical questions remaining. We will proceed with the standard MERN stack configuration.

---

## Proposed Changes

### Directory Layout Restructuring
- Move all current files into a new [frontend/](file:///home/praveen/Desktop/Projects/SmartStadium/frontend/) folder.
- Create a new [backend/](file:///home/praveen/Desktop/Projects/SmartStadium/backend/) folder for Express.
- Setup a root-level `package.json` to launch both using `concurrently`.

---

### Backend Models & Schemas

#### [NEW] [backend/src/models/Match.ts](file:///home/praveen/Desktop/Projects/SmartStadium/backend/src/models/Match.ts)
Mongoose schema defining the tournament match node:
- `id`: Number (1-7)
- `round`: Number (1-3)
- `team1`: { name: String, logoColor: String, id: String }
- `team2`: { name: String, logoColor: String, id: String }
- `score1`: Number
- `score2`: Number
- `status`: String ('scheduled', 'live', 'completed')
- `winnerId`: String
- `time`: String
- `prevMatch1Id`: Number
- `prevMatch2Id`: Number

#### [NEW] [backend/src/models/Incident.ts](file:///home/praveen/Desktop/Projects/SmartStadium/backend/src/models/Incident.ts)
Mongoose schema defining safety alerts:
- `id`: String (inc-timestamp)
- `title`: String
- `description`: String
- `category`: String ('security', 'crowd', 'maintenance', 'medical')
- `priority`: String ('low', 'medium', 'high', 'critical')
- `status`: String ('open', 'dispatched', 'resolved')
- `zone`: String
- `staffAssigned`: String (reference to Staff ID)
- `reportedAt`: Date
- `resolvedAt`: Date

#### [NEW] [backend/src/models/Staff.ts](file:///home/praveen/Desktop/Projects/SmartStadium/backend/src/models/Staff.ts)
Mongoose schema for workforce personnel:
- `id`: String
- `name`: String
- `role`: String ('security', 'medical', 'janitorial', 'technician')
- `status`: String ('active', 'inactive', 'on_break')
- `assignedTasks`: Number

---

### Backend Core Code

#### [NEW] [backend/package.json](file:///home/praveen/Desktop/Projects/SmartStadium/backend/package.json)
Dependencies: `express`, `cors`, `mongoose`, `dotenv`.
DevDependencies: `typescript`, `@types/express`, `@types/cors`, `@types/node`, `ts-node-dev`.

#### [NEW] [backend/src/db.ts](file:///home/praveen/Desktop/Projects/SmartStadium/backend/src/db.ts)
Connect to MongoDB via Mongoose and perform auto-seeding for `Match`, `Staff`, and `Incident` collections if they are empty.

#### [NEW] [backend/src/index.ts](file:///home/praveen/Desktop/Projects/SmartStadium/backend/src/index.ts)
Implement Express REST routes, security check middleware, validation rules, and dynamic metrics telemetry logic.

---

### Frontend Modifications

#### [MODIFY] [frontend/vite.config.ts](file:///home/praveen/Desktop/Projects/SmartStadium/frontend/vite.config.ts)
Configure the Vite dev server `proxy` settings to map `/api` to `http://localhost:5000`.

#### [MODIFY] [frontend/src/hooks/useStadiumState.ts](file:///home/praveen/Desktop/Projects/SmartStadium/frontend/src/hooks/useStadiumState.ts)
Update fetch triggers, state sync actions, and custom header integrations to point to the backend routes.

---

## Verification Plan

### Automated Tests
- Test backend endpoints utilizing an in-memory MongoDB environment (`mongodb-memory-server`) or mocking Mongoose models in Jest-style contexts.
- Update frontend hook tests to intercept API actions.

### Manual Verification
- Launch both environments concurrently using the root wrapper.
- Verify MERN data flows: check that database items persist on reloads, brackets advance correctly, and incidents are dispatched/resolved with updates synced to the MongoDB collections.
