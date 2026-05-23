"use client";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
}

/** Render inline markdown: **bold**, *italic* */
function renderInline(text: string): React.ReactNode[] {
  // Split on **bold** or *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic text-gray-700 dark:text-gray-300">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownText({ text, className }: Props) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line — small spacer
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // ### / ## / # Heading
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const headingText = hMatch[2];
      elements.push(
        <p key={i} className={cn(
          "font-black tracking-tight mt-3 mb-1",
          level === 1 && "text-base text-gray-900 dark:text-white",
          level === 2 && "text-sm text-gray-900 dark:text-white",
          level === 3 && "text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-widest",
        )}>
          {headingText}
        </p>
      );
      i++;
      continue;
    }

    // Standalone bold heading: **text** or **text:**
    if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
      const headingText = trimmed.replace(/^\*\*/, "").replace(/\*\*:?\s*$/, "");
      elements.push(
        <p key={i} className="font-bold text-gray-900 dark:text-white text-sm mt-3 mb-0.5">
          {headingText}
        </p>
      );
      i++;
      continue;
    }

    // Numbered list item: "1." or "1)" or "1. **Term:**"
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      const num = numMatch[1];
      const content = numMatch[2];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center mt-0.5">
            {num}
          </span>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
            {renderInline(content)}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // Bullet point: - or • or *
    if (/^[-•*]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-•*]\s/, "");
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 flex-shrink-0 mt-[7px]" />
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
            {renderInline(bulletText)}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-0.5">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className={cn("space-y-0", className)}>{elements}</div>;
}
