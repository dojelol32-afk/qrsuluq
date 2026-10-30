const supabase = require('./supabaseClient');
const { loadOwnedSession } = require('./sessionController');
const { csvEscape } = require('./utils');

exports.exportSessionReportCSV = async (req, res) => {
    try {
        const session = await loadOwnedSession(req, res, req.params.session_id);
        if (!session) return;

        const { data: records, error } = await supabase
            .from('attendance_records')
            .select(`
                status,
                marked_at,
                users:student_id (student_number, full_name, email, department, year_level)
            `)
            .eq('session_id', session.session_id)
            .order('marked_at', { ascending: true });

        if (error) throw error;

        const header = ['Student Number', 'Student Name', 'Email', 'Department', 'Year Level', 'Status', 'Marked At'];
        const lines = [header.map(csvEscape).join(',')];

        for (const r of records || []) {
            const u = r.users || {};
            lines.push([
                u.student_number, u.full_name, u.email, u.department, u.year_level, r.status, r.marked_at
            ].map(csvEscape).join(','));
        }

        // BOM so Excel opens Arabic names correctly
        const csv = '\uFEFF' + lines.join('\n') + '\n';

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_${session.session_id}.csv"`);
        return res.status(200).send(csv);
    } catch (error) {
        console.error('exportSessionReportCSV error:', error);
        return res.status(500).json({ error: 'خطأ داخلي في الخادم.' });
    }
};
