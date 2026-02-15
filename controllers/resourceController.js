import { supabase, supabaseAdmin } from '../config/supabase.js';

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private (Visible to everyone authenticated)
export const getResources = async (req, res) => {
    try {
        // Use the standard client (Anon key is working) for reading public data
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload a resource
// @route   POST /api/resources
// @access  Private (Students and Mentors)
export const uploadResource = async (req, res) => {
    const { name, folder, subject, type, size, file_data } = req.body;

    if (!file_data) {
        return res.status(400).json({
            success: false,
            message: 'No file data provided'
        });
    }

    try {
        const { data, error } = await supabase
            .from('resources')
            .insert([
                {
                    name,
                    folder: folder || 'General',
                    subject: subject || 'N/A',
                    type: type || 'FILE',
                    size: size || '0 MB',
                    file_data,
                    uploader_id: req.user.id,
                    uploader_name: req.user.name,
                    uploader_role: req.user.role,
                    date: new Date().toISOString().split('T')[0]
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private (Owner or Admin)
export const deleteResource = async (req, res) => {
    try {
        // Check if the user is the owner or an admin
        const { data: resource, error: fetchError } = await supabase
            .from('resources')
            .select('uploader_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (resource.uploader_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this resource'
            });
        }

        const { error } = await supabase
            .from('resources')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Resource removed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
