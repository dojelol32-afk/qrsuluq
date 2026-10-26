const supabase = require('./supabaseClient');
const { authenticator } = require('otplib');

exports.markAttendance = async (req, res) => {
    const { session_id, student_id, token } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // 1. Fetch QR Session
        const { data: session, error: sessionErr } = await supabase
            .from('qr_sessions')
            .select('*')
            .eq('session_id', session_id)
            .single();

        if (sessionErr || !session || !session.is_active) {
            return res.status(400).json({ error: 'Invalid or expired attendance session.' });
        }

        // 2. Validate TOTP dynamic token
        authenticator.options = { step: session.interval_seconds || 10, window: 1 };
        const isValidToken = authenticator.check(token, session.secret_key);

        if (!isValidToken) {
            return res.status(400).json({ error: 'Expired or invalid QR token. Please scan again.' });
        }

        // 3. IP validation check for proxy prevention
        const { data: ipCheck } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('session_id', session_id)
            .eq('device_ip', clientIp);

        if (ipCheck && ipCheck.length > 0) {
            return res.status(403).json({ error: 'Proxy attendance detected. Device IP already registered for another student in this session.' });
        }

        // 4. Determine status based on time delay
        const now = new Date();
        const startTime = new Date(session.start_time);
        const diffMinutes = (now - startTime) / (1000 * 60);

        let status = 'On_Time';
        if (diffMinutes > 15) status = 'Very_Late';
        else if (diffMinutes > 5) status = 'Late';

        // 5. Insert record
        const { data: record, error: insertErr } = await supabase
            .from('attendance_records')
            .insert([{
                session_id,
                student_id,
                status,
                device_ip: clientIp,
                marked_at: now.toISOString()
            }])
            .select()
            .single();

        if (insertErr) {
            if (insertErr.code === '23505') {
                return res.status(400).json({ error: 'Attendance already recorded for this session.' });
            }
            throw insertErr;
        }

        return res.json({ success: true, message: `Attendance recorded as ${status}`, record });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
