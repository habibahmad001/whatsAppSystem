import { useState } from 'react';
import api from '../api';
import { Send, Image as ImageIcon, Loader } from 'lucide-react';

const Sender = () => {
    const [session, setSession] = useState('mysession');
    const [to, setTo] = useState('');
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result); // Base64 string
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!image) {
            setStatus({ type: 'error', message: 'Please select an image' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post('/message/send-image', {
                session,
                to,
                text,
                image_url: image, // Sending base64 as image_url
                is_group: false
            });
            setStatus({ type: 'success', message: 'Image sent successfully!' });
            setText('');
            setImage(null);
            setPreview('');
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send image' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>Image Sender</h1>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                {status.message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: status.type === 'error' ? '#fca5a5' : '#4ade80',
                        textAlign: 'center'
                    }}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSend}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Session Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={session}
                            onChange={(e) => setSession(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number (e.g., 628123456789)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="62..."
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Caption (Optional)</label>
                        <textarea
                            className="input-field"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows="3"
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Image</label>
                        <div style={{
                            border: '2px dashed var(--glass-border)',
                            borderRadius: '0.5rem',
                            padding: '2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'rgba(15, 23, 42, 0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />

                            {preview ? (
                                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem' }} />
                            ) : (
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <ImageIcon size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p>Click or drag image here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                        {loading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Sender;
