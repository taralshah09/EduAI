import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './DashboardPage.css'; // Reusing some dashboard styles for consistency
import Navbar from '../components/Navbar';

const BYOK = () => {
  const { user, updateUser } = useAuth();
  const [geminiKey, setGeminiKey] = useState('');
  const [isSet, setIsSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.gemini?.apiKey) {
      setIsSet(true);
    } else {
      setIsSet(false);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.put(
        'http://localhost:3000/api/auth/api-keys',
        { gemini: geminiKey },
        { withCredentials: true }
      );
      setMessage({ type: 'success', text: data.message });
      setIsSet(!!data.apiKeys?.apiKey);
      setGeminiKey('');
      updateUser({ gemini: data.apiKeys });
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
      const { data } = await axios.put(
        'http://localhost:3000/api/auth/api-keys',
        { gemini: '' }, // An empty string clears it
        { withCredentials: true }
      );
      setMessage({ type: 'success', text: 'API key removed successfully' });
      setIsSet(false);
      setGeminiKey('');
      updateUser({ gemini: data.apiKeys });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove API key',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>Settings</h1>
            <p>Manage your account and API configurations</p>
          </header>

          <section className="settings-section" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '600px',
            marginTop: '2rem'
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#fff' }}>AI Configuration (BYOK)</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Enter your personal Gemini API key to use your own quota. If left empty, the system's default key will be used.
              Your key is stored securely.
            </p>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  Gemini API Key {isSet && <span style={{ color: '#4ade80', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Currently Set)</span>}
                </label>
                <input
                  type="password"
                  placeholder={isSet ? '••••••••••••••••' : 'Enter your Google Gemini API Key'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {message.text && (
                <div style={{
                  padding: '0.8rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  backgroundColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
                  fontSize: '0.9rem'
                }}>
                  {message.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading || !geminiKey}
                  className="generate-btn"
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: (loading || !geminiKey) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !geminiKey) ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Save Key'}
                </button>

                {isSet && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={loading}
                    style={{
                      padding: '0.8rem 1.5rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(248, 113, 113, 0.5)',
                      background: 'transparent',
                      color: '#f87171',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    Remove Key
                  </button>
                )}
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  );
};

export default BYOK;
