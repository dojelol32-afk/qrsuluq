require('dotenv').config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);

if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error(
        'JWT_SECRET is too short (min 32 chars). Generate one with:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
    process.exit(1);
}

module.exports = {
    port: process.env.PORT || 3000,
    isProduction: process.env.NODE_ENV === 'production',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.JWT_SECRET,
    allowedOrigins: (process.env.ALLOWED_ORIGIN || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
};
