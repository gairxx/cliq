"use client"

import { Button } from "@/components/ui/button"
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  MonitorOff,
  Link2, 
  PhoneOff 
} from "lucide-react"
import { toast } from "sonner"

interface VideoControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onStartScreenShare: () => void
  onStopScreenShare: () => void
  onLeave: () => void
  roomUrl: string
}

export function VideoControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onLeave,
  roomUrl
}: VideoControlsProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-card border-t border-border">
      {/* Audio toggle */}
      <Button
        variant={isAudioEnabled ? "secondary" : "destructive"}
        size="icon-lg"
        onClick={onToggleAudio}
        className="rounded-full"
        aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
      </Button>

      {/* Video toggle */}
      <Button
        variant={isVideoEnabled ? "secondary" : "destructive"}
        size="icon-lg"
        onClick={onToggleVideo}
        className="rounded-full"
        aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
      </Button>

      {/* Screen share toggle */}
      <Button
        variant={isScreenSharing ? "default" : "secondary"}
        size="icon-lg"
        onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
        className="rounded-full"
        aria-label={isScreenSharing ? "Stop screen sharing" : "Share screen"}
      >
        {isScreenSharing ? <MonitorOff className="size-5" /> : <MonitorUp className="size-5" />}
      </Button>

      {/* Copy link */}
      <Button
        variant="secondary"
        size="icon-lg"
        onClick={copyLink}
        className="rounded-full"
        aria-label="Copy invite link"
      >
        <Link2 className="size-5" />
      </Button>

      {/* Leave call */}
      <Button
        variant="destructive"
        size="icon-lg"
        onClick={onLeave}
        className="rounded-full"
        aria-label="Leave call"
      >
        <PhoneOff className="size-5" />
      </Button>
    </div>
  )
}
