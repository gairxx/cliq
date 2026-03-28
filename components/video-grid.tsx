"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { MicOff, VideoOff } from "lucide-react"

interface VideoTileProps {
  stream: MediaStream | null
  isLocal?: boolean
  isMuted?: boolean
  isVideoOff?: boolean
  label?: string
  className?: string
}

function VideoTile({ stream, isLocal, isMuted, isVideoOff, label, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className={cn(
      "relative bg-secondary rounded-xl overflow-hidden aspect-video",
      className
    )}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "w-full h-full object-cover",
          isLocal && "transform scale-x-[-1]",
          isVideoOff && "hidden"
        )}
      />
      
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <VideoOff className="size-8 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        {label && (
          <span className="px-2 py-1 rounded-md bg-background/80 backdrop-blur text-sm font-medium">
            {label}
          </span>
        )}
        {isMuted && (
          <span className="p-1.5 rounded-md bg-destructive/90 backdrop-blur">
            <MicOff className="size-3.5 text-destructive-foreground" />
          </span>
        )}
      </div>
    </div>
  )
}

interface VideoGridProps {
  localStream: MediaStream | null
  screenStream: MediaStream | null
  peers: Array<{ peerId: string; stream: MediaStream | null }>
  isLocalAudioEnabled: boolean
  isLocalVideoEnabled: boolean
  isScreenSharing: boolean
}

export function VideoGrid({ 
  localStream, 
  screenStream, 
  peers, 
  isLocalAudioEnabled, 
  isLocalVideoEnabled,
  isScreenSharing 
}: VideoGridProps) {
  const totalParticipants = peers.length + 1 // +1 for local
  const showScreenShare = isScreenSharing && screenStream

  // Determine grid layout based on participants
  const getGridClass = () => {
    if (showScreenShare) {
      return "grid-cols-1 lg:grid-cols-[1fr_300px]"
    }
    switch (totalParticipants) {
      case 1:
        return "grid-cols-1 max-w-2xl mx-auto"
      case 2:
        return "grid-cols-1 sm:grid-cols-2"
      case 3:
        return "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
      case 4:
      default:
        return "grid-cols-2"
    }
  }

  if (showScreenShare) {
    return (
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Screen share - main view */}
        <VideoTile
          stream={screenStream}
          label="Screen"
          className="w-full h-full min-h-[300px]"
        />
        
        {/* Sidebar with participants */}
        <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto">
          <VideoTile
            stream={localStream}
            isLocal
            isMuted={!isLocalAudioEnabled}
            isVideoOff={!isLocalVideoEnabled}
            label="You"
            className="min-w-[200px] lg:min-w-0"
          />
          {peers.map((peer) => (
            <VideoTile
              key={peer.peerId}
              stream={peer.stream}
              label={peer.peerId.split("-").pop()}
              className="min-w-[200px] lg:min-w-0"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex-1 p-4 grid gap-4 auto-rows-fr",
      getGridClass()
    )}>
      <VideoTile
        stream={localStream}
        isLocal
        isMuted={!isLocalAudioEnabled}
        isVideoOff={!isLocalVideoEnabled}
        label="You"
      />
      {peers.map((peer) => (
        <VideoTile
          key={peer.peerId}
          stream={peer.stream}
          label={peer.peerId.split("-").pop()}
        />
      ))}
    </div>
  )
}
