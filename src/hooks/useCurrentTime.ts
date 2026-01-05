import { useState, useEffect, useMemo } from "react";

interface CurrentTimeResult {
  now: Date;
  hour: number;
  minute: number;
  isToday: (date: Date) => boolean;
}

export function useCurrentTime(timezone?: string): CurrentTimeResult {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update immediately and then every minute
    const updateTime = () => setNow(new Date());
    
    // Calculate ms until next minute for precise sync
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
    const initialTimeout = setTimeout(() => {
      updateTime();
      // Then update every minute
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  const timeInZone = useMemo(() => {
    if (!timezone) {
      return {
        hour: now.getHours(),
        minute: now.getMinutes(),
      };
    }

    try {
      // Get time string in the specified timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      
      const parts = formatter.formatToParts(now);
      const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
      const minute = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
      
      return { hour, minute };
    } catch {
      // Fallback to local time if timezone is invalid
      return {
        hour: now.getHours(),
        minute: now.getMinutes(),
      };
    }
  }, [now, timezone]);

  const isToday = (date: Date): boolean => {
    if (!timezone) {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }

    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      
      const todayStr = formatter.format(now);
      const dateStr = formatter.format(date);
      
      return todayStr === dateStr;
    } catch {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }
  };

  return {
    now,
    hour: timeInZone.hour,
    minute: timeInZone.minute,
    isToday,
  };
}
