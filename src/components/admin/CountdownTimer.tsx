import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  createdAt: string;
  hoursLimit?: number;
}

export function CountdownTimer({ createdAt, hoursLimit = 48 }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
    percentage: number;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false, percentage: 100 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(createdAt).getTime();
      const deadline = created + hoursLimit * 60 * 60 * 1000;
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true, percentage: 0 };
      }

      const totalMs = hoursLimit * 60 * 60 * 1000;
      const percentage = (diff / totalMs) * 100;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false, percentage };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, hoursLimit]);

  const getColorClass = () => {
    if (timeLeft.expired) return "text-red-600 bg-red-50 border-red-200";
    if (timeLeft.hours < 12) return "text-red-600 bg-red-50 border-red-200";
    if (timeLeft.hours < 24) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const formatTime = () => {
    if (timeLeft.expired) return "EXPIRADO";
    const h = timeLeft.hours.toString().padStart(2, "0");
    const m = timeLeft.minutes.toString().padStart(2, "0");
    const s = timeLeft.seconds.toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono",
        getColorClass(),
        timeLeft.expired && "animate-pulse"
      )}
    >
      {timeLeft.expired ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      <span>{formatTime()}</span>
    </div>
  );
}
