const supabase = require('./supabaseClient');

exports.exportSessionReportCSV = async (req, res) => {
    const { session_id } = req.params;

    try {
        const { data: records, error } = await supabase
            .from('attendance_records')
            .select(`
                attendance_id,
                status,
                device_ip,
                marked_at,
                users (full_name, email, year_level, department)
            `)
            .eq('session_id', session_id);

        if (error) throw error;

        let csv = 'Attendance ID,Student Name,Email,Department,Year Level,Status,Device IP,Marked At\n';
        records.forEach(r => {
            const u = r.users || {};
            csv += `"${r.attendance_id}","${u.full_name || ''}","${u.email || ''}","${u.department || ''}","${u.year_level || ''}","${r.status}","${r.device_ip}","${r.marked_at}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${session_id}.csv`);
        return res.status(200).send(csv);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
