import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageSquare, Search, FileText, BookOpen, History,
  Scale, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/chat', icon: MessageSquare, label: 'AI Assistant' },
  { path: '/case-search', icon: BookOpen, label: 'Case Search' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? '64px' : 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        transition: 'width var(--transition-base)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '20px 16px' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        minHeight: '70px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent-gold), #8B6020)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(201,150,59,0.35)',
        }}>
          <Scale size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#F0EBE1',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}>
              Legal Assistant
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: 'rgba(200,192,180,0.55)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              Legal Intelligence
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {!collapsed && (
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(200,192,180,0.4)',
            padding: '0 10px',
            marginBottom: '8px',
          }}>
            Navigation
          </div>
        )}
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 14px' : '10px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#F0EBE1' : 'rgba(200,192,180,0.6)',
                background: isActive
                  ? 'rgba(201,150,59,0.15)'
                  : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
                transition: 'all var(--transition-fast)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              title={collapsed ? label : undefined}
            >
              <Icon
                size={17}
                color={isActive ? 'var(--accent-gold)' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              {!collapsed && (
                <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 500 : 400 }}>
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(200,192,180,0.5)',
          cursor: 'pointer',
          transition: 'color var(--transition-fast)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
