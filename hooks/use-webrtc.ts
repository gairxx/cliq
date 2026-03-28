"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type Peer from "peerjs"
import type { MediaConnection, DataConnection } from "peerjs"

export interface PeerConnection {
  peerId: string
  stream: MediaStream | null
  dataConnection: DataConnection | null
  mediaConnection: MediaConnection | null
}

interface UseWebRTCOptions {
  roomId: string
  onPeerJoined?: (peerId: string) => void
  onPeerLeft?: (peerId: string) => void
}

export function useWebRTC({ roomId, onPeerJoined, onPeerLeft }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [myPeerId, setMyPeerId] = useState<string | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const peerRef = useRef<Peer | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, PeerConnection>>(new Map())

  // Initialize local media
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera/microphone"
      setError(errorMessage)
      throw err
    }
  }, [])

  // Connect to a peer
  const connectToPeer = useCallback((remotePeerId: string, stream: MediaStream) => {
    if (!peerRef.current || remotePeerId === peerRef.current.id) return
    if (peersRef.current.has(remotePeerId)) return

    const call = peerRef.current.call(remotePeerId, stream)
    const dataConn = peerRef.current.connect(remotePeerId)

    const peerConnection: PeerConnection = {
      peerId: remotePeerId,
      stream: null,
      dataConnection: dataConn,
      mediaConnection: call
    }

    call.on("stream", (remoteStream: MediaStream) => {
      peerConnection.stream = remoteStream
      peersRef.current.set(remotePeerId, peerConnection)
      setPeers(new Map(peersRef.current))
      onPeerJoined?.(remotePeerId)
    })

    call.on("close", () => {
      peersRef.current.delete(remotePeerId)
      setPeers(new Map(peersRef.current))
      onPeerLeft?.(remotePeerId)
    })

    peersRef.current.set(remotePeerId, peerConnection)
    setPeers(new Map(peersRef.current))
  }, [onPeerJoined, onPeerLeft])

  // Initialize PeerJS and connect to room
  const initializePeer = useCallback(async (stream: MediaStream) => {
    const PeerJS = (await import("peerjs")).default
    
    // Create peer with room-based ID prefix for discovery
    const peerId = `${roomId}-${Math.random().toString(36).substring(2, 8)}`
    const peer = new PeerJS(peerId, {
      debug: 0,
    })

    peerRef.current = peer

    peer.on("open", (id: string) => {
      setMyPeerId(id)
      setIsConnected(true)
      
      // Broadcast presence to all potential peers in the room
      // We'll try connecting to existing peers
      const roomPrefix = `${roomId}-`
      
      // Store our ID for others to discover
      if (typeof window !== "undefined") {
        const existingPeers = JSON.parse(sessionStorage.getItem(`room-${roomId}`) || "[]") as string[]
        
        // Connect to existing peers
        existingPeers.forEach((existingPeerId: string) => {
          if (existingPeerId !== id) {
            connectToPeer(existingPeerId, stream)
          }
        })
        
        // Add ourselves to the list
        existingPeers.push(id)
        sessionStorage.setItem(`room-${roomId}`, JSON.stringify(existingPeers))
      }
    })

    peer.on("call", (call: MediaConnection) => {
      call.answer(stream)
      
      const remotePeerId = call.peer

      call.on("stream", (remoteStream: MediaStream) => {
        const existing = peersRef.current.get(remotePeerId)
        const peerConnection: PeerConnection = {
          peerId: remotePeerId,
          stream: remoteStream,
          dataConnection: existing?.dataConnection || null,
          mediaConnection: call
        }
        peersRef.current.set(remotePeerId, peerConnection)
        setPeers(new Map(peersRef.current))
        onPeerJoined?.(remotePeerId)
      })

      call.on("close", () => {
        peersRef.current.delete(remotePeerId)
        setPeers(new Map(peersRef.current))
        onPeerLeft?.(remotePeerId)
      })
    })

    peer.on("connection", (conn: DataConnection) => {
      const remotePeerId = conn.peer
      conn.on("open", () => {
        const existing = peersRef.current.get(remotePeerId)
        if (existing) {
          existing.dataConnection = conn
          peersRef.current.set(remotePeerId, existing)
          setPeers(new Map(peersRef.current))
        }
      })
    })

    peer.on("error", (err: Error) => {
      console.error("PeerJS error:", err)
      if (err.message.includes("Could not connect")) {
        // Retry connection
      }
    })

    peer.on("disconnected", () => {
      setIsConnected(false)
      peer.reconnect()
    })

    return peer
  }, [roomId, connectToPeer, onPeerJoined, onPeerLeft])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsAudioEnabled(prev => !prev)
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(prev => !prev)
    }
  }, [])

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: false
      })
      
      setScreenStream(screen)
      setIsScreenSharing(true)

      // Replace video track in all peer connections
      const videoTrack = screen.getVideoTracks()[0]
      
      peersRef.current.forEach((peerConn) => {
        const sender = peerConn.mediaConnection?.peerConnection
          ?.getSenders()
          .find(s => s.track?.kind === "video")
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })

      // Handle screen share stop
      videoTrack.onended = () => {
        stopScreenShare()
      }

      return screen
    } catch (err) {
      console.error("Screen share error:", err)
      return null
    }
  }, [])

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    setIsScreenSharing(false)

    // Restore camera video track
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        peersRef.current.forEach((peerConn) => {
          const sender = peerConn.mediaConnection?.peerConnection
            ?.getSenders()
            .find(s => s.track?.kind === "video")
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        })
      }
    }
  }, [screenStream])

  // Leave room
  const leaveRoom = useCallback(() => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    screenStream?.getTracks().forEach(track => track.stop())
    
    // Close all peer connections
    peersRef.current.forEach((peerConn) => {
      peerConn.mediaConnection?.close()
      peerConn.dataConnection?.close()
    })
    
    // Destroy peer
    peerRef.current?.destroy()
    
    // Clean up session storage
    if (typeof window !== "undefined" && myPeerId) {
      const existingPeers = JSON.parse(sessionStorage.getItem(`room-${roomId}`) || "[]") as string[]
      const updatedPeers = existingPeers.filter((id: string) => id !== myPeerId)
      sessionStorage.setItem(`room-${roomId}`, JSON.stringify(updatedPeers))
    }
    
    // Reset state
    setLocalStream(null)
    setScreenStream(null)
    setPeers(new Map())
    setIsConnected(false)
    setMyPeerId(null)
  }, [screenStream, myPeerId, roomId])

  // Initialize on mount
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const stream = await initializeMedia()
        if (mounted) {
          await initializePeer(stream)
        }
      } catch (err) {
        console.error("Failed to initialize:", err)
      }
    }

    init()

    return () => {
      mounted = false
      leaveRoom()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    localStream,
    screenStream,
    peers: Array.from(peers.values()),
    isConnected,
    myPeerId,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveRoom
  }
}
