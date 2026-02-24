import React, { useState } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Textarea } from '../../shared/components/ui/textarea';
import { Label } from '../../shared/components/ui/label';
import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';

type GuidancePlanItem = {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'image' | 'video' | 'document';
  durationMinutes: number;
  contentUrl?: string;
  preview?: string;
};

type FormData = {
  title: string;
  description: string;
  estimatedCompletionDays: number;
  items: GuidancePlanItem[];
};

const GuidancePlanCreationView = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    estimatedCompletionDays: 7,
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<Omit<GuidancePlanItem, 'id'>>({
    title: '',
    description: '',
    type: 'text',
    durationMinutes: 10,
    contentUrl: '',
    preview: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();

  const handleAddItem = () => {
    if (!currentItem.title.trim()) return;

    const newItem: GuidancePlanItem = {
      ...currentItem,
      id: Date.now().toString(), // Simple ID generation for demo
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });

    // Reset current item form
    setCurrentItem({
      title: '',
      description: '',
      type: 'text',
      durationMinutes: 10,
      contentUrl: '',
      preview: '',
    });
  };

  const handleRemoveItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id),
    });
  };

  const getTotalDuration = () => {
    return formData.items.reduce((sum, item) => sum + item.durationMinutes, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform our data to match the backend format
      const payload = {
        type: 'SPIRITUAL_GUIDANCE', // Default type
        title: formData.title,
        description: formData.description,
        items: formData.items.map((item, index) => ({
          type: item.type.toUpperCase(), // Convert to uppercase for backend
          title: item.title,
          description: item.description,
          durationMinutes: item.durationMinutes,
          content: item.contentUrl || '', // Use contentUrl as content field
          order: index
        })),
        estimatedCompletionDays: formData.estimatedCompletionDays,
        isTemplate: false // Default value
      };

      // Submit to API
      await api.post(`/guidance-plans/${user?.id}`, payload);

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      logger.error('Error submitting guidance plan:', error);
      setIsSubmitting(false);
      // Here you would typically show an error message to the user
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      estimatedCompletionDays: 7,
      items: [],
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-background/20 border border-border/30 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-highlight/10 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-highlight" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Guidance Plan Created Successfully!</h3>
            <p className="text-muted">
              Your guidance plan has been submitted for review
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-background/50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{formData.title}</h3>
              <p className="text-muted mb-4">{formData.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{getTotalDuration()} mins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{formData.estimatedCompletionDays} days</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText size={16} />
                  <span>{formData.items.length} steps</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="bg-background/30 rounded-lg p-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-white">Step {index + 1}: {item.title}</h4>
                    <span className="text-muted">{item.durationMinutes} mins</span>
                  </div>
                  <p className="text-muted text-sm mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={resetForm}
              className="bg-highlight text-foreground hover:bg-highlight/90 px-6 py-2 rounded-lg"
            >
              Create Another Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Guidance Plan</h1>
        <p className="text-muted">
          Design a personalized spiritual guidance plan for clients
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-background/20 border border-border/30 rounded-xl p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Plan Details</h2>
            <p className="text-muted">
              Provide the basic information for the guidance plan
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Plan Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter a descriptive title..."
                className="bg-background/20 border-border/30 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose and goals of this guidance plan..."
                className="bg-background/20 border-border/30 text-white"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration" className="text-white">Estimated Completion (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.estimatedCompletionDays}
                  onChange={(e) => setFormData({ ...formData, estimatedCompletionDays: parseInt(e.target.value) || 1 })}
                  className="bg-background/20 border-border/30 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Total Duration</Label>
                <div className="bg-background/20 border border-border/30 rounded-md p-3 text-muted">
                  {getTotalDuration()} minutes across {formData.items.length} steps
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background/20 border border-border/30 rounded-xl p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Plan Steps</h2>
            <p className="text-muted">
              Add individual steps to guide the recipient through the plan
            </p>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-white">Add New Step</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="step-title" className="text-white">Title</Label>
                  <Input
                    id="step-title"
                    value={currentItem.title}
                    onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                    placeholder="Step title..."
                    className="bg-background/20 border-border/30 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="step-duration" className="text-white">Duration (minutes)</Label>
                  <Input
                    id="step-duration"
                    type="number"
                    min="1"
                    value={currentItem.durationMinutes}
                    onChange={(e) => setCurrentItem({ ...currentItem, durationMinutes: parseInt(e.target.value) || 1 })}
                    className="bg-background/20 border-border/30 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="step-description" className="text-white">Description</Label>
                <Textarea
                  id="step-description"
                  value={currentItem.description}
                  onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                  placeholder="Describe what the recipient should do in this step..."
                  className="bg-background/20 border-border/30 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="step-type" className="text-white">Content Type</Label>
                  <select
                    id="step-type"
                    value={currentItem.type}
                    onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value as any })}
                    className="w-full bg-background/20 border border-border/30 rounded-md p-3 text-white"
                  >
                    <option value="text">Text/Instruction</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                </div>

                {(currentItem.type === 'image' || currentItem.type === 'video' || currentItem.type === 'document') && (
                  <div>
                    <Label htmlFor="content-url" className="text-white">Content URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="content-url"
                        value={currentItem.contentUrl || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, contentUrl: e.target.value })}
                        placeholder="Paste URL or upload..."
                        className="bg-background/20 border-border/30 text-white flex-grow"
                      />
                      <Button type="button" variant="secondary" className="bg-highlight/20 hover:bg-highlight/30 text-highlight">
                        <Upload size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="w-full md:w-auto bg-highlight/10 hover:bg-highlight/20 text-highlight border-highlight/30"
              >
                <Plus size={16} className="mr-2" />
                Add Step
              </Button>
            </div>

            {formData.items.length > 0 && (
              <div className="mt-8">
                <h3 className="font-medium text-white mb-4">Added Steps</h3>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-background/10 p-3 rounded-lg border border-border/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${item.type === 'text' ? 'bg-blue-500/20 text-blue-400' : ''} ${item.type === 'image' ? 'bg-green-500/20 text-green-400' : ''} ${item.type === 'video' ? 'bg-purple-500/20 text-purple-400' : ''} ${item.type === 'document' ? 'bg-yellow-500/20 text-yellow-400' : ''}`}>
                          {item.type === 'text' && <FileText size={16} />}
                          {item.type === 'image' && <ImageIcon size={16} />}
                          {item.type === 'video' && <Video size={16} />}
                          {item.type === 'document' && <FileText size={16} />}
                        </div>
                        <div>
                          <p className="text-white font-medium">Step {index + 1}: {item.title}</p>
                          <p className="text-xs text-muted">{item.durationMinutes} minutes</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-border/30 text-muted hover:bg-background/20"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                estimatedCompletionDays: 7,
                items: [],
              });
            }}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            className="bg-highlight text-foreground hover:bg-highlight/90 px-6"
            disabled={isSubmitting || formData.items.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Plan...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} className="mr-2" />
                Create Guidance Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GuidancePlanCreationView;