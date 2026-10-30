const { authenticator } = require('otplib');
const supabase = require('./supabaseClient');
const { isUuid } = require('./utils');

const TOTP_WINDOW = 1; // accept the previous/next step to tolerate small clock drift

function totpFor(intervalSeconds) {
    return authenticator.clone({ step: intervalSeconds, window: TOTP_WINDOW });
}

// Loads a session and makes sure the caller owns it (or is an Admin).
// Sends the error response itself and returns null on failure.
async function loadOwnedSession(req, res, id) {
    if (!isUuid(id)) {
        res.status(400).json({ error: 'معرّف الجلسة غير صالح.' });
        return null;
    }

    const { data: session, error } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('session_id', id)
        .maybeSingle();

    if (error) throw error;

    if (!session) {
        res.status(404).json({ error: 'الجلسة غير موجودة.' });
        return null;
    }

    if (session.teacher_id !== req.user.sub && req.user.role !== 'Admin') {
        res.status(403).json({ error: 'هذه الجلسة تخص محاضراً آخر.' });
        return null;
    }

    return session;
}

exports.loadOwnedSession = loadOwnedSession;

exports.createSession = async (req, res) => {
    try {
        const body = req.body || {};

        let title = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : '';
        if (!title) title = 'محاضرة';

        const duration = Number.parseInt(body.duration_minutes ?? 60, 10);
        const interval = Number.parseInt(body.interval_seconds ?? 10, 10);

        if (!Number.isInteger(duration) || duration < 1 || duration > 240) {
            return res.status(400).json({ error: 'مدة الجلسة يجب أن تكون بين 1 و 240 دقيقة.' });
        }
        if (!Number.isInteger(interval) || interval < 5 || interval > 60) {
            return res.status(400).json({ error: 'فترة تجديد الرمز يجب أن تكون بين 5 و 60 ثانية.' });
        }

        const secret = authenticator.generateSecret(); // generated on the server, never by the client
        const endTime = new Date(Date.now() + duration * 60 * 1000);

        const { data: session, error } = await supabase
            .from('qr_sessions')
            .insert([{
                teacher_id: req.user.sub,
                title,
                secret_key: secret,
                interval_seconds: interval,
                end_time: endTime.toISOString(),
                is_active: true
            }])
            .select('session_id, title, interval_seconds, start_time, end_time')
            .single();

        if (error) throw error;

        return res.status(201).json(session);
    } catch (err) {
        console.error('createSession error:', err);
        return res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
    }
};

exports.getCurrentToken = async (req, res) => {
    try {
        const session = await loadOwnedSession(req, res, req.params.id);
        if (!session) return;

        if (!session.is_active || new Date(session.end_time) <= new Date()) {
            return res.status(410).json({ error: 'انتهت هذه الجلسة.' });
        }

        const step = session.interval_seconds || 10;
        const token = totpFor(step).generate(session.secret_key);
        const remaining = step - (Math.floor(Date.now() / 1000) % step);

        return res.json({
            token,
            interval_seconds: step,
            remaining_seconds: remaining
        });
    } catch (err) {
        console.error('getCurrentToken error:', err);
        return res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
    }
};

exports.endSession = async (req, res) => {
    try {
        const session = await loadOwnedSession(req, res, req.params.id);
        if (!session) return;

        const { error } = await supabase
            .from('qr_sessions')
            .update({ is_active: false })
            .eq('session_id', session.session_id);

        if (error) throw error;

        return res.json({ message: 'تم إنهاء الجلسة.' });
    } catch (err) {
        console.error('endSession error:', err);
        return res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
    }
};

exports.totpFor = totpFor;
