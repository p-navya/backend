import { supabase } from '../config/supabase.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    try {
        console.log('Running RLS fix migration...');

        const sqlPath = join(__dirname, '../sql/fix_quiz_rls.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor:');
            console.log(sql);
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('RLS has been disabled for quizzes and quiz_attempts tables.');
        console.log('Security is now handled at the application level through middleware.');

    } catch (error) {
        console.error('Error running migration:', error.message);
        console.log('\n📝 Manual steps required:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the following SQL:\n');
        console.log('ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;');
        process.exit(1);
    }
}

runMigration();
