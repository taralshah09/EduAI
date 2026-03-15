import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './DashboardPage.css';

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', description: 'Google\'s most capable models (Flash, Pro). Generous free tiers available.' },
  { id: 'groq', name: 'Groq', description: 'Ultra-fast LLaMA-3 models. Best for quick responses and summarization.' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Universal gateway to hundreds of models (DeepSeek, Claude, GPT-4).' },
];

const BYOK = () => {
  const { user, updateUser } = useAuth();
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    groq: '',
    openrouter: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Reset keys if user data changes (e.g. key removed)
    // We don't populate the actual keys from the user object for security/placeholder purposes
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { [activeProvider]: apiKeys[activeProvider].trim() };
      const { data } = await axios.put(
        'http://localhost:3000/api/auth/api-keys',
        payload,
        { withCredentials: true }
      );
      setMessage({ type: 'success', text: `${PROVIDERS.find(p => p.id === activeProvider).name} key updated successfully!` });
      setApiKeys(prev => ({ ...prev, [activeProvider]: '' }));
      updateUser(data.apiKeys);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update API key',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const payload = { [activeProvider]: '' };
      const { data } = await axios.put(
        'http://localhost:3000/api/auth/api-keys',
        payload,
        { withCredentials: true }
      );
      setMessage({ type: 'success', text: `${PROVIDERS.find(p => p.id === activeProvider).name} key removed.` });
      updateUser(data.apiKeys);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove API key',
      });
    } finally {
      setLoading(false);
    }
  };

  const isSet = !!user?.[activeProvider]?.apiKey;

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>AI Configurations</h1>
            <p>Bring your own API keys to increase your limits and access premium models.</p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginTop: '2rem' }}>
            {/* Sidebar Provider List */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setActiveProvider(provider.id)}
                  style={{
                    textAlign: 'left',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: activeProvider === provider.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${activeProvider === provider.id ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                    {provider.name}
                    {user?.[provider.id]?.apiKey && (
                      <span style={{ 
                        marginLeft: '0.8rem', 
                        fontSize: '0.7rem', 
                        background: '#10b981', 
                        color: '#fff', 
                        padding: '2px 8px', 
                        borderRadius: '20px',
                        verticalAlign: 'middle'
                      }}>ACTIVE</span>
                    )}
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', margin: 0 }}>
                    {provider.description}
                  </p>
                  {activeProvider === provider.id && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: '#6366f1'
                    }} />
                  )}
                </button>
              ))}
            </aside>

            {/* Config Form */}
            <section style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2.5rem',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: 'fit-content'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>
                Setup {PROVIDERS.find(p => p.id === activeProvider).name}
              </h2>
              
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Enter your personal API key for {PROVIDERS.find(p => p.id === activeProvider).name}. 
                {activeProvider === 'gemini' ? " If empty, the system's default key will be used." : " This enables the use of this provider in the fallback chain."}
                Your key is encrypted and stored securely.
              </p>

              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder={isSet ? '••••••••••••••••••••••••' : `Enter your ${PROVIDERS.find(p => p.id === activeProvider).name} API Key`}
                    value={apiKeys[activeProvider]}
                    onChange={(e) => setApiKeys({ ...apiKeys, [activeProvider]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '1rem 1.2rem',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                  />
                </div>

                {message.text && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' : '#f87171',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    fontSize: '0.95rem',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    {message.text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading || !apiKeys[activeProvider]}
                    className="generate-btn"
                    style={{
                      padding: '1rem 2rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: (loading || !apiKeys[activeProvider]) ? 'not-allowed' : 'pointer',
                      opacity: (loading || !apiKeys[activeProvider]) ? 0.7 : 1,
                      flex: 1,
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    {loading ? 'Submitting...' : isSet ? 'Update API Key' : 'Save API Key'}
                  </button>

                  {isSet && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={loading}
                      style={{
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#f87171',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default BYOK;

