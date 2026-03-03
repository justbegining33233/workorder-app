"use client";

import { useEffect, useState } from 'react';

interface Props {
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

export default function IdleWarningModal({ secondsLeft, onStay, onLogout }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1d27', border: '1px solid #e5332a',
        borderRadius: 14, padding: '32px 36px', maxWidth: 380, width: '90%',
        textAlign: 'center', boxShadow: '0 8px 40px rgba(229,51,42,0.3)',
      }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>⏱️</div>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>
          Still there?
        </h2>
        <p style={{ color: '#b8beca', fontSize: 14, margin: '0 0 6px' }}>
          You&apos;ve been inactive for a while.
        </p>
        <p style={{ color: '#ff948d', fontSize: 14, margin: '0 0 24px' }}>
          You&apos;ll be logged out in <strong style={{ color: '#e5332a', fontSize: 18 }}>{secondsLeft}s</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onLogout}
            style={{
              background: 'transparent', border: '1px solid #555',
              color: '#b8beca', borderRadius: 8, padding: '10px 20px',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            Log out
          </button>
          <button
            onClick={onStay}
            style={{
              background: '#e5332a', border: 'none',
              color: '#fff', borderRadius: 8, padding: '10px 24px',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}
