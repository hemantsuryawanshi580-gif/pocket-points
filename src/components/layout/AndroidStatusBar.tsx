import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-950/90 backdrop-blur-md text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between z-50 select-none border-b border-slate-900/60 shrink-0">
      <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
        <span>{time}</span>
      </div>

      <div className="flex items-center space-x-2 text-slate-400">
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">5G</span>
        <Signal className="w-3.5 h-3.5 text-slate-300" />
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center space-x-0.5">
          <span className="text-[10px] text-slate-400 font-mono">88%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
