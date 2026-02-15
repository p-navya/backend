import { supabase } from '../config/supabase.js';

// @desc    Log a new user activity
// @route   POST /api/activity
// @access  Private
export const logActivity = async (req, res) => {
    const { type, description, duration, metadata } = req.body;

    try {
        const { data, error } = await supabase
            .from('user_activity')
            .insert([
                {
                    user_id: req.user.id,
                    activity_type: type,
                    description,
                    duration_minutes: duration || 0,
                    metadata: metadata || {}
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Log Activity Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get activity stats for the last 7 days
// @route   GET /api/activity/stats
// @access  Private
export const getActivityStats = async (req, res) => {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Fetch logs
        const { data: logs, error } = await supabase
            .from('user_activity')
            .select('created_at, duration_minutes, activity_type')
            .eq('user_id', req.user.id)
            .gte('created_at', sevenDaysAgo.toISOString());

        if (error) throw error;

        // Process data
        const stats = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Create a map for the last 7 days initialized to 0
        const activityMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            activityMap[dateStr] = {
                date: d,
                minutes: 0,
                count: 0
            };
        }

        // Aggregate logs
        logs.forEach(log => {
            const dateStr = new Date(log.created_at).toISOString().split('T')[0];
            if (activityMap[dateStr]) {
                // If it's a duration-based activity, add minutes
                // If it's an event (like 'login'), add a default "activity score" (e.g. 10 mins worth)
                let addedMinutes = log.duration_minutes || 0;
                if (addedMinutes === 0) addedMinutes = 10; // Default for actions

                activityMap[dateStr].minutes += addedMinutes;
                activityMap[dateStr].count += 1;
            }
        });

        // Convert to array format expected by frontend
        // Format: { day: 'S', fullDay: 'Sun', date: '...', hours: 50 } (hours is %)
        Object.values(activityMap).sort((a, b) => a.date - b.date).forEach(item => {
            // Target: 2 hours (120 mins) = 100%
            const percentage = Math.min(100, Math.round((item.minutes / 120) * 100));
            const dayName = days[item.date.getDay()];

            stats.push({
                day: dayName[0],
                fullDay: dayName.substring(0, 3),
                date: item.date.toISOString(),
                hours: percentage // Using 'hours' key for compatibility, but represents %
            });
        });

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Get Activity Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
