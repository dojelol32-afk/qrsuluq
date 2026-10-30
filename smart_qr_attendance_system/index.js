const config = require('./config'); // loads .env and validates required variables first
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { authenticate, requireRole } = require('./authMiddleware');
const { login } = require('./authController');
const { createSession, getCurrentToken, endSession } = require('./sessionController');
const { markAttendance } = require('./attendanceController');
const { exportSessionReportCSV } = require('./reportController');

const app = express();

// Render sits behind a proxy; this makes req.ip the real client address
app.set('trust proxy', 1);

// CORS: explicit origins only in production
if (config.allowedOrigins.length > 0) {
    app.use(cors({ origin: config.allowedOrigins, allowedHeaders: ['Content-Type', 'Authorization'] }));
} else if (!config.isProduction) {
    app.use(cors());
} else {
    console.warn('ALLOWED_ORIGIN is not set: cross-origin requests will be blocked.');
}

app.use(express.json({ limit: '10kb' }));

// Coarse per-IP limit (generous: a whole campus may share one IP)
app.use(rateLimit({ windowMs: 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false }));

// Brute-force protection per account identifier
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String((req.body && req.body.identifier) || 'unknown').toLowerCase().slice(0, 100),
    validate: { keyGeneratorIpFallback: false },
    message: { error: 'محاولات كثيرة. حاول بعد 15 دقيقة.' }
});

// Per-student limit on scans
const scanLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user.sub,
    validate: { keyGeneratorIpFallback: false },
    message: { error: 'محاولات كثيرة. انتظر دقيقة.' }
});

app.get('/', (req, res) => res.json({ message: 'Smart QR Attendance API is running.' }));

// Auth
app.post('/api/auth/login', loginLimiter, login);

// Teacher / Admin
const teacherOnly = [authenticate, requireRole('Teacher', 'Admin')];
app.post('/api/sessions', ...teacherOnly, createSession);
app.get('/api/sessions/:id/token', ...teacherOnly, getCurrentToken);
app.post('/api/sessions/:id/end', ...teacherOnly, endSession);
app.get('/api/reports/session/:session_id/csv', ...teacherOnly, exportSessionReportCSV);

// Student
app.post('/api/attendance/scan', authenticate, requireRole('Student'), scanLimiter, markAttendance);

app.use((req, res) => res.status(404).json({ error: 'المسار غير موجود.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
});

app.listen(config.port, () => console.log(`Server is running on port ${config.port}`));
