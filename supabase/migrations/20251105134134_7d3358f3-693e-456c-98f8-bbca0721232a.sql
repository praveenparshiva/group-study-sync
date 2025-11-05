-- Database cleanup: Remove unused tables
-- These tables are not being used in the application

-- Drop pomodoro_sessions table (Pomodoro Timer feature removed)
DROP TABLE IF EXISTS public.pomodoro_sessions CASCADE;

-- Drop kv_store_7adb2e52 table (not used in codebase)
DROP TABLE IF EXISTS public.kv_store_7adb2e52 CASCADE;

-- Drop whiteboard_data table (not used in codebase)
DROP TABLE IF EXISTS public.whiteboard_data CASCADE;