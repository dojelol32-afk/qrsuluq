const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// إعدادات الـ CORS والـ JSON
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*'
}));
app.use(express.json());

// تهيئة اتصال Supabase باستخدام متغيرات البيئة على Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// نقطة التحقق من عمل الخادم
app.get('/', (req, res) => {
  res.json({ message: "Smart QR Attendance API is running." });
});

// ==========================================
// 1. مسار رفع سجل الطلاب دفعة واحدة (Bulk Import)
// ==========================================
app.post('/api/users/bulk-import', async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'الرجاء إرسال مصفوفة بيانات الطلاب بشكل صحيح' });
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(students, { onConflict: 'email' });

    if (error) throw error;

    res.status(200).json({ 
      message: 'تم رفع سجل الطلاب بنجاح', 
      count: students.length,
      data 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. مسار تسجيل الحضور الفعلي عبر مسح الرمز (QR Scan)
// ==========================================
app.post('/api/attendance/scan', async (req, res) => {
  try {
    const { student_id, session_id } = req.body;
    
    const { data: session, error: sessionError } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'جلسة المحاضرة غير صالحة أو انتهت' });
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .insert([{ student_id, session_id, status: 'Present', timestamp: new Date() }]);

    if (error) throw error;

    res.status(200).json({ message: 'تم تسجيل الحضور بنجاح', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. مسار تصدير تقرير الحضور والغياب بصيغة CSV (Excel)
// ==========================================
app.get('/api/reports/session/:session_id/csv', async (req, res) => {
  try {
    const { session_id } = req.params;

    const { data: records, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        users (name, email, department, academic_year)
      `)
      .eq('session_id', session_id);

    if (error) throw error;

    let csvHeader = 'Student Name,Email,Department,Year,Status,Time\n';
    let csvRows = records.map(r => 
      `"${r.users?.name || 'N/A'}","${r.users?.email || 'N/A'}","${r.users?.department || 'N/A'}","${r.users?.academic_year || 'N/A'}","${r.status}","${r.timestamp}"`
    ).join('\n');

    const csvOutput = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${session_id}.csv`);
    res.status(200).send(csvOutput);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
