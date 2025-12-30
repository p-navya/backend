import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseProjectId = process.env.SUPABASE_PROJECT_ID || 'xyliqfimopegckxayzgi';
const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGlxZmltb3BlZ2NreGF5emdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjAyMzgsImV4cCI6MjA4MjYzNjIzOH0.nv664ZyW3LInBevNoiR6l6GeBD6cmM26D2BeReq-AjE';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (use with caution)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGlxZmltb3BlZ2NreGF5emdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA2MDIzOCwiZXhwIjoyMDgyNjM2MjM4fQ.DaRMHM4yKjZUUjVyKoPd9unkQ5IyVc6HoDhLCK9C7AQ';
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

