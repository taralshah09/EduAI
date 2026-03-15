import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✦',
    description: 'Google\'s most capable models (Flash, Pro). Generous free tiers available.',
    tutorialUrl: 'https://youtu.be/OAdHg28ROy8?si=cuWOYV_ZBj-GXxvF',
    websiteUrl: 'https://aistudio.google.com/'
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    description: 'Ultra-fast LLaMA-3 models. Best for quick responses and summarization.',
    tutorialUrl: 'https://youtu.be/nt1PJu47nTk?si=GCwylRWQXAcY5ttr',
    websiteUrl: 'https://console.groq.com/keys'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '∞',
    description: 'Universal gateway to hundreds of models (DeepSeek, Claude, GPT-4).',
    tutorialUrl: 'https://youtu.be/VvJvJ0uXiVQ?si=C5o8lMpfT3OirbIM&t=166',
    websiteUrl: 'https://openrouter.ai/settings/keys'
  },
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
    // Reset message when switching providers
    setMessage({ type: '', text: '' });
  }, [activeProvider]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { [activeProvider]: apiKeys[activeProvider].trim() };
      const { data } = await api.put(
        '/auth/api-keys',
        payload
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
      const { data } = await api.put(
        '/auth/api-keys',
        payload
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

  const currentProvider = PROVIDERS.find(p => p.id === activeProvider);
  const isSet = !!user?.[activeProvider]?.apiKey;

  return (
    <div className="bg-surface text-dark font-sans min-h-screen flex flex-col">
      <div className="w-full bg-white flex flex-col grow shadow-sm">
        <Navbar />

        <main className="grow p-6 md:px-10 pb-10 flex flex-col">
          <header className="mb-10 mt-4">
            <h1 className="text-5xl md:text-7xl font-extrabold text-dark leading-[0.9] tracking-[-0.05em] uppercase">
              AI CONFIG <br />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                <span>MODULES</span>
                <span className="inline-block px-6 py-2 border border-gray-300 rounded-full text-lg md:text-2xl font-normal lowercase tracking-normal italic text-gray-400">for</span>
                <span>CUSTOM API</span>
              </div>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mt-6 font-medium">
              Bring your own API keys to increase your limits and access premium models. Your keys are encrypted and stored securely.
            </p>
          </header>

          <div className="grid grid-cols-12 gap-6 grow">
            {/* Sidebar Provider List UI - Bento Box 1 */}
            <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4 bg-gray-100 rounded-custom p-6 border-[1.5px] border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Select Provider</span>
                <div className="text-lg text-gray-400">✱</div>
              </div>

              <div className="flex flex-col gap-3">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setActiveProvider(provider.id)}
                    className={`text-left p-6 rounded-[20px] transition-all relative overflow-hidden group border-[1.5px] ${activeProvider === provider.id
                        ? 'bg-dark text-white border-transparent shadow-xl'
                        : 'bg-white text-dark border-gray-100 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl ${activeProvider === provider.id ? 'text-primary' : 'text-gray-400'}`}>
                          {provider.icon}
                        </span>
                        <span className="font-bold text-lg tracking-tight">{provider.name}</span>
                      </div>
                      {user?.[provider.id]?.apiKey && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${activeProvider === provider.id ? 'bg-primary text-dark' : 'bg-green-100 text-green-600'
                          }`}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${activeProvider === provider.id ? 'text-gray-400' : 'text-gray-500'}`}>
                      {provider.description}
                    </p>
                    {activeProvider === provider.id && (
                      <div className="absolute right-4 bottom-4 opacity-20 text-4xl">
                        {provider.icon}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                  <div className="w-10 h-10 bg-dark rounded-full flex items-center justify-center text-primary shrink-0 font-bold">
                    i
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 leading-tight uppercase tracking-wider">
                    Keys are never shared with anyone and are used only for your requests.
                  </p>
                </div>
              </div>
            </aside>

            {/* Config Form - Bento Box 2 */}
            <section className="col-span-12 lg:col-span-8 bg-primary rounded-custom p-8 md:p-10 flex flex-col justify-between group border-[1.5px] border-primary">
              <div className="space-y-8">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-2">
                    <span className="px-4 py-1.5 rounded-full bg-dark text-white text-[10px] font-bold uppercase tracking-widest">Configuration</span>
                    <span className="px-4 py-1.5 rounded-full border border-dark/20 text-dark text-[10px] font-bold uppercase tracking-widest">
                      {activeProvider}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-dark/40">SECURE_VAULT_v1.0</span>
                </div>

                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-black text-dark tracking-tighter uppercase leading-none">
                    Setup <br />
                    <span className="text-dark/60 italic">{currentProvider.name}</span>
                  </h2>
                  <div className="h-[1.5px] bg-dark/10 w-full"></div>
                </div>

                <div className="bg-white/40 border border-dark/5 p-8 rounded-[32px] backdrop-blur-sm">
                  <form onSubmit={handleSave} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-dark mb-2 ml-4">
                        Provider API Key
                      </label>
                      <div className="flex items-center bg-white rounded-full px-6 py-4 border border-gray-200 focus-within:border-dark transition-all relative shadow-sm">
                        <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <input
                          type="password"
                          className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium"
                          placeholder={isSet ? '••••••••••••••••••••••••' : `Enter your ${currentProvider.name} API Key`}
                          value={apiKeys[activeProvider]}
                          onChange={(e) => {
                            setApiKeys({ ...apiKeys, [activeProvider]: e.target.value });
                            setMessage({ type: '', text: '' });
                          }}
                          disabled={loading}
                        />
                      </div>
                      <p className="text-[10px] text-dark/60 mt-3 ml-4 font-medium italic">
                        {activeProvider === 'gemini'
                          ? "If empty, the system's default key will be used."
                          : `This enables the use of ${currentProvider.name} in the fallback chain.`}
                      </p>
                    </div>

                    {message.text && (
                      <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                          ? 'bg-green-100/50 border-green-200 text-green-700'
                          : 'bg-red-100/50 border-red-200 text-red-700'
                        }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                          {message.type === 'success' ? '✓' : '!'}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading || !apiKeys[activeProvider]}
                        className="grow bg-dark text-white font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                      >
                        {loading ? 'Processing...' : isSet ? 'Update Configuration' : 'Save Connection'}
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                        </svg>
                      </button>

                      {isSet && (
                        <button
                          type="button"
                          onClick={handleRemove}
                          disabled={loading}
                          className="px-8 py-4 rounded-full border-[1.5px] border-dark text-dark font-bold uppercase tracking-widest text-sm hover:bg-dark hover:text-primary transition-all disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>

                    {/* Tutorial and Resources Section */}
                    <div className="mt-8 pt-8 border-t border-dark/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-dark/40">Help & Resources</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-dark/20"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-dark/10"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a
                          href={currentProvider.tutorialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 bg-white/20 hover:bg-white/40 p-4 rounded-2xl transition-all group/link border border-transparent hover:border-dark/5"
                        >
                          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover/link:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-dark/40 leading-none mb-1">Watch Guide</p>
                            <p className="text-sm font-black text-dark uppercase tracking-tight">YouTube Tutorial</p>
                          </div>
                        </a>
                        <a
                          href={currentProvider.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 bg-white/20 hover:bg-white/40 p-4 rounded-2xl transition-all group/link border border-transparent hover:border-dark/5"
                        >
                          <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center text-primary shadow-lg group-hover/link:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-dark/40 leading-none mb-1">Official Dashboard</p>
                            <p className="text-sm font-black text-dark uppercase tracking-tight">Get API Key</p>
                          </div>
                        </a>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="flex justify-between items-end mt-12">
                <p className="text-dark/60 text-sm font-medium leading-relaxed max-w-sm">
                  Connecting your own API Keys gives you independence from our platform's shared quotas and unlocks higher rate limits for your generated courses.
                </p>
                <div className="w-20 h-20 bg-dark rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-2xl">
                  <svg className="w-10 h-10 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                  </svg>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="px-10 py-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex gap-6">
            <a className="hover:text-dark" href="#">Security</a>
            <a className="hover:text-dark" href="#">API Guide</a>
            <a className="hover:text-dark" href="#">Privacy</a>
          </div>
          <div>© 2026 TL;DR LABS • v1.0.0</div>
        </footer>
      </div>
    </div>
  );
};

export default BYOK;
