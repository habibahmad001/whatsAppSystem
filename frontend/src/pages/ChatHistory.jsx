import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { MessageSquare, User, Search, ArrowLeft } from 'lucide-react';

const ChatHistory = () => {
    const { session } = useParams();
    const navigate = useNavigate();
    const [threads, setThreads] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const currentSession = session || 'mysession';

    useEffect(() => {
        fetchThreads();
    }, [currentSession]);

    const fetchThreads = async () => {
        setLoadingThreads(true);
        try {
            const response = await api.get(`/history/${currentSession}/threads`);
            setThreads(response.data.data);
        } catch (err) {
            console.error('Failed to fetch threads:', err);
        } finally {
            setLoadingThreads(false);
        }
    };

    const handleSelectThread = async (thread) => {
        setSelectedThread(thread);
        setLoadingMessages(true);
        try {
            const response = await api.get(`/history/${currentSession}/${thread.remote_jid}?limit=100`);
            setMessages(response.data.data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const filteredThreads = threads.filter(t =>
        t.remote_jid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.content && t.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', gap: '1rem' }}>
            {/* Sidebar - Thread List */}
            <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={20} /> Chat History
                    </h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loadingThreads ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading chats...</div>
                    ) : filteredThreads.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No chats found</div>
                    ) : (
                        filteredThreads.map((thread) => (
                            <div
                                key={thread.remote_jid}
                                onClick={() => handleSelectThread(thread)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    background: selectedThread?.remote_jid === thread.remote_jid ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    if (selectedThread?.remote_jid !== thread.remote_jid) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (selectedThread?.remote_jid !== thread.remote_jid) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.remote_jid.replace('@s.whatsapp.net', '')}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {new Date(thread.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {thread.from_me && <span style={{ color: 'var(--accent)' }}>You: </span>}
                                    {thread.type === 'image' ? '📷 Image' :
                                        thread.type === 'video' ? '🎥 Video' :
                                            thread.type === 'sticker' ? '💟 Sticker' :
                                                thread.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Message View */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                {selectedThread ? (
                    <>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{selectedThread.remote_jid.replace('@s.whatsapp.net', '')}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Session: {currentSession}
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column-reverse', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                            {loadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading messages...</div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} style={{
                                        alignSelf: msg.from_me ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        background: msg.from_me ? 'var(--accent)' : 'var(--bg-card)',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        borderBottomRightRadius: msg.from_me ? '0' : '0.5rem',
                                        borderBottomLeftRadius: msg.from_me ? '0.5rem' : '0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {msg.media_url && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                {msg.type === 'image' ? (
                                                    <img
                                                        src={msg.media_url.startsWith('http') ? msg.media_url : `http://localhost:5001${msg.media_url}`}
                                                        alt="Media"
                                                        style={{ maxWidth: '100%', borderRadius: '0.25rem', cursor: 'pointer' }}
                                                        onClick={() => window.open(msg.media_url.startsWith('http') ? msg.media_url : `http://localhost:5001${msg.media_url}`, '_blank')}
                                                    />
                                                ) : msg.type === 'video' ? (
                                                    <video
                                                        src={msg.media_url.startsWith('http') ? msg.media_url : `http://localhost:5001${msg.media_url}`}
                                                        controls
                                                        style={{ maxWidth: '100%', borderRadius: '0.25rem' }}
                                                    />
                                                ) : (
                                                    <a
                                                        href={msg.media_url.startsWith('http') ? msg.media_url : `http://localhost:5001${msg.media_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'white', textDecoration: 'underline' }}
                                                    >
                                                        View {msg.type}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
                                            {new Date(msg.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Select a chat to view history</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistory;
