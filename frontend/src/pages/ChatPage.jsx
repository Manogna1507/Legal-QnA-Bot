import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, ChevronDown, ChevronUp, Scale, Sparkles, RotateCcw, Volume2 } from 'lucide-react';
import { MOCK_INITIAL_MESSAGES, SUGGESTED_QUESTIONS } from '../data/mockData.js';


// ─────────────────────────────────────────────────────────────────────────────
// Paste your ngrok URL from Kaggle into .env as VITE_API_URL=https://xxxx.ngrok-free.app
// OR hard-code it below temporarily during development:
// const API_BASE = 'https://xxxx.ngrok-free.app';
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEFAULT_THINKING = [
  'Parsing legal query and identifying jurisdiction…',
  'Mapping to BNS / BNSS / constitutional provisions…',
  'Cross-referencing Supreme Court precedents…',
  'Checking state-specific regulations…',
  'Formulating structured response…',
];

// ── Animated dots ─────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: 'var(--accent-gold)',
          animation: 'pulse 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

const speakText = (text, setSpeakingMsgId, msgId) => {
  if (!('speechSynthesis' in window)) return;

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    setSpeakingMsgId(null);
    return;
  }

  // 1. Better cleaning to avoid "robotic" pauses
  const cleanText = text
    .replace(/[*#]/g, '') 
    .replace(/\n/g, '. ')
    .trim();

  const utter = new SpeechSynthesisUtterance(cleanText);
  const voices = speechSynthesis.getVoices();

  // 2. STRICTOR FILTERING: Find a high-quality English voice
  // We prioritize "Google" or "Natural" en-US/en-GB voices
  const preferredVoice = 
    voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
    voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
    voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utter.voice = preferredVoice;
    utter.lang = preferredVoice.lang;
  }

  // 3. Cadence Adjustments
  utter.rate = 1.0; 
  utter.pitch = 1.0;

  utter.onstart = () => setSpeakingMsgId(msgId);
  utter.onend = () => setSpeakingMsgId(null);

  speechSynthesis.speak(utter);
};

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, showToast, speakingMsgId, setSpeakingMsgId }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <div className="fade-in" style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '12px',
      alignItems: 'flex-start',
      marginBottom: '20px',
    }}>
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px',
        borderRadius: isUser ? '8px' : '50%',
        background: isUser
          ? 'linear-gradient(135deg, #3B6EA3, #1E4D7B)'
          : 'linear-gradient(135deg, var(--accent-gold), #8B6020)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {isUser
          ? <span style={{ fontFamily: 'var(--font-display)', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>M</span>
          : <Scale size={15} color="#fff" />}
      </div>

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Reasoning accordion (assistant only) */}
        {!isUser && msg.reasoning?.length > 0 && (
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-light)',
            borderRadius: '8px', overflow: 'hidden',
          }}>
            <button onClick={() => setExpanded(!expanded)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', background: 'transparent', border: 'none',
              cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 500,
            }}>
              <Sparkles size={12} color="var(--accent-gold)" />
              <span>Reasoning steps ({msg.reasoning.length})</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {expanded && (
              <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {msg.reasoning.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'var(--accent-gold-dim)', color: 'var(--accent-gold)',
                      fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginTop: '1px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isUser
          ? 'linear-gradient(135deg, #2A4D7A, #1E3D5C)'
          : speakingMsgId === msg.id
          ? '#fff3cd'   // highlight when speaking
          : 'var(--surface-1)',
          border: isUser ? 'none' : '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{
            margin: 0, fontSize: '0.88rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
            color: isUser ? '#F0EBE1' : 'var(--text-primary)',
          }}>
            {msg.content}
          </p>
        </div>

        {/* Timestamp + copy (assistant only) */}
        {!isUser && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
              {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(msg.content); showToast({ type: 'success', message: 'Copied!' }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: 'var(--text-tertiary)', padding: '0 4px' }}
            >Copy</button>
            <button
              onClick={() => speakText(msg.content, setSpeakingMsgId, msg.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.68rem',
                color: 'var(--text-tertiary)',
                padding: '0 4px'
              }}
              title="Read aloud"
            >
              {speakingMsgId === msg.id ? (
              <span style={{ fontSize: '14px' }}>⏹</span>
            ) : (
              <Volume2 size={14} />
            )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatPage({ language, voiceActive, showToast }) {
  const [messages, setMessages]         = useState(MOCK_INITIAL_MESSAGES);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [thinkingList, setThinkingList] = useState(DEFAULT_THINKING);
  const [backendOnline, setBackendOnline] = useState(true);
  const [detectedLang, setDetectedLang] = useState('auto');

  // Voice recording state
  const [recording, setRecording]       = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecRef  = useRef(null);
  const audioChunks  = useRef([]);
  const bottomRef    = useRef(null);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    checkBackend(); // initial check

    const interval = setInterval(checkBackend, 5000); // every 5 sec

    return () => clearInterval(interval);
  }, []);

//   useEffect(() => {
//   window.speechSynthesis.onvoiceschanged = () => {
//     window.speechSynthesis.getVoices();
//   };
// }, []);

useEffect(() => {
  if (!backendOnline) {
    showToast({
      type: 'error',
      message: 'Backend disconnected'
    });
  }
}, [backendOnline]);

useEffect(() => {
  if (!backendOnline) {
    speechSynthesis.cancel();
    setSpeakingMsgId(null);
  }
}, [backendOnline]);

useEffect(() => {
  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    console.log("Voices loaded:", voices.length);
  };

  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}, []);

  // ── Call Kaggle/ngrok chat endpoint ────────────────────────────────────────
  const sendToBackend = async (history) => {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ngrok free tier requires this header to skip the browser warning page
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ messages: history, language: detectedLang })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${res.status}`);
    }
    return res.json();
  };

  console.log("Calling backend...");
  // ── Send text message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!backendOnline) {
      showToast({
        type: 'error',
        message: 'Backend is offline. Please try again later.'
      });
      return;
    }

    const userMsg = {
      id: `u${Date.now()}`, role: 'user',
      content: input.trim(), timestamp: new Date(),
    };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput('');
    setLoading(true);
    setThinkingStep(0);
    setThinkingList(DEFAULT_THINKING);

    // Cycle thinking steps while waiting
    const iv = setInterval(() =>
      setThinkingStep(p => Math.min(p + 1, DEFAULT_THINKING.length - 1)), 700);

    try {
      const history = nextMsgs
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const data = await sendToBackend(history);
      clearInterval(iv);

      const aMsg = {
        id: `a${Date.now()}`, role: 'assistant',
        content: data.content, timestamp: new Date(),
        reasoning: data.reasoning || DEFAULT_THINKING,
      };
      setMessages(p => [...p, aMsg]);

      // TTS
      // 🔊 AUTO READ ALOUD (improved)
    // if ('speechSynthesis' in window) {
    //   window.speechSynthesis.cancel(); // stop previous speech

    //   const cleanText = data.content
    //     .replace(/\*\*/g, '')
    //     .replace(/^#+\s*/gm, '');

    //   const utter = new SpeechSynthesisUtterance(cleanText);

    //   const langMap = {
    //     hi: 'hi-IN',
    //     te: 'te-IN',
    //     ta: 'ta-IN',
    //     kn: 'kn-IN',
    //     mr: 'mr-IN',
    //   };

    //   utter.lang = langMap[data.detected_language] || 'en-IN';
    //   utter.rate = 0.9;
    //   utter.pitch = 1;

    //   window.speechSynthesis.speak(utter);
    // }

    } catch (err) {
      clearInterval(iv);
      showToast({ type: 'error', message: `Backend error: ${err.message}` });
      setMessages(p => p.filter(m => m.id !== userMsg.id));
      setInput(userMsg.content);
    } finally {
      setLoading(false);
    }
  };

  // ── Voice: record with MediaRecorder → send blob to Whisper endpoint ───────
  const handleVoiceToggle = async () => {
    // Stop recording
    if (recording) {
      mediaRecRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecRef.current = mr;
      audioChunks.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        setTranscribing(true);

        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const form = new FormData();
        form.append('audio', blob, 'recording.webm');
        if (language) form.append('language_hint', language);

        try {
          const res = await fetch(`${API_BASE}/api/transcribe`, {
            method: 'POST',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            body: form,
          });
          if (!res.ok) throw new Error(`Whisper error ${res.status}`);
          const data = await res.json();
          setInput(data.text);
          setDetectedLang(data.detected_language || 'auto');
          showToast({
            type: 'success',
            message: `Transcribed • ${data.detected_language.toUpperCase()} • ${Math.round(data.confidence * 100)}% confidence`,
          });
        } catch (err) {
          showToast({ type: 'error', message: `Transcription failed: ${err.message}` });
        } finally {
          setTranscribing(false);
        }
      };

      mr.start();
      setRecording(true);
    } catch {
      showToast({ type: 'error', message: 'Microphone access denied. Check browser permissions.' });
    }
  };

  const clearChat = () => {
    setMessages(MOCK_INITIAL_MESSAGES);
    window.speechSynthesis?.cancel();
    showToast({ type: 'info', message: 'Conversation cleared' });
  };

  const micBusy = recording || transcribing;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Messages scroll area */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 28px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-elevated)'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: backendOnline ? 'green' : 'red'
        }}></span>

        <span style={{
          fontSize: '0.75rem',
          color: backendOnline ? 'green' : 'red'
        }}>
          {backendOnline ? 'Backend Online' : 'Backend Offline (Reconnecting...)'}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', scrollbarWidth: 'thin' }}>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '10px', textAlign: 'center' }}>
              Suggested questions to get started:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => setInput(q)} style={{
                  padding: '7px 13px', background: 'var(--surface-1)',
                  border: '1px solid var(--border-light)', borderRadius: '20px',
                  fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer',
                  transition: 'all var(--transition-fast)', fontFamily: 'var(--font-body)',
                }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.color = 'var(--accent-gold)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.color = 'var(--text-secondary)'; }}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            msg={msg} 
            showToast={showToast} 
            speakingMsgId={speakingMsgId}
            setSpeakingMsgId={setSpeakingMsgId}
          />
        ))}

        {/* Thinking indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-gold), #8B6020)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Scale size={15} color="#fff" /></div>
            <div style={{
              padding: '12px 16px', background: 'var(--surface-1)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px 14px 14px 14px', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                {thinkingList[thinkingStep]}
              </div>
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ borderTop: '1px solid var(--border-light)', padding: '16px 28px', background: 'var(--bg-elevated)' }}>

        {/* Recording / transcribing banner */}
        {micBusy && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '10px', padding: '8px 14px',
            background: recording ? 'rgba(229,62,62,0.06)' : 'rgba(201,150,59,0.08)',
            border: `1px solid ${recording ? '#e53e3e55' : 'var(--border-gold)'}`,
            borderRadius: '8px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: recording ? '#e53e3e' : 'var(--accent-gold)',
              animation: 'pulse 1s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.8rem', color: recording ? '#e53e3e' : 'var(--accent-gold)' }}>
              {recording ? 'Recording… click mic to stop' : 'Whisper is transcribing…'}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about your legal rights, BNS sections, court procedures…"
            rows={1}
            style={{
              flex: 1, padding: '11px 14px',
              background: 'var(--surface-2)', border: '1px solid var(--border-medium)',
              borderRadius: '10px', fontFamily: 'var(--font-body)',
              fontSize: '0.88rem', color: 'var(--text-primary)',
              outline: 'none', resize: 'none', lineHeight: 1.5,
              maxHeight: '120px', overflowY: 'auto',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-gold)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
          />

          {/* Mic button */}
          <button onClick={handleVoiceToggle} disabled={transcribing || !backendOnline}
            title={recording ? 'Click to stop recording' : 'Record voice (Whisper model)'}
            style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: recording ? 'rgba(229,62,62,0.1)' : transcribing ? 'rgba(201,150,59,0.1)' : 'var(--surface-2)',
              border: `1px solid ${recording ? '#e53e3e' : 'var(--border-light)'}`,
              color: recording ? '#e53e3e' : transcribing ? 'var(--accent-gold)' : 'var(--text-tertiary)',
              cursor: transcribing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {recording ? <Mic size={17} /> : <MicOff size={17} />}
          </button>

          {/* Send button */}
          <button onClick={handleSend} disabled={!input.trim() || loading || !backendOnline}
            style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: input.trim() && !loading ? 'var(--accent-gold)' : 'var(--surface-3)',
              border: 'none',
              color: input.trim() && !loading ? '#fff' : 'var(--text-tertiary)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}>
            <Send size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            Enter to send · Shift+Enter for new line ·
          </span>
          <button onClick={clearChat} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.7rem', color: 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: 'var(--font-body)',
          }}>
            <RotateCcw size={11} /> Clear chat
          </button>
        </div>
      </div>
    </div>
  );
}
