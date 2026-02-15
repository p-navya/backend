import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const project = process.env.SUPABASE_PROJECT_ID;

console.log(`Project ID: ${project}`);

if (anon) {
    try {
        const anonDecoded = jwt.decode(anon);
        console.log('\n--- Anon Key ---');
        console.log('Ref:', anonDecoded?.ref);
        console.log('Role:', anonDecoded?.role);

        if (anonDecoded?.ref && anonDecoded.ref !== project) {
            console.log('WARNING: Anon Key ref does not match Project ID!');
        }
    } catch (e) {
        console.log('Failed to decode Anon Key:', e.message);
    }
} else {
    console.log("Anon Key Missing");
}

if (service) {
    try {
        const serviceDecoded = jwt.decode(service);
        console.log('\n--- Service Role Key ---');
        console.log('Ref:', serviceDecoded?.ref);
        console.log('Role:', serviceDecoded?.role);

        if (serviceDecoded?.ref && serviceDecoded.ref !== project) {
            console.log('CRITICAL: Service Key ref does not match Project ID!');
            console.log('Expected:', project);
            console.log('Actual:', serviceDecoded.ref);
        }
    } catch (e) {
        console.log('Failed to decode Service Key:', e.message);
    }
} else {
    console.log("Service Key Missing");
}
