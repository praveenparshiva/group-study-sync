📚 Notes – Community Student Hub

A collaborative platform where students can share notes, code snippets, images, and study materials.
Built to be public-first → anyone can contribute without needing to log in.

🔗 Live Demo: labshub.netlify.app

------------------------------------------------------------------------

✨ Features
🌍 Public Access

No login required → anyone can browse and contribute instantly.

Anonymous posting with an optional name field.

Supports multiple post types:

📝 Text notes

💻 Code snippets

🖼️ Images

📄 PDFs and study files

🛡️ Admin-Only Authentication

Admin button (with shield icon) for secure access.

/auth route reserved only for admins.

/dashboard fully protected → only admins can manage posts and content.

Unauthorized users are automatically blocked from admin routes.

🗄️ Database & Policies

Public users → can read + create posts/files without login.

Admins → full control, including delete and management operations.

Supabase Row Level Security (RLS) ensures correct access separation.

🎨 Modern UI/UX

🌗 Light/Dark mode toggle with sun/moon icons.

Theme choice persists across reloads (saved in localStorage).

⬆️⬇️ Floating scroll buttons for smooth navigation to top/bottom.

Responsive design → works seamlessly on desktop and mobile.

------------------------------------------------------------------------
🛠️ Tech Stack

Frontend: React + Tailwind CSS

Backend/DB: Supabase (authentication, database, file storage)

------------------------------------------------------------------------
Deployment: Netlify

🚀 Deployment

The project is live and hosted on Netlify:
🔗 labshub.netlify.app

------------------------------------------------------------------------
🤖 Built with AI Assistance

This project was created while vibe coding with AI.
I provided prompts and guided the workflow, while AI helped generate and refine the code.
The result: a fast, functional, and polished community Student hub ✨.
