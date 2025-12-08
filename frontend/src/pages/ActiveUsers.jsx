import { useState, useEffect } from 'react';
import api from '../api';
import { Trash2, Edit, Send, Plus, Upload, Link as LinkIcon, CheckSquare, Square, X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

const ActiveUsers = () => {
    const [contacts, setContacts] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 100;

    // Image State
    const [image, setImage] = useState(null); // Base64 or URL
    const [imageUrl, setImageUrl] = useState('');
    const [imageType, setImageType] = useState('url'); // 'url' or 'upload'
    const [preview, setPreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });

    // Message State
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    const fetchContacts = async (pageNum = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/contacts?page=${pageNum}&limit=${limit}`);
            setContacts(response.data.data);
            if (response.data.pagination) {
                setPage(response.data.pagination.page);
                setTotalPages(response.data.pagination.totalPages);
                setTotalRecords(response.data.pagination.total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts(page);
    }, [page]);

    // Image Handling
    const handleImageUpload = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlChange = (e) => {
        setImageUrl(e.target.value);
        setImage(e.target.value);
        setPreview(e.target.value);
    };

    // Drag & Drop Handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    };

    // Selection Handling
    const toggleSelectAll = () => {
        if (selectedIds.length === contacts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(contacts.map(c => c.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // CRUD Operations
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await api.put(`/contacts/${editingContact.id}`, formData);
            } else {
                await api.post('/contacts', formData);
            }
            setShowModal(false);
            setEditingContact(null);
            setFormData({ first_name: '', last_name: '', email: '', phone: '' });
            fetchContacts(page);
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this contact?')) return;
        try {
            await api.delete(`/contacts/${id}`);
            fetchContacts(page);
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} contacts?`)) return;
        try {
            await api.post('/contacts/bulk-delete', { ids: selectedIds });
            setSelectedIds([]);
            fetchContacts(page);
        } catch (err) {
            alert('Failed to delete contacts');
        }
    };

    // History
    const handleViewHistory = async (contact) => {
        setSelectedContact(contact);
        setShowHistory(true);
        setHistoryLoading(true);
        try {
            const response = await api.get(`/history/mysession/${contact.phone}`);
            setChatHistory(response.data.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    };

    // Sending Messages
    const handleSend = async (targetIds = selectedIds) => {
        if (!image) {
            alert('Please provide an image first (Upload or URL)');
            return;
        }
        if (targetIds.length === 0) return;

        setSending(true);
        setStatus({ type: 'info', message: `Sending to ${targetIds.length} contacts...` });

        const targets = contacts.filter(c => targetIds.includes(c.id));
        let successCount = 0;
        let failCount = 0;

        for (const contact of targets) {
            try {
                await api.post('/message/send-image', {
                    session: 'mysession', // Default session
                    to: contact.phone,
                    text: messageText,
                    image_url: image,
                    is_group: false
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to send to ${contact.phone}`, err);
                failCount++;
            }
        }

        setSending(false);
        setStatus({
            type: successCount > 0 ? 'success' : 'error',
            message: `Sent: ${successCount}, Failed: ${failCount}`
        });

        if (successCount > 0) {
            setTimeout(() => setStatus({ type: '', message: '' }), 5000);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Active Users</h1>

            {/* Image Section */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>1. Message Content</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button
                                className={`btn-primary ${imageType === 'url' ? '' : 'opacity-50'}`}
                                style={{ background: imageType === 'url' ? 'var(--accent)' : 'transparent', border: '1px solid var(--accent)' }}
                                onClick={() => setImageType('url')}
                            >
                                <LinkIcon size={16} style={{ marginRight: '0.5rem' }} /> Image URL
                            </button>
                            <button
                                className={`btn-primary ${imageType === 'upload' ? '' : 'opacity-50'}`}
                                style={{ background: imageType === 'upload' ? 'var(--accent)' : 'transparent', border: '1px solid var(--accent)' }}
                                onClick={() => setImageType('upload')}
                            >
                                <Upload size={16} style={{ marginRight: '0.5rem' }} /> Upload Image
                            </button>
                        </div>

                        {imageType === 'url' ? (
                            <input
                                type="text"
                                className="input-field"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={handleUrlChange}
                            />
                        ) : (
                            <div
                                className="input-field"
                                style={{
                                    border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--glass-border)',
                                    background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                                <Upload size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Drag & Drop image here or <span style={{ color: 'var(--accent)' }}>Browse</span>
                                </p>
                            </div>
                        )}

                        <textarea
                            className="input-field"
                            placeholder="Caption (Optional)"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            style={{ marginTop: '1rem' }}
                            rows="3"
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', minHeight: '200px' }}>
                        {preview ? (
                            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem' }} />
                        ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>Image Preview</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setEditingContact(null);
                            setFormData({ first_name: '', last_name: '', email: '', phone: '' });
                            setShowModal(true);
                        }}
                    >
                        <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add User
                    </button>

                    {selectedIds.length > 0 && (
                        <>
                            <button
                                className="btn-primary"
                                style={{ background: '#ef4444' }}
                                onClick={handleBulkDelete}
                            >
                                <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Delete ({selectedIds.length})
                            </button>
                            <button
                                className="btn-primary"
                                style={{ background: '#22c55e' }}
                                onClick={() => handleSend()}
                                disabled={sending}
                            >
                                <Send size={18} style={{ marginRight: '0.5rem' }} />
                                {sending ? 'Sending...' : `Send to ${selectedIds.length}`}
                            </button>
                        </>
                    )}
                </div>

                {status.message && (
                    <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        background: status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                            status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: status.type === 'error' ? '#fca5a5' :
                            status.type === 'success' ? '#4ade80' : '#60a5fa'
                    }}>
                        {status.message}
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="glass-panel">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem', width: '40px' }}>
                                <button
                                    onClick={toggleSelectAll}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                                >
                                    {selectedIds.length === contacts.length && contacts.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>First Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Last Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Phone</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Created Date</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => toggleSelect(contact.id)}
                                        style={{ background: 'transparent', border: 'none', color: selectedIds.includes(contact.id) ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}
                                    >
                                        {selectedIds.includes(contact.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem' }}>{contact.first_name}</td>
                                <td style={{ padding: '1rem' }}>{contact.last_name}</td>
                                <td style={{ padding: '1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={contact.email}>{contact.email || '-'}</td>
                                <td style={{ padding: '1rem' }}>{contact.phone}</td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {new Date(contact.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleSend([contact.id])}
                                        title="Send Message"
                                        style={{ background: 'transparent', border: 'none', color: '#4ade80', cursor: 'pointer' }}
                                    >
                                        <Send size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingContact(contact);
                                            setFormData({
                                                first_name: contact.first_name,
                                                last_name: contact.last_name,
                                                email: contact.email || '',
                                                phone: contact.phone
                                            });
                                            setShowModal(true);
                                        }}
                                        title="Edit"
                                        style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleViewHistory(contact)}
                                        title="History"
                                        style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                                    >
                                        <MessageSquare size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contact.id)}
                                        title="Delete"
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {contacts.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    {loading ? 'Loading...' : 'No active users found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Showing {contacts.length} of {totalRecords} records
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="btn-primary"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{ padding: '0.5rem', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ color: 'var(--text-primary)', padding: '0 0.5rem' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="btn-primary"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            style={{ padding: '0.5rem', opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem' }}>{editingContact ? 'Edit User' : 'Add User'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>First Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Last Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="62..."
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                {editingContact ? 'Update' : 'Create'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '600px', height: '80vh', padding: '0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Chat with {selectedContact?.first_name}</h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column-reverse', gap: '1rem' }}>
                            {historyLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading history...</div>
                            ) : chatHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No messages found.</div>
                            ) : (
                                chatHistory.map((msg) => (
                                    <div key={msg.id} style={{
                                        alignSelf: msg.from_me ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        background: msg.from_me ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        borderBottomRightRadius: msg.from_me ? '0' : '0.5rem',
                                        borderBottomLeftRadius: msg.from_me ? '0.5rem' : '0'
                                    }}>
                                        {msg.media_url && (
                                            <img
                                                src={msg.media_url.startsWith('http') ? msg.media_url : `http://localhost:5001${msg.media_url}`}
                                                alt="Media"
                                                style={{ maxWidth: '100%', borderRadius: '0.25rem', marginBottom: '0.5rem' }}
                                            />
                                        )}
                                        <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
                                            {new Date(msg.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ActiveUsers;
