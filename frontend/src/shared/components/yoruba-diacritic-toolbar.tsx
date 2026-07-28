import React from 'react';

// COMMUNITY_BACKLOG.md FOR-008: "Yoruba language input tools for posts and
// comments (diacritical marks)". Unicode diacritics were always technically
// typeable in any textarea, but most users don't have a Yoruba keyboard
// layout installed -- this is a lightweight insert-at-cursor palette, not a
// new input method or IME.
const DIACRITIC_CHARS = [
  'ẹ', 'Ẹ', 'ọ', 'Ọ', 'ṣ', 'Ṣ', 'ń', 'Ń',
  'á', 'à', 'é', 'è', 'í', 'ì', 'ó', 'ò', 'ú', 'ù',
];

interface YorubaDiacriticToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

const YorubaDiacriticToolbar: React.FC<YorubaDiacriticToolbarProps> = ({ textareaRef, value, onChange }) => {
  const insertChar = (char: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + char);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const next = value.slice(0, start) + char + value.slice(end);
    onChange(next);
    // restore focus + cursor position after the inserted character
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + char.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="flex flex-wrap gap-1 mb-1.5" role="toolbar" aria-label="Yorùbá diacritic marks">
      {DIACRITIC_CHARS.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => insertChar(char)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-sm bg-muted/50 text-foreground hover:bg-muted transition-colors"
          title={`Insert ${char}`}
        >
          {char}
        </button>
      ))}
    </div>
  );
};

export default YorubaDiacriticToolbar;
