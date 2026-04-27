import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Mic, MicOff, Globe, User } from 'lucide-react';
import { LANGUAGES } from '../data/mockData.js';

const PAGE_TITLES = {
  '/chat': 'AI Legal Assistant',
  '/case-search': 'Case Law Search',
};

const PAGE_SUBTITLES = {
  '/chat': 'Ask anything about Indian law',
  '/case-search': 'Search IPC, BNS, Constitution & court judgements',
};

export default function Topbar({ theme, onThemeToggle, language, onLanguageChange, voiceActive, onVoiceToggle }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Legal Assistant';
  const subtitle = PAGE_SUBTITLES[location.pathname] || '';

  return (
    <header style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px 0 24px',
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border-light)',
      flexShrink: 0,
    }}>
      {/* Left: Title */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          <Globe size={14} color="var(--text-tertiary)" />
          <select
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '22px', background: 'var(--border-light)', margin: '0 4px' }} />

        {/* Voice toggle */}
        <button
          className="btn-icon"
          onClick={onVoiceToggle}
          title={voiceActive ? 'Disable voice output' : 'Enable voice output'}
          style={{
            background: voiceActive ? 'rgba(201,150,59,0.1)' : 'transparent',
            color: voiceActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
            border: voiceActive ? '1px solid var(--border-gold)' : '1px solid transparent',
          }}
        >
          {voiceActive ? <Mic size={16} /> : <MicOff size={16} />}
        </button>

        {/* Theme toggle */}
        <button
          className="btn-icon"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '22px', background: 'var(--border-light)', margin: '0 4px' }} />

        {/* User */}
        <button
          className="btn-icon"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-gold), #8B6020)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          M
        </button>
      </div>
    </header>
  );
}
