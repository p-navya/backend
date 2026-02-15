import { supabase, supabaseAdmin } from '../config/supabase.js';

// @desc    Get all public groups
// @route   GET /api/groups
// @access  Public
export const getGroups = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('study_groups')
            .select('*')
            .eq('type', 'public')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my joined groups
// @route   GET /api/groups/my
// @access  Private
export const getMyGroups = async (req, res) => {
    try {
        // First get the group IDs the user is a member of
        const { data: members, error: memberError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', req.user.id);

        if (memberError) throw memberError;

        const groupIds = members.map(m => m.group_id);

        if (groupIds.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Then fetch the actual groups
        const { data, error } = await supabase
            .from('study_groups')
            .select('*')
            .in('id', groupIds);

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
    const { name, subject, description, type } = req.body;

    try {
        // 1. Create the group using standard client (authenticated user has permission via RLS)
        const { data: group, error } = await supabase
            .from('study_groups')
            .insert([
                {
                    name,
                    subject,
                    description,
                    type: type || 'public',
                    created_by: req.user.id,
                    code: Math.random().toString(36).substring(2, 8).toUpperCase()
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // 2. Automatically join the creator as a member. 
        // We try to use the admin client first to set the 'admin' role, 
        // but fall back to standard client if admin key fails (defaults to 'member' role via RLS, better than failing)
        try {
            const { error: joinError } = await supabaseAdmin
                .from('group_members')
                .insert([
                    {
                        group_id: group.id,
                        user_id: req.user.id,
                        role: 'admin'
                    }
                ]);
            if (joinError) throw joinError;
        } catch (adminError) {
            console.warn('Admin join failed, trying standard join:', adminError.message);
            // Fallback: Join as member using standard client (RLS allows this)
            // The user is the creator, so they should be able to join.
            const { error: fallbackError } = await supabase
                .from('group_members')
                .insert([
                    {
                        group_id: group.id,
                        user_id: req.user.id,
                        // role: 'admin' - RLS might block setting role, let it default to 'member' or 'admin' based on DB default
                    }
                ]);
            if (fallbackError) console.error('Fallback join failed:', fallbackError);
        }

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        console.error('Create Group Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Join a group
// @route   POST /api/groups/:id/join
// @access  Private
export const joinGroup = async (req, res) => {
    try {
        const { error } = await supabase
            .from('group_members')
            .insert([
                {
                    group_id: req.params.id,
                    user_id: req.user.id,
                    role: 'member'
                }
            ]);

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ success: false, message: 'Already a member' });
            }
            throw error;
        }

        res.status(200).json({ success: true, message: 'Joined group successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get messages for a group
// @route   GET /api/groups/:id/messages
// @access  Private (Members only)
export const getGroupMessages = async (req, res) => {
    try {
        // Check membership first
        const { data: member, error: memberError } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (memberError || !member) {
            return res.status(403).json({ success: false, message: 'Not a member of this group' });
        }

        const { data, error } = await supabase
            .from('group_messages')
            .select('*')
            .eq('group_id', req.params.id)
            .order('created_at', { ascending: true }); // Oldest first for chat log

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/groups/:id/messages
// @access  Private (Members only)
export const sendGroupMessage = async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ success: false, message: 'Message content required' });
    }

    try {
        // Check membership first
        const { data: member, error: memberError } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (memberError || !member) {
            return res.status(403).json({ success: false, message: 'Not a member of this group' });
        }

        const { data, error } = await supabase
            .from('group_messages')
            .insert([
                {
                    group_id: req.params.id,
                    user_id: req.user.id,
                    user_name: req.user.name,
                    content
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private (Creator or Admin only)
export const deleteGroup = async (req, res) => {
    try {
        const { data: group, error: fetchError } = await supabase
            .from('study_groups')
            .select('created_by')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if user is creator or system admin
        if (group.created_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this group' });
        }

        const { error } = await supabase
            .from('study_groups')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Group deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
