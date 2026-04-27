import React, { useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, ExternalLink, BookOpen, FileText, Scale, X } from 'lucide-react';

// ── config ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.SEARCH_API_URL || 'http://localhost:5050';

const CASE_LAW_FILTERS = [
  { value: 'all',           label: 'All Sources' },
  { value: 'supreme_court', label: 'Supreme Court' },
  { value: 'high_court',    label: 'High Courts' },
  { value: 'constitution',  label: 'Constitutional' },
  { value: 'ipc',           label: 'IPC' },
  { value: 'bns',           label: 'BNS 2023' },
];

const SOURCE_META = {
  supreme_court: { label: 'Supreme Court', color: '#c8a84b', bg: 'rgba(200,168,75,0.12)', border: 'rgba(200,168,75,0.25)' },
  high_court:    { label: 'High Court',    color: '#4caf82', bg: 'rgba(76,175,130,0.10)', border: 'rgba(76,175,130,0.22)' },
  constitution:  { label: 'Constitution',  color: '#6fa8dc', bg: 'rgba(111,168,220,0.10)', border: 'rgba(111,168,220,0.22)' },
  ipc:           { label: 'IPC',           color: '#e07070', bg: 'rgba(224,112,112,0.10)', border: 'rgba(224,112,112,0.22)' },
  bns:           { label: 'BNS 2023',      color: '#b07ae0', bg: 'rgba(176,122,224,0.10)', border: 'rgba(176,122,224,0.22)' },
};

// ── skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="skeleton" style={{ height: '22px', width: '65%', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '14px', width: '42%', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '64px', borderRadius: '6px' }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        {[80, 110, 90].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: '22px', width: `${w}px`, borderRadius: '20px' }} />
        ))}
      </div>
    </div>
  );
}

// ── case detail modal ────────────────────────────────────────────────────────
function CaseDetailModal({ caseData, onClose }) {
  if (!caseData) return null;
  const sm = SOURCE_META[caseData.source] || SOURCE_META.high_court;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-1)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)', padding: '28px 32px',
          maxWidth: '720px', width: '100%', maxHeight: '80vh',
          overflowY: 'auto', position: 'relative', boxShadow: 'var(--shadow-lg)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)',
          }}
        >
          <X size={18} />
        </button>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '20px',
          background: sm.bg, border: `1px solid ${sm.border}`,
          color: sm.color, fontSize: '0.72rem', fontWeight: 600,
          marginBottom: '12px',
        }}>
          {sm.label}
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
          {caseData.title}
        </h2>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {[
            { label: 'Court',    value: caseData.court },
            { label: 'Year',     value: caseData.year },
            { label: 'Citation', value: caseData.citation },
            { label: 'Docket',   value: caseData.docket },
            { label: 'Judges',   value: caseData.judges },
          ].filter(f => f.value).map(f => (
            <div key={f.label}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{f.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: f.label === 'Citation' || f.label === 'Docket' ? 'monospace' : undefined }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Summary</h4>
        <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '20px' }}>
          {caseData.summary}
        </p>

        {caseData.disposition && (
          <>
            <h4 style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disposition</h4>
            <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {caseData.disposition}
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          {caseData.pdf_url && (
            <a href={caseData.pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
              <FileText size={14} /> Download PDF
            </a>
          )}
          {caseData.kanoon_url && (
            <a href={caseData.kanoon_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '0.82rem' }}>
              <ExternalLink size={14} /> Search on Indian Kanoon
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── case card ────────────────────────────────────────────────────────────────
function CaseCard({ caseData, onExpand }) {
  const [expanded, setExpanded] = useState(false);
  const sm = SOURCE_META[caseData.source] || SOURCE_META.high_court;

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            onClick={() => onExpand(caseData)}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.02rem',
              marginBottom: '5px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            title="Click for full details"
          >
            {caseData.title}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.77rem', color: 'var(--text-tertiary)' }}>{caseData.court}</span>
            {caseData.year && <><span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>·</span>
            <span style={{ fontSize: '0.77rem', color: 'var(--text-tertiary)' }}>{caseData.year}</span></>}
            {caseData.citation && (
              <span style={{ fontSize: '0.71rem', fontFamily: 'monospace', color: 'var(--accent-gold)' }}>
                {caseData.citation}
              </span>
            )}
          </div>
        </div>

        <div style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--accent-green)',
          background: 'rgba(42,107,74,0.10)',
          border: '1px solid rgba(42,107,74,0.20)',
          padding: '3px 9px', borderRadius: '20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Scale size={10} /> {caseData.relevance}% match
        </div>
      </div>

      {/* summary */}
      <p style={{
        fontSize: '0.85rem', lineHeight: 1.65,
        color: 'var(--text-secondary)', margin: 0,
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 3,
        WebkitBoxOrient: 'vertical',
        overflow: expanded ? 'visible' : 'hidden',
      }}>
        {caseData.summary}
      </p>

      {/* tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px',
          borderRadius: '20px', background: sm.bg, border: `1px solid ${sm.border}`, color: sm.color,
        }}>
          {sm.label}
        </span>
        {caseData.tags.map(tag => (
          <span key={tag} style={{
            fontSize: '0.68rem', padding: '3px 8px',
            borderRadius: '20px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-tertiary)',
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* actions */}
      <div style={{
        display: 'flex', gap: '8px', alignItems: 'center',
        borderTop: '1px solid var(--border-light)', paddingTop: '10px',
      }}>
        <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.77rem' }}>
          {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
        </button>
        <button onClick={() => onExpand(caseData)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.77rem' }}>
          <ExternalLink size={13} /> Full details
        </button>
        {caseData.pdf_url && (
          <a href={caseData.pdf_url} target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.77rem', textDecoration: 'none' }}>
            <FileText size={13} /> PDF
          </a>
        )}
      </div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
export default function CaseSearchPage({ showToast }) {
  const [query, setQuery]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [results, setResults]     = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);   // for modal

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: query, source: filter, limit: 10 });
      const res = await fetch(`${API_BASE}/api/search?${params}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
      setTotalFound(data.total || 0);
      showToast?.({ type: 'info', message: `Found ${data.total} relevant cases` });
    } catch (err) {
      setError(err.message);
      setResults([]);
      showToast?.({ type: 'error', message: `Search failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [query, filter, showToast]);

  return (
    <>
      {/* modal */}
      {selected && <CaseDetailModal caseData={selected} onClose={() => setSelected(null)} />}

      <div className="page-body">
        {/* header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '6px' }}>Case Law Search</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Search across Supreme Court judgements, High Court orders, IPC sections, BNS 2023, and constitutional provisions.
          </p>
        </div>

        {/* search box */}
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
              }} />
              <input
                className="input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Right to privacy, Section 302 IPC, Bail conditions, Article 21…"
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <button onClick={handleSearch} className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CASE_LAW_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: '5px 13px', borderRadius: '20px', cursor: 'pointer',
                  border: filter === f.value ? '1px solid var(--accent-gold)' : '1px solid var(--border-light)',
                  background: filter === f.value ? 'var(--accent-gold-dim)' : 'transparent',
                  color: filter === f.value ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontSize: '0.77rem', fontFamily: 'var(--font-body)',
                  transition: 'all var(--transition-fast)',
                  fontWeight: filter === f.value ? 600 : 400,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* error banner */}
        {error && (
          <div style={{
            background: 'rgba(224,112,112,0.10)', border: '1px solid rgba(224,112,112,0.25)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            color: '#e07070', fontSize: '0.85rem', marginBottom: '20px',
          }}>
            ⚠ {error} — make sure the Python backend is running on port 5050.
          </div>
        )}

        {/* skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* results */}
        {!loading && searched && results.length > 0 && (
          <>
            <p style={{ marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Showing {results.length} of {totalFound} results for&nbsp;
              <strong style={{ color: 'var(--text-primary)' }}>{query}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.map(c => (
                <CaseCard key={c.id} caseData={c} onExpand={setSelected} />
              ))}
            </div>
          </>
        )}

        {/* no results */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="empty-state">
            <BookOpen size={40} />
            <h3>No cases found</h3>
            <p>Try different keywords or broaden your filter selection.</p>
          </div>
        )}

        {/* initial state */}
        {!searched && !loading && (
          <div className="empty-state">
            <Search size={40} />
            <h3>Search for case law</h3>
            <p>Enter a legal query, IPC section, or constitutional article to find relevant judgements and precedents.</p>
          </div>
        )}
      </div>
    </>
  );
}
