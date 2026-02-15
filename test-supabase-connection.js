import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

console.log('Loading .env from:', envPath);
if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found at', envPath);
    process.exit(1);
}

dotenv.config({ path: envPath });

const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;
const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Project ID:', supabaseProjectId || 'MISSING');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? (supabaseAnonKey.substring(0, 10) + '...') : 'MISSING');
console.log('Service Key:', supabaseServiceKey ? (supabaseServiceKey.substring(0, 10) + '...') : 'MISSING');

if (!supabaseProjectId || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('ERROR: Missing env variables');
    // Don't exit, just try what we have
}

try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('\nTesting Anon Client (Public Read)...');
    const { data: anonData, error: anonError } = await supabase.from('resources').select('count', { count: 'exact', head: true });

    if (anonError) {
        console.error('Anon Client Error:', anonError.message);
    } else {
        console.log('Anon Client Success (Count):', anonData === null ? 'OK (Head request)' : anonData);
    }

    if (supabaseServiceKey) {
        console.log('\nTesting Admin Client (Service Role)...');
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: adminData, error: adminError } = await supabaseAdmin.from('resources').select('count', { count: 'exact', head: true });

        if (adminError) {
            console.error('Admin Client Error:', adminError.message);
        } else {
            console.log('Admin Client Success');
        }
    }
} catch (err) {
    console.error('Unexpected error:', err);
}
