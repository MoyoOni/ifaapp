import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Loader2, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface DigitalDownload {
  id: string;
  productId: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string;
  product: { id: string; name: string; images: string[] };
}

// VENDOR_BACKLOG.md VND-024: "customer gets download link (valid 30 days,
// max 5 downloads)." Nothing surfaced these grants anywhere before this --
// this is the customer's entry point to them.
const MyDownloadsView: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const { data: downloads = [], isLoading } = useQuery<DigitalDownload[]>({
    queryKey: ['my-digital-downloads'],
    queryFn: async () => (await api.get('/marketplace/my-downloads')).data,
  });

  const downloadMutation = useMutation({
    mutationFn: async (downloadId: string) => (await api.post(`/marketplace/downloads/${downloadId}/url`)).data as { url: string; fileName: string | null },
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to get download link'),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div>
        <button onClick={() => navigate('/my-orders')} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">
          ← My Orders
        </button>
        <h1 className="text-3xl font-bold brand-font text-foreground">My Downloads</h1>
        <p className="text-muted-foreground">Digital products you've purchased</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : downloads.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No digital purchases yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((d) => {
            const expired = new Date(d.expiresAt) < new Date();
            const exhausted = d.downloadCount >= d.maxDownloads;
            const disabled = expired || exhausted || downloadMutation.isPending;
            return (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-foreground">{d.product.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock size={12} /> {d.downloadCount}/{d.maxDownloads} downloads used · expires {new Date(d.expiresAt).toLocaleDateString()}
                  </p>
                  {expired && <p className="text-xs font-bold text-red-500 mt-1">Expired</p>}
                  {!expired && exhausted && <p className="text-xs font-bold text-red-500 mt-1">Download limit reached</p>}
                </div>
                <button
                  type="button"
                  onClick={() => downloadMutation.mutate(d.id)}
                  disabled={disabled}
                  className="px-4 py-2 bg-highlight text-foreground rounded-xl text-sm font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {downloadMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Download
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDownloadsView;
