
import React from 'react';
import { motion } from 'motion/react';
import { Lock, Zap, MessageCircle, Copy } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

const SubscriptionWall: React.FC = () => {
  const { user } = useFirebase();
  const token = user?.subscription?.token || 'GENERATING...';

  const copyToken = () => {
    navigator.clipboard.writeText(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020202] px-6 py-20 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white/[0.02] border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-3xl text-center relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(59,130,246,0.3)] border border-blue-400/20">
          <Zap className="w-10 h-10 text-white fill-white" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">
          Premium Access <span className="text-blue-500">Required</span>
        </h1>
        
        <p className="text-gray-400 text-sm mb-12 font-medium tracking-wide leading-relaxed">
          Unlock high-fidelity AI vision, professional prompt generation, and unlimited design analysis. Your account requires authorization.
        </p>

        <div className="space-y-6 mb-12 text-left">
          <div className="flex items-start gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1 italic">Activation Token</p>
              <div className="flex items-center gap-3">
                <code className="text-lg font-mono text-blue-400 tracking-tighter">{token}</code>
                <button onClick={copyToken} className="hover:text-white text-gray-500 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1 italic">Contact Administrator</p>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
                Send your token via WhatsApp or SMS to activate: <br/>
                <span className="text-white mt-1 block">1 Month / 3 Months / 1 Year</span>
              </p>
            </div>
          </div>
        </div>
        
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] text-gray-400"
        >
          Awaiting Authorization Signal...
        </motion.div>
        
        <p className="mt-10 text-[9px] text-gray-800 font-black uppercase tracking-[0.5em]">
          Vision Core 5.1 / Unified Security Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default SubscriptionWall;
