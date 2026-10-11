# PlantPulse AI

PlantPulse AI is a full-stack manufacturing maintenance application created for AIML-515 Assignment 5.3. It transforms simulated equipment-health readings into transparent risk indicators, recommended inspection steps, and human-reviewed maintenance work orders.

## Why this app is different from NetAssist AI

NetAssist AI is a conversational broadband support application. PlantPulse AI is an operational workflow application with persistent records, equipment dashboards, sensor validation, explainable risk scoring, feedback, and work-order status management.

## Technology

- React and Vite frontend
- Node.js and Express REST API
- JSON-backed local persistence for the classroom MVP
- Explainable AI-style condition analysis using validated sensor thresholds and health trends
- Optional future Gemini integration through a server-side environment variable

## Local setup

1. Open the `PlantPulse-AI` folder in VS Code or Cursor.
2. Open a terminal in the project root.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:5173`.

The API runs at `http://localhost:3001`. No API key is required for the demonstrated analysis workflow.

## Features to test

1. Review the operations dashboard and priority queue.
2. Open the AI-assisted analysis for any equipment record.
3. Filter the Equipment page by risk.
4. Submit the prefilled manual sensor reading.
5. Create a work order from the highest-risk recommendation.
6. Change work-order status.
7. Submit helpful/not-helpful feedback.
8. Resize the browser to confirm responsive behavior.

## Responsible AI boundaries

- The interface labels recommendations as AI-assisted.
- Evidence and threshold values are shown with each result.
- Recommendations never stop machinery automatically.
- A qualified technician must verify maintenance and shutdown decisions.
- Manual data is validated before analysis.
- Demonstration users are warned not to enter confidential production information.

## Testing and security verification

- Run `npm test` to execute the 15 unit, validation, and API regression tests.
- Run `npm run build` to verify the production frontend bundle.
- Run `npm audit --audit-level=moderate` to review dependency vulnerabilities.
- Server-side validation enforces text lengths, numeric ranges, and allowed workflow values.
- Development CORS is limited to localhost; production uses same-origin requests.
- API responses include security and no-store headers, write endpoints are rate-limited, and JSON request bodies are limited to 100 KB.
- The local JSON store uses atomic writes and owner-only file permissions.
- The UI includes visible keyboard focus, alert/status announcements, Escape-to-close dialog behavior, focus restoration, and reduced-motion support.

The classroom MVP does not include production authentication, role-based access control, encrypted managed storage, or formal audit logging. Do not use it with confidential or operational production data.

## Production roadmap

A production version would replace the local JSON store with managed PostgreSQL, connect to authenticated IoT sensor streams, add role-based access controls and audit logs, and evaluate model quality using labeled historical maintenance outcomes.

## Deployment

The repository includes two production deployment paths:

- `apprunner.yaml` defines the Node.js 22 build, test, start, and port settings for an AWS account that already has access to App Runner.
- `Dockerfile` packages the same application for Google Cloud Run or Amazon ECS Express Mode.

The production server serves the compiled Vite frontend and the Express API from one container on the cloud-provided `PORT`. The JSON demonstration store is ephemeral in a stateless cloud container and is not intended for production records.
# PlantPulse-AI
