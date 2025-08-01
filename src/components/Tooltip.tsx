import { useState, ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const formatContent = (text: string) => {
    const lines = text.trim().split("\n");
    return lines.map((line, index, array) => (
      <span key={index}>
        {line.trim() || "\u00A0"}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="animate-in fade-in-0 zoom-in-95 absolute bottom-full -translate-x-3/4 transform duration-200">
          <div className="relative w-48 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-normal text-white shadow-lg">
            {formatContent(content)}
          </div>
        </div>
      )}
    </div>
  );
}
