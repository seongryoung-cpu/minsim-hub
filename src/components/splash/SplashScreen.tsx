import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'exit'>('logo');
  const { settings } = useAppSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('exit');
    }, 1500);

    const exitTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, hsl(220 70% 50%), hsl(230 70% 55%))' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          {/* Logo Icon */}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center overflow-hidden">
            <img 
              src={settings?.logo_url || 'https://zdgpxmtapbviwrpcleqi.supabase.co/storage/v1/object/public/app-assets/logos/logo-1768900705056.jpg'} 
              alt="Logo" 
              className="w-14 h-14 object-contain"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {settings?.app_name || '민심잇다'}
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {settings?.app_slogan || '나의 목소리가 정치가 되는 곳'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="mt-8"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
