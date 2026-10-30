// Usage:
//   node create-user.js --role Teacher --name "د. أحمد" --email ahmed@uni.edu --password "StrongPass123"
//   node create-user.js --role Student --name "علي محمد" --email ali@uni.edu --number 4423 --password "StrongPass123" --department CS --year "Year 2"
const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1];
    }
    return out;
}

(async () => {
    const a = parseArgs(process.argv.slice(2));
    const roles = ['Admin', 'Teacher', 'Student'];

    if (!roles.includes(a.role) || !a.name || !a.email || !a.password) {
        console.error('Required: --role (Admin|Teacher|Student) --name --email --password [--number --department --year]');
        process.exit(1);
    }
    if (a.role === 'Student' && !a.number) {
        console.error('Students require --number (student number).');
        process.exit(1);
    }
    if (a.password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
    }

    const password_hash = await bcrypt.hash(a.password, 10);

    const { data, error } = await supabase
        .from('users')
        .insert([{
            role: a.role,
            full_name: a.name,
            email: a.email.toLowerCase(),
            student_number: a.number || null,
            department: a.department || null,
            year_level: a.year || null,
            password_hash
        }])
        .select('user_id, full_name, role')
        .single();

    if (error) {
        console.error('Failed:', error.message);
        process.exit(1);
    }

    console.log('Created:', data);
})();
