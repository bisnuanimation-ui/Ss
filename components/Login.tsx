
import React from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

const Login: React.FC = () => {
  const { signIn, signInFacebook } = useFirebase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020202] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/[0.03] border border-white/[0.08] p-12 rounded-[2.5rem] backdrop-blur-xl text-center"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <LogIn className="w-8 h-8 text-black" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
          PromptVision <span className="text-blue-500">AI</span>
        </h1>
        
        <p className="text-gray-500 text-sm mb-12 font-medium tracking-wide leading-relaxed">
          Unlock professional design insights. Login to access the vision engine.
        </p>
        
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signIn}
            className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-gray-100"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Continue with Google
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInFacebook}
            className="w-full py-5 bg-[#1877F2] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-[#166fe5]"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </motion.button>
        </div>
        
        <p className="mt-8 text-[9px] text-gray-700 font-black uppercase tracking-[0.4em]">
          Secure Authentication System / Core 5.0
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
