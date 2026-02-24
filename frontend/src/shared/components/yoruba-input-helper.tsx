import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface YorubaInputHelperProps {
  fieldName?: string;
}

/**
 * Yoruba Input Helper Component
 * Provides guidance on entering Yoruba text with proper diacritics
 */
const YorubaInputHelper: React.FC<YorubaInputHelperProps> = ({ fieldName = 'Yoruba text' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const diacritics = [
    { char: 'ẹ', code: 'e + dot below', example: 'ẹmi (soul)' },
    { char: 'ọ', code: 'o + dot below', example: 'ọmọ (child)' },
    { char: 'ṣ', code: 's + dot below', example: 'ṣe (to do)' },
    { char: 'à', code: 'a + grave', example: 'àgbà (elder)' },
    { char: 'á', code: 'a + acute', example: 'ágbá (bag)' },
    { char: 'è', code: 'e + grave', example: 'èdè (language)' },
    { char: 'é', code: 'e + acute', example: 'éjì (two)' },
    { char: 'ì', code: 'i + grave', example: 'ìlú (town)' },
    { char: 'í', code: 'i + acute', example: 'ígbá (calabash)' },
    { char: 'ò', code: 'o + grave', example: 'òrìṣà (deity)' },
    { char: 'ó', code: 'o + acute', example: 'óró (noise)' },
    { char: 'ù', code: 'u + grave', example: 'ùdẹ (hunter)' },
    { char: 'ú', code: 'u + acute', example: 'údẹ (hunter)' },
  ];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-muted hover:text-highlight transition-colors"
      >
        <Info className="w-3 h-3" />
        <span>How to type Yoruba diacritics</span>
      </button>

      {isExpanded && (
        <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-300">
              Yoruba Diacritic Guide for {fieldName}
            </p>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
            >
              <X className="w-3 h-3 text-blue-300" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {diacritics.map((diacritic, index) => (
              <div
                key={index}
                className="bg-white/5 rounded p-2 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-300 text-lg">{diacritic.char}</span>
                  <span className="text-blue-300/70">{diacritic.code}</span>
                </div>
                <p className="text-blue-300/60 mt-0.5">{diacritic.example}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-blue-500/20">
            <p className="text-xs text-blue-300/80">
              <strong>Tip:</strong> On mobile, long-press the base letter to see diacritic options.
              On desktop, use your system's character map or copy from this guide.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YorubaInputHelper;
