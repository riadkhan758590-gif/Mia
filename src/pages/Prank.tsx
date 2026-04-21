import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, firestoreIncrement } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';
import confetti from 'canvas-confetti';

const Prank: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [prankSettings, setPrankSettings] = useState<{ imageUrl: string, audioUrl: string } | null>(null);
  const [activated, setActivated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Increment count
        const linkRef = doc(db, 'links', id);
        const linkSnap = await getDoc(linkRef);
        
        if (!linkSnap.exists()) {
          setError(true);
          setLoading(false);
          return;
        }
        
        // Track the click (non-blocking)
        updateDoc(linkRef, {
          clicks: firestoreIncrement(1)
        }).catch(e => console.warn("Impact tracking limited:", e));

        // Get global settings
        const configRef = doc(db, 'settings', 'config');
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists()) {
          setPrankSettings(configSnap.data() as { imageUrl: string, audioUrl: string });
        } else {
          // Reliable Fallback defaults
          setPrankSettings({
            imageUrl: 'https://picsum.photos/seed/scary_ghost/1920/1080',
            audioUrl: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' 
          });
        }
      } catch (err) {
        console.error("Prank error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const activatePrank = () => {
    if (!prankSettings || activated) return;
    
    setActivated(true);
    
    // Play audio at maximum volume
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.muted = false; // Ensure unmuted
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error("Audio play failed:", e);
          // Retry on subsequent interaction if needed
        });
      }
    }
    
    // Physical "shake" for Android
    if (window.navigator.vibrate) {
      window.navigator.vibrate([400, 100, 400]);
    }
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff0000', '#000000', '#ffffff']
    });
  };

  if (loading) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-10 text-center">
        <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">Connection Terminated</p>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#0a0a0b] flex items-center justify-center overflow-hidden"
    >
      {/* Pre-load audio outside the conditional block */}
      <audio 
        ref={audioRef} 
        src={prankSettings?.audioUrl} 
        loop
        preload="auto"
        muted 
        playsInline 
      />

      <AnimatePresence mode="wait">
        {!activated ? (
          <motion.div
            key="input-trigger"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 2 }}
            className="w-full max-w-sm px-6 py-12 flex flex-col items-center gap-8"
          >
             <div className="w-20 h-20 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-center">
                <Play className="w-8 h-8 text-accent fill-accent" />
             </div>

             <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white uppercase sm:text-3xl">Verify Connection</h1>
                <p className="text-text-secondary text-[10px] uppercase tracking-[0.2em] font-medium leading-relaxed">
                   Enter recipient mobile number to <br/> establish secure downlink
                </p>
             </div>

             <div className="w-full space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase tracking-widest text-text-secondary font-bold ml-1">Phone Number</label>
                   <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-lg font-mono focus:border-accent transition-all outline-none text-center tracking-widest"
                   />
                </div>

                <button 
                  onClick={activatePrank}
                  className="w-full py-5 bg-accent text-bg font-bold uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(102,252,241,0.15)] flex items-center justify-center gap-2"
                >
                  Confirm & Sync
                </button>
             </div>
             <div className="text-[9px] text-text-secondary/30 uppercase tracking-widest font-mono">Build_75-Secure_Node</div>
          </motion.div>
        ) : (
          <motion.div
            key="prank"
            initial={{ opacity: 1, scale: 3 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: [0, -15, 15, -15, 15, 0],
              y: [0, 8, -8, 8, -8, 0]
            }}
            transition={{ 
              scale: { duration: 0.1, ease: "easeOut" },
              x: { duration: 0.04, repeat: 15 },
              y: { duration: 0.04, repeat: 15 }
            }}
            className="relative w-full h-full"
          >
            <img 
              src={prankSettings?.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay" />
            
            <motion.div 
              animate={{ 
                opacity: [0, 0.3, 0],
                backgroundColor: ["rgba(255,0,0,0)", "rgba(255,0,0,0.2)", "rgba(255,0,0,0)"]
              }}
              transition={{ repeat: Infinity, duration: 0.08 }}
              className="absolute inset-0"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Prank;
