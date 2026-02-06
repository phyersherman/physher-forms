# GitHub Copilot Instructions – Multi‑Tenant LMS (Node.js)

## General goals

- Build a multi‑tenant, white‑label LMS framework in **Node.js**.
- Single codebase, many “course portals” (tenants), each with:
  - Its own domain or subdomain.
  - Its own users and course content.
  - Its own configurable branding and theme.
- The system must be:
  - On‑prem friendly (simple config, container‑friendly).
  - Easy to move later to a cloud hosting platform without major refactors.

## Architecture preferences

- Backend: Node.js, prefer **TypeScript** for any new files.
- Style: layered structure (controllers/routes → services → data access).
- Multi‑tenancy:
  - Use a `tenantId` (or `tenant_id`) field to scope data.
  - Keep tenant‑agnostic code reusable; tenant‑specific behavior should be driven by configuration.

## Naming conventions

- Files and folders:
  - Use `kebab-case` for filenames, e.g. `tenant-service.ts`, `course-controller.ts`.
  - Group by feature/domain where practical (e.g. `tenants/`, `courses/`, `auth/`).
- Classes and types:
  - `PascalCase` for classes, interfaces, and types (e.g. `TenantService`, `CourseController`, `ThemeConfig`).
- Variables and functions:
  - `camelCase` for variables and functions (e.g. `resolveTenant`, `getTenantTheme`).
- Database:
  - `snake_case` for table and column names (e.g. `tenant_id`, `theme_config`), unless the existing schema dictates otherwise.

## Coding style

- Prefer small, focused functions.
- Keep business logic in services, not in controllers or route handlers.
- Use async/await consistently.
- Validate inputs at the boundary (controllers/routes) before calling services.
- Favor explicit over “magic” behavior; avoid hidden side effects.

## Tenant and theming concepts (high‑level only)

- There should be clear concepts for:
  - A **tenant** (course portal) identified by a `tenantId`.
  - Domain‑based tenant resolution (from the request host).
  - A **theme configuration** object per tenant that drives branding (colors, logos, typography).
- Themes and tenant behavior should be driven by data/config, not hard‑coded logic.

## How Copilot should assist

- Default to patterns already present in the repo; otherwise follow these conventions.
- When generating new code:
  - Use the naming and style rules above.
  - Keep designs multi‑tenant aware (accept or derive `tenantId` where appropriate).
  - Prefer portable solutions that work both on‑prem and in common cloud environments.
- When refactoring existing code, improve clarity and maintainability while adhering to these conventions.
- Suggest comments and documentation that clarify multi‑tenant behavior and configuration options.

Course/Module structure and editor

“In this LMS, a course is made of chapters/sections, each containing one or more modules/lessons arranged in order.
	•	Admins should be able to:
	•	Add, rename, and reorder chapters/sections.
	•	Add, duplicate, and reorder modules/lessons inside a chapter via drag‑and‑drop.
	•	Mark certain modules as ‘required’ and optionally enforce prerequisites (e.g., must complete a previous module or pass a quiz).”

The Squarespace‑style lesson editor
“For each module/lesson, the editor should work like Squarespace’s lesson page builder:
	•	The lesson page is composed of stacked blocks/sections: text, image, video, gallery, quote, accordion/FAQ, buttons, etc.
	•	Admins can:
	•	Click ‘Add section/block’ and choose a block type.
	•	Drag blocks up/down to reorder them.
	•	Edit content inline (titles, body text, media, links, downloads).
	•	Remove or duplicate blocks.
	•	The editor shows a live preview of how the lesson will appear to learners

  Quiz/assignment widget and gating

“Extend the editor with a dedicated Quiz / Assignment widget:
	•	The widget can be added as a block in a lesson (or as its own module) and configured with:
	•	Type: quiz or assignment.
	•	Question set / configuration reference.
	•	Passing criteria: min score or completion state.
	•	Attempts allowed and feedback options.
	•	In the module settings, add gating controls such as:
	•	 requiresQuizPassToContinue  (boolean).
	•	 prerequisiteModuleId  or a list of prerequisite modules.
	•	A toggle like ‘Passing is required to access next lesson/module’, similar to “strict mode / passing is required” in other LMSs.
	•	If gating is enabled, the course navigation should prevent moving to the next module until the quiz is passed or assignment is marked complete.”