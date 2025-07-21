"use client";
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AudioService from '../services/AudioService';

const AudioContext = createContext<AudioService | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioService = useMemo(() => new AudioService(), []);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {

        console.log("Initial AudioContext state:", audioService.getAudioContext().state);

        const initializeAudio = async () => {
            try {
                // Check if the audio context is suspended by the browser.
                if (audioService.isSuspended()) {
                    // Attempt to resume it. This must be triggered by a user action.
                    await audioService.resume();
                }
                // Once resumed, preload the necessary sounds.
                // This assumes your AudioService has a preloadClickSounds method.
                if (typeof audioService.preloadClickSounds === 'function') {
                    await audioService.preloadClickSounds();
                }
                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to initialize or preload audio:", error);
            }
        };

        const handleInteraction = () => {
            if (!isInitialized) {
                initializeAudio();
            }
        };

        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });

        return () => {
            audioService.stopAll();
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, [audioService, isInitialized]);

    return (
        <AudioContext.Provider value={audioService}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
