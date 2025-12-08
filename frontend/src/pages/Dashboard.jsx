const Dashboard = () => {
    const endpoints = [
        { method: 'POST', path: '/auth/login', desc: 'Authenticate user' },
        { method: 'GET', path: '/session/start?session={name}', desc: 'Start a WhatsApp session' },
        { method: 'GET', path: '/session/logout?session={name}', desc: 'Logout a session' },
        { method: 'POST', path: '/message/send-image', desc: 'Send an image message' },
        { method: 'GET', path: '/users', desc: 'List all users (Admin only)' },
        { method: 'POST', path: '/users', desc: 'Create a new user (Admin only)' },
        { method: 'DELETE', path: '/users/{id}', desc: 'Delete a user (Admin only)' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard</h1>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Available Endpoints</h2>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {endpoints.map((ep, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                background: ep.method === 'GET' ? 'rgba(59, 130, 246, 0.2)' :
                                    ep.method === 'POST' ? 'rgba(34, 197, 94, 0.2)' :
                                        'rgba(239, 68, 68, 0.2)',
                                color: ep.method === 'GET' ? '#60a5fa' :
                                    ep.method === 'POST' ? '#4ade80' :
                                        '#f87171'
                            }}>
                                {ep.method}
                            </span>
                            <code style={{ flex: 1, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{ep.path}</code>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ep.desc}</span>
                        </div>
                    ))}
                </div>
            </div>


            {/* Database Management */}
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Database Management</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {['contacts', 'messages', 'sessions'].map((table) => (
                        <div key={table} style={{
                            padding: '1.5rem',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <h3 style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{table}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Remove all data from the {table} table. This action cannot be undone.
                            </p>
                            <button
                                className="btn-primary"
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)' }}
                                onClick={async () => {
                                    if (window.confirm(`Are you sure you want to truncate the ${table} table? ALL DATA WILL BE LOST.`)) {
                                        try {
                                            await import('../api').then(module => module.default.post('/admin/truncate', { table }));
                                            alert(`${table} table truncated successfully.`);
                                        } catch (err) {
                                            alert(`Failed to truncate ${table}: ${err.response?.data?.message || err.message}`);
                                        }
                                    }
                                }}
                            >
                                Truncate {table}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
