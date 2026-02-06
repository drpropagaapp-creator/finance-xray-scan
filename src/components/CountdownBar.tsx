import { useState, useEffect } from "react";

const CountdownBar = () => {
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm">
      <span>Essa oferta acaba em </span>
      <span className="font-semibold">
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
      <span className="mx-2">•</span>
      <span className="line-through opacity-70">R$ 199,00</span>
      <span className="ml-2 font-semibold">por R$ 99,00</span>
    </div>
  );
};

export default CountdownBar;
