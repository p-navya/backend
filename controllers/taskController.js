import { supabase } from '../config/supabase.js';

// @desc    Get my tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
    const { text } = req.body;

    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    text,
                    completed: false,
                    user_id: req.user.id
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update task (toggle completed)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;

    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ completed, updated_at: new Date() })
            .eq('id', id)
            .eq('user_id', req.user.id) // Ensure user owns the task
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id); // Ensure user owns the task

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
