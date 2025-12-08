import { useAuth } from '../context/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Send, LogOut, Contact, MessageSquare } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/contacts', icon: Contact, label: 'Active Users' },
        { path: '/sender', icon: Send, label: 'Image Sender' },
        { path: '/history', icon: MessageSquare, label: 'Chat History' },
    ];

    if (user?.role === 'admin') {
        navItems.push({ path: '/users', icon: Users, label: 'User Management' });
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Sidebar */}
            <aside style={{ width: '260px', background: 'var(--bg-card)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                        WA Gateway <span style={{ color: 'var(--accent)' }}>Admin</span>
                    </h2>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Welcome, {user?.username}
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        textDecoration: 'none',
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                        background: isActive ? 'var(--accent)' : 'transparent',
                                        transition: 'all 0.2s',
                                    })}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#fca5a5',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
