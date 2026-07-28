import React, { useState } from 'react';
import { Share2, Download, X, Loader2, Link as LinkIcon, Check } from 'lucide-react';
import { generateSocialShareCard, type SocialShareCardInput } from './social-share-card';
import { useToast } from '@/shared/components/toast';

interface SocialShareButtonProps {
  card: SocialShareCardInput;
  shareUrl: string;
}

// VENDOR_BACKLOG.md VND-021: "Share directly or download." Tries the native
// Web Share API with the generated image file first (works on most mobile
// browsers, hands off straight to Instagram/WhatsApp/Twitter's own share
// sheet); falls back to a direct download + platform share-intent links
// on desktop, where file sharing via navigator.share isn't supported.
const SocialShareButton: React.FC<SocialShareButtonProps> = ({ card, shareUrl }) => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const openModal = async () => {
    setShowModal(true);
    setGenerating(true);
    try {
      const blob = await generateSocialShareCard(card);
      setImageBlob(blob);
    } catch {
      toast.error('Could not generate the share image');
    } finally {
      setGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    if (!imageBlob) return;
    const file = new File([imageBlob], 'product.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: card.productName, text: `${card.productName} — ${shareUrl}` });
      } catch {
        // user cancelled the share sheet -- not an error
      }
    } else {
      toast.error('Sharing images directly is not supported on this device — download instead');
    }
  };

  const handleDownload = () => {
    if (!imageBlob) return;
    const url = window.URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.productName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-bold text-sm hover:bg-muted transition-colors"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-bold text-sm hover:bg-muted transition-colors"
        >
          <Share2 size={16} /> Create Social Post
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Share on Social</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={18} /></button>
            </div>

            {generating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-muted-foreground" />
              </div>
            ) : imageBlob ? (
              <img src={URL.createObjectURL(imageBlob)} alt="Social share preview" className="w-full rounded-xl border border-border" />
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={!imageBlob}
                className="flex-1 py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Share2 size={16} /> Share
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!imageBlob}
                className="flex-1 py-2.5 border border-border rounded-xl font-bold hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialShareButton;
