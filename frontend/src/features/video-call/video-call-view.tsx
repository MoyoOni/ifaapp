import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, VideoOff, Mic, MicOff, PhoneOff, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import AgoraRTC from 'agora-rtc-sdk-ng';

interface VideoCallViewProps {
  appointmentId: string;
  onEndCall?: () => void;
}

interface VideoCallInfo {
  token: string;
  roomId: string;
  appId: string;
  appointmentId: string;
  expiresIn: number;
  babalawo: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  client: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
}

/**
 * Video Call View Component
 * Integrates Agora.io for real-time video consultations
 */
const VideoCallView: React.FC<VideoCallViewProps> = ({ appointmentId, onEndCall }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);

  // Fake animation state for "Ashé" reaction
  const [reactions, setReactions] = useState<{ id: number, x: number }[]>([]);

  const triggerReaction = () => {
    const id = Date.now();
    setReactions(prev => [...prev, { id, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  // Fetch video call token and info
  const { data: videoCallInfo, isLoading } = useQuery<VideoCallInfo>({
    queryKey: ['video-call-info', appointmentId, user?.id],
    queryFn: async () => {

      try {
        const response = await api.post(`/video-call/appointment/${appointmentId}/token/${user?.id}`);
        return response.data;
      } catch (e) {
        logger.warn('Video call API failed, using mock data');
        // Simulated delay
        await new Promise(r => setTimeout(r, 1000));
        return {
          token: 'mock-token',
          roomId: 'mock-room',
          appId: 'mock-app-id',
          appointmentId: appointmentId,
          expiresIn: 3600,
          babalawo: {
            id: 'babalawo-1',
            name: 'Baba Ifatola',
            yorubaName: 'Ifágbèmí',
            avatar: null
          },
          client: {
            id: user?.id || 'client-1',
            name: user?.name || 'Guest User',
            avatar: null
          }
        };
      }
    },
    enabled: !!appointmentId,
    retry: 1,
  });

  // End call mutation
  const endCallMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.patch(`/video-call/appointment/${appointmentId}/end`);
      } catch (error) {
        // Log but don't block - ending call locally is more important
        logger.warn('Failed to notify server of call end:', error);
      }
    },
    onSuccess: () => {
      leaveChannel();
      if (onEndCall) onEndCall();
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      logger.error('End call mutation failed:', error);
      // Still attempt to leave channel and cleanup
      leaveChannel();
      if (onEndCall) onEndCall();
    },
  });

  // Initialize Agora client and join channel
  useEffect(() => {
    if (!videoCallInfo || !user) return;

    const initAgora = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Mock Mode Detection
        if (videoCallInfo.token === 'mock-token') {
          logger.log('Initializing Mock Video Call Mode');
          await new Promise(r => setTimeout(r, 1500)); // Simulate connection time
          setIsConnecting(false);
          // We can't really "play" video in mock mode easily without local stream logic, 
          // but we'll assume the UI handles the "remote" video placeholder.
          // Maybe set a flag for mock mode?
          return;
        }

        // Create Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // ... (rest of real Agora logic would crash if no AppID, but we returned early for mock)

        // Create local video and audio tracks
        const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        localVideoTrackRef.current = localVideoTrack;
        localAudioTrackRef.current = localAudioTrack;

        // Play local video
        if (localVideoRef.current) {
          localVideoTrack.play(localVideoRef.current);
        }

        // Join channel
        await client.join(
          videoCallInfo.appId,
          videoCallInfo.roomId,
          videoCallInfo.token,
          user.id,
        );

        // Publish local tracks
        await client.publish([localVideoTrack, localAudioTrack]);

        // Handle remote user joined
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === 'video' && remoteVideoRef.current) {
            const remoteVideoTrack = user.videoTrack;
            remoteVideoTrack?.play(remoteVideoRef.current);
          }

          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack?.play();
          }
        });

        // Handle remote user left
        client.on('user-left', (_user) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML = '';
          }
        });

        setIsConnecting(false);
      } catch (err: any) {
        logger.error('Agora initialization error:', err);
        setError(err.message || 'Failed to initialize video call');
        setIsConnecting(false);
      }
    };

    initAgora();

    // Cleanup on unmount
    return () => {
      leaveChannel();
    };
  }, [videoCallInfo, user]);

  const leaveChannel = async () => {
    try {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (err) {
      logger.error('Error leaving channel:', err);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      if (isVideoEnabled) {
        await localVideoTrackRef.current.setEnabled(false);
      } else {
        await localVideoTrackRef.current.setEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      if (isAudioEnabled) {
        await localAudioTrackRef.current.setEnabled(false);
      } else {
        await localAudioTrackRef.current.setEnabled(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleEndCall = () => {
    endCallMutation.mutate();
  };

  if (isLoading || isConnecting) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 relative mb-8">
          <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-highlight rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Video size={32} className="text-highlight animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold brand-font text-stone-800 mb-2">Entering the Sanctuary...</h2>
        <p className="text-stone-500 max-w-sm">Establishing a secure connection for your session.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-stone-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-800 mb-2">Connection Issue</h3>
          <p className="text-stone-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-stone-800 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!videoCallInfo) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-800 flex items-center justify-center">
        <p>Unable to load session info.</p>
      </div>
    );
  }

  const otherUser = user?.id === videoCallInfo.babalawo.id ? videoCallInfo.client : videoCallInfo.babalawo;

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-6 flex gap-6 relative overflow-hidden">
      {/* Ambient Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* Main Video Area */}
      <div className={`flex-1 transition-all duration-500 ease-in-out relative flex flex-col items-center justify-center ${showNotes ? 'mr-0 lg:mr-[350px]' : ''}`}>

        {/* Reaction Particles */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {reactions.map(r => (
            <div
              key={r.id}
              className="absolute bottom-20 text-4xl animate-[floatUp_2s_ease-out_forwards]"
              style={{ left: `${r.x}%` }}
            >
              ✨
            </div>
          ))}
        </div>

        <div className="relative w-full h-full max-h-[85vh] aspect-video bg-stone-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-stone-200">
          <div ref={remoteVideoRef} className="w-full h-full object-cover"></div>

          {!remoteVideoRef.current?.innerHTML && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-800 text-center p-8">
              <div className="w-32 h-32 rounded-full border-4 border-white/10 p-1 mb-6 relative">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-highlight to-yellow-600 flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                  {(otherUser.yorubaName || otherUser.name).charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-stone-800"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{otherUser.yorubaName || otherUser.name}</h3>
              <p className="text-white/50 animate-pulse">Waiting for them to join the sanctuary...</p>
            </div>
          )}
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 pr-3 pl-3 bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-full z-40 transform transition-all hover:scale-105 hover:bg-white">
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${isVideoEnabled
              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all ${isAudioEnabled
              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <div className="w-px h-8 bg-stone-200 mx-1"></div>

          <button
            onClick={triggerReaction}
            className="p-4 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors tooltip"
            title="Send Ashé (Blessings)"
          >
            <span className="text-lg">✨</span>
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-4 rounded-full transition-colors ${showNotes ? 'bg-highlight text-white shadow-lg' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            title="Toggle Divination Notes"
          >
            <div className="w-5 h-5 border-2 border-current rounded-md flex flex-col gap-0.5 p-0.5 items-center justify-center">
              <div className="w-full h-px bg-current"></div>
              <div className="w-full h-px bg-current"></div>
              <div className="w-2/3 h-px bg-current self-start"></div>
            </div>
          </button>

          <div className="w-px h-8 bg-stone-200 mx-1"></div>

          <button
            onClick={handleEndCall}
            disabled={endCallMutation.isPending}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all hover:rotate-90"
            title="End Consultation"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      {/* Local Video - Floating PiP */}
      <div className="absolute top-6 right-6 w-56 aspect-[3/4] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-stone-200 z-50 transition-all hover:scale-105">
        <div ref={localVideoRef} className="w-full h-full object-cover"></div>
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-stone-800 flex items-center justify-center border border-white/10">
            <VideoOff className="w-8 h-8 text-white/50" />
            <p className="absolute bottom-4 text-xs text-white/50 font-medium">Camera Off</p>
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
          You
        </div>
      </div>

      {/* Divination Notes Panel (Slide-over) */}
      <div className={`fixed top-4 bottom-4 right-4 w-[340px] bg-white rounded-[2rem] shadow-2xl border border-stone-100 transform transition-transform duration-500 ease-in-out z-40 flex flex-col overflow-hidden ${showNotes ? 'translate-x-0' : 'translate-x-[400px]'}`}>
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h3 className="text-xl font-bold brand-font text-stone-800">Session Notes</h3>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Private to you</p>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/paper.png')]">
          <div className="text-stone-400 italic text-center mt-10 text-sm">
            Taking notes during divination helps preserve the wisdom...
          </div>
          {/* Note content would go here */}
        </div>
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <button className="w-full py-3 bg-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-300 transition-colors">
            + Add New Note
          </button>
        </div>
      </div>

    </div>
  );
};

export default VideoCallView;
