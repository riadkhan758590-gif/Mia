import React, { useState } from 'react';
import { db, setDoc, doc, serverTimestamp } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Copy, Share2, Wand2, Check, ExternalLink } from 'lucide-react';

const Home: React.FC = () => {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    const id = Math.random().toString(36).substring(2, 8);
    const linkPath = `/p/${id}`;
    
    try {
      await setDoc(doc(db, 'links', id), {
        id,
        createdAt: serverTimestamp(),
        clicks: 0
      });
      
      const fullUrl = `${window.location.origin}${linkPath}`;
      setGeneratedLink(fullUrl);
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to generate link. Make sure Firebase is configured correctly.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (generatedLink) {
      window.open(`https://wa.me/?text=${encodeURIComponent('Check this out! 😂 ' + generatedLink)}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 max-w-xl"
      >
        <div className="hero-text">
          <h1 className="text-[48px] font-bold leading-[1.1] mb-3 tracking-tight">
            Launch Your Best <span className="text-accent italic">Prank</span> Yet.
          </h1>
          <p className="text-text-secondary text-lg font-normal max-w-[450px] mx-auto">
            Generate secure, single-use links that deliver high-impact, harmless reactions instantly.
          </p>
        </div>
      </motion.div>

      <div className="relative group">
        <button
          onClick={generateLink}
          disabled={loading}
          className="px-9 py-5 bg-accent text-bg font-extrabold text-lg uppercase tracking-wider rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(102,252,241,0.15)] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-bg/20 border-t-bg rounded-full animate-spin mx-auto" />
          ) : (
            'Generate Prank Link'
          )}
        </button>
      </div>

      <AnimatePresence>
        {generatedLink && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-[400px] p-6 bg-white/[0.03] border border-dashed border-accent-dark rounded-lg"
          >
            <div className="text-[10px] opacity-50 mb-2 font-bold tracking-widest uppercase">Generated URL</div>
            <div className="font-mono text-accent text-lg mb-6 break-all">
              {generatedLink.replace('https://', '').replace('http://', '')}
            </div>

            <div className="flex justify-center gap-3">
              <div className="flex gap-3 items-center">
                <button
                  onClick={shareWhatsApp}
                  className="w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs hover:border-accent transition-colors"
                  title="WhatsApp"
                >
                  WA
                </button>
                <div className="w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs hover:border-accent transition-colors">
                  MS
                </div>
                <div className="w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs hover:border-accent transition-colors">
                  TG
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-4 h-9 rounded bg-surface border border-white/10 text-[11px] font-bold uppercase tracking-wider hover:border-accent transition-colors"
                >
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
