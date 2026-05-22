"use client";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
}

function renderInline(text: string): React.ReactNode[] {
  // Split on **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
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

    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Section header: line that is ONLY **text:** (bold heading)
    if (/^\*\*[^*]+\*\*\s*$/.test(trimmed) || /^\*\*[^*]+:\*\*\s*$/.test(trimmed)) {
      const headingText = trimmed.replace(/^\*\*/, "").replace(/\*\*$/, "").replace(/:$/, "");
      elements.push(
        <p key={i} className="font-bold text-gray-900 mt-3 mb-1 text-sm uppercase tracking-wide">
          {headingText}
        </p>
      );
      i++;
      continue;
    }

    // Bullet point: starts with - or •
    if (/^[-•]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-•]\s/, "");
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
          <p className="text-sm text-gray-700 leading-relaxed flex-1">{renderInline(bulletText)}</p>
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className={cn("space-y-0.5", className)}>{elements}</div>;
}
