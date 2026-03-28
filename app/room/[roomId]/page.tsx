"use client"

import { useParams, useRouter } from "next/navigation"
import { useWebRTC } from "@/hooks/use-webrtc"
import { VideoGrid } from "@/components/video-grid"
import { VideoControls } from "@/components/video-controls"
import { Toaster } from "sonner"
import { Users, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const {
    localStream,
    screenStream,
    peers,
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveRoom
  } = useWebRTC({
    roomId,
    onPeerJoined: (peerId) => {
      console.log("Peer joined:", peerId)
    },
    onPeerLeft: (peerId) => {
      console.log("Peer left:", peerId)
    }
  })

  const handleLeave = () => {
    leaveRoom()
    router.push("/")
  }

  const roomUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/room/${roomId}` 
    : ""

  // Error state
  if (error) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-4">
        <Toaster position="top-center" theme="dark" />
        <div className="text-center max-w-md">
          <div className="size-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Camera Access Required</h1>
          <p className="text-muted-foreground mb-6">
            {error}. Please allow camera and microphone access to join the call.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </main>
    )
  }

  // Loading state
  if (!localStream || !isConnected) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-4">
        <Toaster position="top-center" theme="dark" />
        <div className="text-center">
          <Loader2 className="size-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to room...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col bg-background">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Room:</span>
          <code className="px-2 py-1 rounded-md bg-secondary text-sm font-mono">
            {roomId}
          </code>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>{peers.length + 1} participant{peers.length !== 0 && "s"}</span>
        </div>
      </header>

      {/* Video Grid */}
      <VideoGrid
        localStream={localStream}
        screenStream={screenStream}
        peers={peers}
        isLocalAudioEnabled={isAudioEnabled}
        isLocalVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
      />

      {/* Controls */}
      <VideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onLeave={handleLeave}
        roomUrl={roomUrl}
      />
    </main>
  )
}
