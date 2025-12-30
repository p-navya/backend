import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import { sendMentorCredentialsEmail } from '../services/emailService.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res) => {
  try {
    // Get count of students
    const { count: studentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Get count of mentors
    const { count: mentorCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'mentor');

    // Get count of admins
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    res.status(200).json({
      success: true,
      data: {
        students: studentCount || 0,
        mentors: mentorCount || 0,
        admins: adminCount || 0,
        total: (studentCount || 0) + (mentorCount || 0) + (adminCount || 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new mentor
// @route   POST /api/admin/mentors
// @access  Private/Admin
export const createMentor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a temporary password for email (use the provided password)
    const tempPassword = password;

    // Create mentor in Supabase
    const { data: mentor, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: 'mentor',
          first_login: true
        }
      ])
      .select('id, name, email, role, first_login, created_at')
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Send email with credentials
    console.log(`📧 Sending credentials email to mentor: ${email}`);
    const emailSent = await sendMentorCredentialsEmail({
      mentorName: name,
      email: email,
      password: tempPassword
    });

    if (emailSent) {
      console.log(`✅ Credentials email sent successfully to ${email}`);
    } else {
      console.warn(`⚠️  Failed to send email to ${email}, but mentor was created`);
      console.warn('   Mentor can still login with the provided credentials');
    }

    res.status(201).json({
      success: true,
      message: 'Mentor created successfully' + (emailSent ? ' and credentials email sent' : ' (email failed - check server logs)'),
      data: {
        mentor,
        emailSent
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all mentors
// @route   GET /api/admin/mentors
// @access  Private/Admin
export const getMentors = async (req, res) => {
  try {
    const { data: mentors, error } = await supabase
      .from('users')
      .select('id, name, email, role, first_login, created_at')
      .eq('role', 'mentor')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      count: mentors.length,
      data: { mentors }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

