'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function TechPhotos() {
  const { user, isLoading } = useRequireAuth(['tech', 'manager']);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; filename?: string; caption?: string; workOrderId?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [workOrderInput, setWorkOrderInput] = useState('');

  // modal state for upload window
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalPreview, setModalPreview] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch('/api/photos');
        if (res.ok) {
          const json = await res.json();
          setPhotos(json.photos || []);
        }
      } catch (err) {
        console.debug('/api/photos not available');
      }
    })();
  }, [user]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);

    const temp = { id: `local-${Date.now()}`, url: URL.createObjectURL(file), filename: file.name, caption: caption || undefined, workOrderId: workOrderInput || undefined };
    setPhotos(p => [temp, ...p]);

    try {
      const form = new FormData();
      form.append('photo', file);
      if (caption) form.append('caption', caption);
      if (workOrderInput) form.append('workOrderId', workOrderInput);

      const res = await fetch('/api/photos', { method: 'POST', body: form });
      if (res.ok) {
        const j = await res.json();
        if (j.photo && j.photo.url) setPhotos(p => p.map(x => x.id === temp.id ? j.photo : x));
        setCaption('');
        setWorkOrderInput('');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
      setPhotos(p => p.filter(x => x.id !== temp.id));
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: '#e5e7eb', fontSize: 18}}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/tech/all-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>← Back to Tools</Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>📸 Tech Photos</h1>
          <div style={{fontSize:14, color:'#9aa3b2'}}>Upload and manage photos taken on jobs.</div>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
          <div>
            <h2 style={{margin:0, color:'#e5e7eb'}}>Photo Gallery</h2>
            <div style={{fontSize:13, color:'#9aa3b2', marginTop:6}}>Upload photos for work order documentation.</div>
          </div>

          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={() => setShowUploadModal(true)} style={{background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:8, cursor:'pointer'}}>Upload Photo</button>

            {/* Upload modal (popup window) */}
            {showUploadModal && (
              <div role="dialog" aria-modal="true" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60}} onClick={() => { setShowUploadModal(false); setModalFile(null); setModalPreview(''); }}>
                <div onClick={(e) => e.stopPropagation()} style={{width:720, maxWidth:'95%', background:'#0b1220', borderRadius:12, padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                    <div>
                      <div style={{fontSize:16, fontWeight:700, color:'#e5e7eb'}}>Upload Photo</div>
                      <div style={{fontSize:13, color:'#9aa3b2'}}>Select an image, add a caption and optionally assign to a Work Order.</div>
                    </div>
                    <button onClick={() => { setShowUploadModal(false); setModalFile(null); setModalPreview(''); }} style={{background:'transparent', border:'none', color:'#9aa3b2', cursor:'pointer'}}>✕</button>
                  </div>

                  <div style={{display:'flex', gap:12}}>
                    <div style={{flex:'0 0 320px', borderRadius:8, overflow:'hidden', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', minHeight:180}}>
                      {modalPreview ? (
                        <img src={modalPreview} alt="preview" style={{width:'100%', height:180, objectFit:'cover'}} />
                      ) : (
                        <div style={{color:'#6b7280'}}>No image selected</div>
                      )}
                    </div>

                    <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
                      <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setModalFile(f);
                          setModalPreview(f ? URL.createObjectURL(f) : '');
                        }} />
                      </label>

                      <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} style={{padding:8, borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'#e5e7eb'}} />

                      <input placeholder="Assign to WO (id)" value={workOrderInput} onChange={(e) => setWorkOrderInput(e.target.value)} style={{padding:8, borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'#e5e7eb'}} />

                      <div style={{display:'flex', gap:8, marginTop:8}}>
                        <button onClick={async () => {
                          if (!modalFile) return alert('Select an image first');
                          await onFile(modalFile);
                          setShowUploadModal(false);
                          setModalFile(null);
                          setModalPreview('');
                        }} style={{background:'#3b82f6', color:'#fff', padding:'8px 12px', borderRadius:8, border:'none'}}>Upload</button>

                        <button onClick={() => { setShowUploadModal(false); setModalFile(null); setModalPreview(''); }} style={{background:'transparent', color:'#9aa3b2', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.04)'}}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12}}>
          {photos.length === 0 && (
            <div style={{padding:36, borderRadius:8, background:'#0b1220', color:'#9aa3b2'}}>No photos yet — click "Upload Photo" to add images from your device.</div>
          )}

          {photos.map(p => (
            <div key={p.id} style={{borderRadius:8, overflow:'hidden', background:'#000', position:'relative', minHeight:140}}>
              <img src={p.url} alt={p.filename || 'photo'} style={{width:'100%', height:160, objectFit:'cover', display:'block'}} />
              <div style={{position:'absolute', left:8, bottom:8, right:8, display:'flex', justifyContent:'space-between', gap:8, alignItems:'center'}}>
                <div style={{background:'rgba(0,0,0,0.6)', color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:12, maxWidth:'55%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.caption || p.filename || ''}</div>
                <div style={{display:'flex', gap:6}}>
                  <button onClick={() => { navigator.clipboard?.writeText(p.url); alert('Image URL copied'); }} style={{background:'rgba(255,255,255,0.03)', color:'#fff', border:'none', padding:'6px 8px', borderRadius:6, cursor:'pointer'}}>Copy URL</button>
                  <button onClick={async () => {
                    const newCaption = prompt('Caption', p.caption || '');
                    if (newCaption !== null) {
                      // update on server
                      try {
                        const res = await fetch(`/api/photos/${p.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ caption: newCaption }) });
                        if (res.ok) {
                          const j = await res.json();
                          setPhotos(prev => prev.map(x => x.id === p.id ? j.photo : x));
                        }
                      } catch (err) { console.error(err); }
                    }
                  }} style={{background:'rgba(255,255,255,0.03)', color:'#fff', border:'none', padding:'6px 8px', borderRadius:6, cursor:'pointer'}}>Edit</button>
                  <button onClick={async () => {
                    const wo = prompt('Assign to Work Order ID', p.workOrderId || '');
                    if (!wo) return;
                    try {
                      // attach to work order (server will also update work order photos)
                      await fetch(`/api/workorders/${wo}/photos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: p.url, caption: p.caption || '' }) });
                      // update local metadata
                      const r = await fetch(`/api/photos/${p.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ workOrderId: wo }) });
                      if (r.ok) {
                        const j = await r.json();
                        setPhotos(prev => prev.map(x => x.id === p.id ? j.photo : x));
                        alert('Assigned to WO ' + wo);
                      }
                    } catch (err) { console.error(err); alert('Assign failed'); }
                  }} style={{background:'rgba(255,255,255,0.03)', color:'#fff', border:'none', padding:'6px 8px', borderRadius:6, cursor:'pointer'}}>Assign</button>
                  <button onClick={async () => {
                    if (!confirm('Remove photo?')) return;
                    try {
                      await fetch(`/api/photos/${p.id}`, { method: 'DELETE' });
                      setPhotos(prev => prev.filter(x => x.id !== p.id));
                    } catch (err) { console.error(err); }
                  }} style={{background:'rgba(255,255,255,0.03)', color:'#fff', border:'none', padding:'6px 8px', borderRadius:6, cursor:'pointer'}}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
