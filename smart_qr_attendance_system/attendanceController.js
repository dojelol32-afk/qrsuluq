const supabase = require('./supabaseClient');
const { totpFor } = require('./sessionController');
const { isUuid } = require('./utils');

exports.markAttendance = async (req, res) => {
    const { session_id, token } = req.body || {};
    const studentId = req.user.sub; // taken from the verified JWT, never from the request body
    const clientIp = req.ip;        // informational only (see README: NAT makes IP unsuitable for blocking)

    if (!isUuid(session_id) || typeof token !== 'string' || !/^\d{6}$/.test(token)) {
        return res.status(400).json({ error: 'رمز QR غير صالح.' });
    }

    try {
        // 1. Fetch and validate the session
        const { data: session, error: sessionErr } = await supabase
            .from('qr_sessions')
            .select('session_id, secret_key, interval_seconds, start_time, end_time, is_active')
            .eq('session_id', session_id)
            .maybeSingle();

        if (sessionErr) throw sessionErr;

        const now = new Date();
        if (!session || !session.is_active || new Date(session.end_time) <= now) {
            return res.status(400).json({ error: 'جلسة الحضور غير صالحة أو انتهت.' });
        }

        // 2. Validate the rotating TOTP token embedded in the QR code
        const step = session.interval_seconds || 10;
        if (!totpFor(step).check(token, session.secret_key)) {
            return res.status(400).json({ error: 'انتهت صلاحية الرمز. امسح الرمز الجديد من شاشة المحاضر.' });
        }

        // 3. Determine attendance status from the delay since the session started
        const diffMinutes = (now - new Date(session.start_time)) / (1000 * 60);
        let status = 'On_Time';
        if (diffMinutes > 15) status = 'Very_Late';
        else if (diffMinutes > 5) status = 'Late';

        // 4. Insert the record (unique(session_id, student_id) blocks duplicates)
        const { error: insertErr } = await supabase
            .from('attendance_records')
            .insert([{
                session_id,
                student_id: studentId,
                status,
                device_ip: clientIp,
                marked_at: now.toISOString()
            }]);

        if (insertErr) {
            if (insertErr.code === '23505') {
                return res.status(409).json({ error: 'تم تسجيل حضورك في هذه الجلسة مسبقاً.' });
            }
            throw insertErr;
        }

        const labels = { On_Time: 'في الوقت', Late: 'متأخر', Very_Late: 'متأخر جداً' };
        return res.json({ success: true, status, message: `تم تسجيل حضورك (${labels[status]})` });
    } catch (error) {
        console.error('markAttendance error:', error);
        return res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
    }
};
