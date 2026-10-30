const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');
const config = require('./config');

// Used so that unknown accounts take the same time as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

exports.login = async (req, res) => {
    const { identifier, password } = req.body || {};

    if (typeof identifier !== 'string' || typeof password !== 'string' ||
        !identifier.trim() || !password || identifier.length > 100 || password.length > 200) {
        return res.status(400).json({ error: 'أدخل رقم الطالب (أو البريد) وكلمة المرور.' });
    }

    try {
        const id = identifier.trim();
        const column = id.includes('@') ? 'email' : 'student_number';
        const value = column === 'email' ? id.toLowerCase() : id;

        const { data: user, error } = await supabase
            .from('users')
            .select('user_id, full_name, role, password_hash')
            .eq(column, value)
            .maybeSingle();

        if (error) throw error;

        const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
        if (!user || !ok) {
            return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
        }

        const token = jwt.sign(
            { sub: user.user_id, role: user.role, name: user.full_name },
            config.jwtSecret,
            { algorithm: 'HS256', expiresIn: '8h' }
        );

        return res.json({ token, user: { full_name: user.full_name, role: user.role } });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
    }
};
