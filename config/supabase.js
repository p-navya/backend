import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Robustly load .env file from the backend root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Assuming config/supabase.js is in Backend/config, so .env is in ../.env (Backend/.env)
const envPath = path.resolve(__dirname, '../.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;
// Allow override URL if provided, otherwise construct from project ID
export const supabaseUrl = process.env.SUPABASE_URL || (supabaseProjectId ? `https://${supabaseProjectId}.supabase.co` : undefined);
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error('CRITICAL ERROR: Missing Supabase environment variables in .env file');
  console.log('Env Path:', envPath);
  console.log('Project ID:', supabaseProjectId || 'MISSING');
  console.log('URL:', supabaseUrl || 'MISSING');
  console.log('Anon Key:', supabaseAnonKey ? 'PRESENT' : 'MISSING');
  console.log('Service Key:', serviceRoleKey ? 'PRESENT' : 'MISSING');
} else {
  // Mask keys for logging
  console.log('Supabase Config Loaded:', {
    url: supabaseUrl,
    anonKey: 'PRESENT',
    serviceKey: 'PRESENT'
  });
}

// Create clients with persistence options if needed (default is memory for node)
// Create clients with persistence options if needed (default is memory for node)
// If keys are missing, export a dummy object that logs errors when called (fail fast but don't crash import)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : { from: () => ({ select: () => ({ error: { message: 'Supabase not configured' } }) }) };

// Admin client bypasses RLS
export const supabaseAdmin = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : {
    from: () => ({
      select: () => ({ error: { message: 'Supabase Admin not configured' } }),
      insert: () => ({ select: () => ({ single: () => ({ error: { message: 'Supabase Admin not configured' } }) }) }),
      update: () => ({ eq: () => ({ error: { message: 'Supabase Admin not configured' } }) }),
      delete: () => ({ eq: () => ({ error: { message: 'Supabase Admin not configured' } }) })
    })
  };
