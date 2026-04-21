import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, signInWithPopup, signOut, db, doc, getDoc, setDoc, collection, getDocs, query, serverTimestamp, ref, uploadBytes, getDownloadURL, storage } from '../lib/firebase';
import { motion } from 'motion/react';
import { 
  LogIn, 
  LogOut, 
  Settings, 
  BarChart, 
  Image as ImageIcon, 
  Volume2, 
  Save, 
  RefreshCcw,
  ShieldAlert,
  Ghost,
  Upload,
  FileAudio
} from 'lucide-react';

const Admin: React.FC = () => {
  const [manualIsAdmin, setManualIsAdmin] = useState(() => {
    return sessionStorage.getItem('admin_session') === 'active';
  });
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  
  const [config, setConfig] = useState({ imageUrl: '', audioUrl: '' });
  const [links, setLinks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Helper to compress and convert image to Base64 (Fits in Firestore 1MB limit)
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max width 800px for efficiency
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // High quality, low size
        };
      };
      reader.onerror = reject;
    });
  };

  // Helper for small audio files
  const processAudio = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 800000) {
         reject(new Error("Audio file too large. Please use a file under 800KB."));
         return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  useEffect(() => {
    if (manualIsAdmin) {
      fetchConfig();
      fetchLinks();
    }
  }, [manualIsAdmin]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginCreds.username === 'Riadkhan75' && loginCreds.password === '205090') {
      setManualIsAdmin(true);
      sessionStorage.setItem('admin_session', 'active');
    } else {
      alert("⚠️ INVALID_CREDENTIALS: Access Terminated.");
    }
  };

  const handleLogout = () => {
    setManualIsAdmin(false);
    sessionStorage.removeItem('admin_session');
  };

  const fetchConfig = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'config'));
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
    } catch (err) {
      console.error("Config fetch failed:", err);
    }
  };

  const fetchLinks = async () => {
    setLoadingLinks(true);
    try {
      const q = query(collection(db, 'links'));
      const querySnapshot = await getDocs(q);
      const fetchedLinks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLinks(fetchedLinks.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLinks(false);
    }
  };


  const handleSave = async () => {
    if (!manualIsAdmin) return;
    setSaving(true);
    try {
      let finalImageUrl = config.imageUrl;
      let finalAudioUrl = config.audioUrl;

      // Cloud Uplink (Direct to Cloud Database)
      if (imageFile) {
        console.log("Processing image...");
        finalImageUrl = await processImage(imageFile);
      }

      if (audioFile) {
        console.log("Processing audio...");
        try {
          finalAudioUrl = await processAudio(audioFile);
        } catch (audioErr: any) {
          alert(audioErr.message);
          setSaving(false);
          return;
        }
      }

      // Check Combined Size (Firestore Limit is 1,048,576 bytes)
      const totalSize = finalImageUrl.length + finalAudioUrl.length;
      if (totalSize > 1000000) {
        alert(`❌ ERROR: Files are too large together (${(totalSize / 1024).toFixed(0)}KB). \n\nPlease use a smaller photo or shorter audio to fit in the free cloud database.`);
        setSaving(false);
        return;
      }

      const configRef = doc(db, 'settings', 'config');
      await setDoc(configRef, {
        imageUrl: finalImageUrl,
        audioUrl: finalAudioUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setConfig({ imageUrl: finalImageUrl, audioUrl: finalAudioUrl });
      setImageFile(null);
      setAudioFile(null);
      alert("✅ SUCCESS: Photo & Audio Synced! Now check your prank link.");
    } catch (err: any) {
      console.error("Save Error:", err);
      alert("❌ UPLOAD FAILED: " + (err.message || "Please try a smaller file or check your internet."));
    } finally {
      setSaving(false);
    }
  };

  if (!manualIsAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 bg-surface p-12 rounded-3xl border border-white/5 max-w-md mx-auto">
        <div className="p-4 bg-accent/10 rounded-full shadow-[0_0_20px_rgba(102,252,241,0.2)]">
          <ShieldAlert className="w-12 h-12 text-accent" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tighter uppercase">ADMIN_LOGIN</h2>
          <p className="text-text-secondary text-[10px] uppercase tracking-widest italic">Encrypted Connection Required</p>
        </div>
        
        <form onSubmit={handleManualLogin} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-text-secondary font-bold ml-2">Username</label>
            <input 
              type="text" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent transition-colors outline-none"
              placeholder="Enter ID..."
              value={loginCreds.username}
              onChange={(e) => setLoginCreds({...loginCreds, username: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-text-secondary font-bold ml-2">Secure Pass</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent transition-colors outline-none"
              placeholder="••••••"
              value={loginCreds.password}
              onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-accent text-bg font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(102,252,241,0.2)] mt-4"
          >
            <LogIn className="w-5 h-5" />
            Establish Uplink
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-accent rounded-sm shadow-[0_0_8px_rgba(102,252,241,0.5)]" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">Authorized Level: ROOT</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-white/10 hover:border-accent text-[11px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          <div className="card bg-surface p-8 rounded-xl border border-white/5 space-y-8 shadow-xl">
            <div className="card-title text-[11px] text-text-secondary uppercase tracking-[1px] mb-6 flex justify-between items-center">
              System Configuration
              <div className="flex items-center gap-2">
                <span className="pulse w-2 h-2 bg-[#52fa7c] rounded-full shadow-[0_0_8px_#52fa7c]" />
                <span className="text-[9px] text-[#52fa7c]">SECURE</span>
              </div>
            </div>

            <div className="space-y-10">
              {/* Image Group */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-accent" />
                  Prank Image Endpoint
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={config.imageUrl}
                    onChange={e => setConfig({ ...config, imageUrl: e.target.value })}
                    placeholder="Enter manual URL..."
                    className="flex-1 bg-black/30 border border-white/5 rounded-lg px-4 py-3 text-sm font-mono text-accent outline-none focus:border-accent-dark transition-colors"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      id="image-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="image-upload" 
                      className={`h-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-colors ${imageFile ? 'text-accent border-accent/50' : ''}`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {imageFile ? 'READY' : 'UPLOAD'}
                    </label>
                  </div>
                </div>
                {imageFile && <p className="text-[9px] text-accent/70 font-mono">FILE: {imageFile.name}</p>}
              </div>

              {/* Audio Group */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-accent" />
                  Audio Matrix Path
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={config.audioUrl}
                    onChange={e => setConfig({ ...config, audioUrl: e.target.value })}
                    placeholder="Enter manual URL..."
                    className="flex-1 bg-black/30 border border-white/5 rounded-lg px-4 py-3 text-sm font-mono text-accent outline-none focus:border-accent-dark transition-colors"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      id="audio-upload" 
                      className="hidden" 
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="audio-upload" 
                      className={`h-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-colors ${audioFile ? 'text-accent border-accent/50' : ''}`}
                    >
                      <FileAudio className="w-3.5 h-3.5" />
                      {audioFile ? 'READY' : 'UPLOAD'}
                    </label>
                  </div>
                </div>
                {audioFile && <p className="text-[9px] text-accent/70 font-mono">FILE: {audioFile.name}</p>}
              </div>

              <div className="admin-preview h-[160px] w-full bg-black rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden group">
                 {config.imageUrl ? (
                   <img src={config.imageUrl} className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="text-4xl opacity-10 font-bold">👻</div>
                 )}
                 <div className="preview-label absolute top-3 left-3 text-[9px] bg-black/60 px-2 py-1 rounded border border-white/10 font-bold uppercase tracking-widest">Active Asset</div>
                 {saving && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Syncing Payload...</span>
                   </div>
                 )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-5 bg-accent text-bg font-bold uppercase tracking-widest rounded-lg hover:scale-[1.01] active:scale-95 transition-all shadow-[0_10px_20px_rgba(102,252,241,0.1)] disabled:opacity-50"
            >
              {saving ? 'Transmitting Data...' : 'Apply Global Configuration'}
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          <div className="card bg-surface p-6 rounded-xl border border-white/5 space-y-6 shadow-xl">
            <div className="card-title text-[11px] text-text-secondary uppercase tracking-[1px] flex justify-between items-center">
              Active Stats
              <button 
                onClick={fetchLinks} 
                className="text-accent hover:text-white transition-colors"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loadingLinks ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              {loadingLinks ? (
                <div className="py-10 text-center text-[10px] uppercase tracking-widest opacity-30">Retrieving Nodes...</div>
              ) : links.length === 0 ? (
                <div className="py-10 text-center text-[10px] uppercase tracking-widest opacity-20">Zero active transmissions.</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {links.map((link) => (
                    <div key={link.id} className="p-4 bg-black/20 rounded-lg border border-white/5 flex justify-between items-center group">
                      <div>
                        <div className="font-mono text-xs text-accent group-hover:text-white transition-colors">/p/{link.id}</div>
                        <div className="text-[8px] opacity-30 uppercase mt-1 tracking-widest">{link.createdAt?.toDate().toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold tracking-tighter leading-none">{link.clicks}</div>
                        <div className="text-[8px] uppercase font-bold text-text-secondary tracking-widest">Impacts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-text-secondary uppercase tracking-widest">
              <span>Total Laughs</span>
              <span className="text-accent font-bold">{links.reduce((acc, curr) => acc + (curr.clicks || 0), 0)}</span>
            </div>
          </div>

          <div className="card bg-surface p-6 rounded-xl border border-white/5">
            <div className="card-title text-[11px] text-text-secondary uppercase tracking-[1px] mb-4">Node Latency</div>
            <div className="h-[40px] flex items-end gap-1.5">
               <div className="bg-accent/30 h-[40%] flex-1 rounded-t-sm" />
               <div className="bg-accent/50 h-[70%] flex-1 rounded-t-sm" />
               <div className="bg-accent h-[100%] flex-1 rounded-t-sm" />
               <div className="bg-accent/70 h-[80%] flex-1 rounded-t-sm" />
               <div className="bg-accent/40 h-[50%] flex-1 rounded-t-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
