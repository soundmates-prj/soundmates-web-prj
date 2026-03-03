import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export interface PlayerTrack {
    title: string;
    artist: string;
    album?: string;
    artUrl: string;
    duration: number;
    elapsed: number;
    listenUrl?: string;
}

interface PlayerContextValue {
    track: PlayerTrack | null;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
    setTrack: (track: PlayerTrack) => void;
    toggle: () => void;
    setVolume: (v: number) => void;
    toggleMute: () => void;
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [track, setTrackState] = useState<PlayerTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const setTrack = useCallback((newTrack: PlayerTrack) => {
        setTrackState(newTrack);
        // If the listen URL changed, reset the audio element so it re-connects
        if (audioRef.current && newTrack.listenUrl) {
            const nextSrc = newTrack.listenUrl.replace(/^https?:\/\/[^/]+/, '');
            if (audioRef.current.src !== window.location.origin + nextSrc) {
                audioRef.current.pause();
                audioRef.current = null;
                setIsPlaying(false);
            }
        }
    }, []);

    const toggle = useCallback(() => {
        if (!track?.listenUrl) return;
        if (!audioRef.current) {
            // First time: connect to the live stream and start playing
            const src = track.listenUrl.replace(/^https?:\/\/[^/]+/, '');
            audioRef.current = new Audio(src);
            audioRef.current.volume = volume / 100;
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
            setIsMuted(false);
        } else {
            // Stream is already running — just toggle mute, never pause/stop
            const next = !isMuted;
            setIsMuted(next);
            audioRef.current.volume = next ? 0 : volume / 100;
        }
    }, [track, isMuted, volume]);

    const setVolume = useCallback((v: number) => {
        setVolumeState(v);
        setIsMuted(v === 0);
        if (audioRef.current) audioRef.current.volume = v / 100;
    }, []);

    const toggleMute = useCallback(() => {
        const next = !isMuted;
        setIsMuted(next);
        if (audioRef.current) audioRef.current.volume = next ? 0 : volume / 100;
    }, [isMuted, volume]);

    return (
        <PlayerContext.Provider value={{ track, isPlaying, volume, isMuted, setTrack, toggle, setVolume, toggleMute, audioRef }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
    return ctx;
};
