# StudyBuddy AI - Final Deployment Guide (Clean Install)

We will remove the old backend (`app-backend`) and replace it with **StudyBuddy AI** on standard **Port 5000**.

## 1. Clean Up Old Container
Run these commands on the server to remove the conflicting app:

```bash
docker stop backend || true
docker rm backend || true
# If the image was named 'app-backend':
docker rmi app-backend || true
```

*Note: This frees up Port 5000.*

## 2. Prepare Code Directory
```bash
mkdir -p ~/studybuddy-ai
cd ~/studybuddy-ai
```
*(Now upload your code here, e.g., git clone or drag-drop)*

## 3. Build & Run StudyBuddy (Port 5000)

Run inside `~/studybuddy-ai/Backend`:

```bash
# 1. Build
docker build -t studybuddy-backend .

# 2. Run
docker run -d \
  --name studybuddy-ai \
  --network="host" \
  --restart unless-stopped \
  -e PORT=5000 \
  -e OLLAMA_API_URL="http://localhost:11434" \
  -e OLLAMA_MODEL="mistral" \
  -e GROQ_API_KEY="[YOUR_GROQ_API_KEY_HERE]" \
  -e SUPABASE_URL="https://xyliqfimopegckxayzgi.supabase.co" \
  -e SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGlxZmltb3BlZ2NreGF5emdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjAyMzgsImV4cCI6MjA4MjYzNjIzOH0.nv664ZyW3LInBevNoiR6l6GeBD6cmM26D2BeReq-AjE" \
  -e SUPABASE_JWT_SECRET="8ArvzeA/s+6DEjp4YoXxLNAPJPBnLV0PdbIebOVCyJXIVGYu0vahJoqWThyfCZJJ3kZK0h4SBK7G6YQh9RpLWA==" \
  -e JWT_SECRET="8ArvzeA/s+6DEjp4YoXxLNAPJPBnLV0PdbIebOVCyJXIVGYu0vahJoqWThyfCZJJ3kZK0h4SBK7G6YQh9RpLWA==" \
  -e FRONTEND_URL="http://103.233.73.55:5173" \
  studybuddy-backend
```

## 4. Frontend Config
Back to Port 5000.
`VITE_API_URL=http://103.233.73.55:5000/api`
