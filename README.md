✨ Features
🔓 Public Access for Students

No login required → anyone can browse and contribute instantly.

Anonymous posting with optional name field for identity.

Supports all post types:

📝 Text notes

💻 Code snippets

🖼️ Images

📄 PDFs and study files

🛡️ Admin-Only Authentication

Admin button (with shield icon) for secure access.

/auth page reserved only for admins.

/dashboard route fully protected → only admins can manage posts and content.

Unauthorized users are automatically blocked from admin routes.

🗄️ Database & Policies

Public users: read + create posts/files without login.

Admins: full control, including delete and management operations.

Supabase Row Level Security (RLS) ensures correct access separation.

🎨 Modern UI/UX

Light/Dark mode toggle with sun/moon icons.

Theme choice persists across reloads (saved in localStorage).

Floating scroll buttons (↑ ↓) for smooth navigation to top/bottom.

Responsive design → works seamlessly on desktop and mobile.

Accessible: ARIA labels, keyboard support, and smooth transitions.

🛠️ Tech Stack

Frontend: React + Vite + TailwindCSS

Backend/DB: Supabase (Postgres + Auth + Storage)

Hosting: Netlify

🤖 Built with AI Assistance

This project was created while vibe coding — giving prompts to an AI (ChatGPT) to:

Generate components and routes

Debug Supabase errors (RLS, foreign keys, etc.)

Add features like dark mode, anonymous posting, and scroll buttons

Polish UI/UX and accessibility

I guided the process with my own prompts and decisions, while the AI handled much of the code scaffolding.
