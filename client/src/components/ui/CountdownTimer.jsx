import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ endTime, message }) => {
   const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
   });

   useEffect(() => {
      const target = new Date(endTime).getTime();

      const interval = setInterval(() => {
         const now = new Date().getTime();
         const distance = target - now;

         if (distance < 0) {
            clearInterval(interval);
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
         } else {
            setTimeLeft({
               days: Math.floor(distance / (1000 * 60 * 60 * 24)),
               hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
               minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
               seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
         }
      }, 1000);

      return () => clearInterval(interval);
   }, [endTime]);

   return (
      <div className="border border-black p-4 bg-brand-grey/30 mt-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
         <div className="flex items-center justify-center gap-3 mb-3">
            <Timer size={14} className="text-black/40" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
               {message || "Limited Time Offer"}
            </p>
         </div>

         <div className="flex justify-center gap-4">
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Secs" />
         </div>
      </div>
   );
};

const TimeUnit = ({ value, label }) => (
   <div className="flex flex-col items-center">
      <span className="text-xl font-black tracking-tighter tabular-nums">
         {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">
         {label}
      </span>
   </div>
);

export default CountdownTimer;
