# Version Standard — CLI

Backend: GET /version -> { data: { version } } from package.json.version only
Next.js: server component reads package.json and displays
React SPA: axios fetch from backend /version and display with error state
Security: never expose full package.json