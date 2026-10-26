const express = require('express');
const cors = require('cors');
require('dotenv').config();

const attendanceController = require('./attendanceController');
const reportController = require('./reportController');
const authMiddleware = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Smart QR Attendance API is running.' });
});

app.post('/api/attendance/mark', authMiddleware, attendanceController.markAttendance);
app.get('/api/reports/session/:session_id/csv', authMiddleware, reportController.exportSessionReportCSV);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
