
'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useRef } from 'react';

interface JitsiMeetProps {
    roomName: string;
    displayName: string;
    onClose: () => void;
}

export default function JitsiMeet({ roomName, displayName, onClose }: JitsiMeetProps) {
    const apiRef = useRef<any>(null);

    const handleApiReady = (api: any) => {
        apiRef.current = api;
        api.on('videoConferenceLeft', onClose);
    };

    useEffect(() => {
        return () => {
            apiRef.current?.dispose();
        };
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="flex justify-between items-center p-2 border-b">
                <h2 className="text-lg font-semibold">Video Call</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex-1">
                <JitsiMeeting
                    roomName={roomName}
                    userInfo={{ displayName }}
                    configOverwrite={{
                        startWithVideoMuted: true,
                        disableModeratorIndicator: true,
                        startScreenSharing: false,
                        enableEmailInStats: false,
                        prejoinPageEnabled: false,
                        // Hide Jitsi branding and ads
                        disableThirdPartyRequests: true,
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_POWERED_BY: false,
                    }}
                    interfaceConfigOverwrite={{
                        // Hide more UI elements
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'desktop', 'hangup', 'profile',
                            'chat', 'settings', 'raisehand', 'videoquality', 'filmstrip',
                            'tileview'
                        ],
                        SETTINGS_SECTIONS: [
                            'devices', 'language', 'moderator', 'profile'
                        ],
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_POWERED_BY: false,
                        APP_NAME: 'VoxaLo Connect',
                        NATIVE_APP_NAME: 'VoxaLo Connect',
                    }}
                    onApiReady={handleApiReady}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                    }}
                />
            </div>
        </div>
    );
}
