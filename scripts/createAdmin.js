import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID || 'xyliqfimopegckxayzgi';
const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGlxZmltb3BlZ2NreGF5emdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjAyMzgsImV4cCI6MjA4MjYzNjIzOH0.nv664ZyW3LInBevNoiR6l6GeBD6cmM26D2BeReq-AjE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const createAdmin = async () => {
  try {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Admin@12';
    const adminName = 'Admin';

    console.log('🔍 Checking if admin already exists...');

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('email, name, role')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin && !checkError) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      return;
    }

    console.log('🔐 Hashing password...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    console.log('➕ Creating admin user...');
    // Create admin user
    const { data: admin, error } = await supabase
      .from('users')
      .insert([
        {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          first_login: false
        }
      ])
      .select('id, name, email, role, first_login')
      .single();

    if (error) {
      console.error('❌ Error creating admin:', error.message);
      console.error('Error details:', error);
      return;
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', admin.email);
    console.log('👤 Name:     ', admin.name);
    console.log('🔑 Role:     ', admin.role);
    console.log('🔐 Password: ', adminPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please save these credentials securely!');
    console.log('🚀 You can now login at: http://localhost:5173/login');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
};

createAdmin();

