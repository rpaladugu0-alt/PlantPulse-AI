# AI Development Prompt Log

These are the refined prompts used to guide the second application build.

1. **Architecture prompt:** Build PlantPulse AI as a full-stack React/Vite and Node/Express application. Separate frontend components, backend routes, data access, and analysis logic. Include a root-level install, development, build, and start workflow.
2. **Workflow prompt:** Create a manufacturing dashboard with equipment health, explainable risk scores, sensor evidence, a manual reading form, and a human-reviewed work-order queue. Do not allow AI output to stop machinery automatically.
3. **Quality prompt:** Add validation, loading states, retryable errors, empty-safe rendering, responsive design, accessible labels, and clear responsible-AI disclaimers.
4. **Persistence prompt:** Add simple local persistence for work orders and feedback while keeping the implementation easy to replace with PostgreSQL later.
5. **Deployment-readiness prompt:** Use the environment-provided port, provide a production build command, serve the Vite build through Express, and document environment variables in `.env.example`.
6. **Testing prompt:** Verify dashboard loading, risk filters, manual analysis, invalid input handling, work-order creation, status updates, feedback, API health, and production build.
