"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Link2, Users, Shield } from "lucide-react"

function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    if (i < 2) result += "-"
  }
  return result
}

export default function HomePage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = () => {
    setIsCreating(true)
    const roomId = generateRoomId()
    router.push(`/room/${roomId}`)
  }

  return (
    <main className="min-h-dvh flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Video className="size-6 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance mb-4">
            Instant video calls with a single link
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Create a room, share the link, and start talking. No sign-up required. 
            Connect with up to 4 people instantly.
          </p>

          <Button 
            size="lg" 
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="h-14 px-8 text-lg rounded-xl min-w-[200px]"
          >
            {isCreating ? "Creating..." : "Start a Call"}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-3">
          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="pb-2">
              <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                <Link2 className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base">Shareable Links</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate a unique link and share it with anyone. They can join instantly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="pb-2">
              <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                <Users className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base">Group Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with up to 4 people at once. Perfect for quick meetings.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="pb-2">
              <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                <Shield className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base">Peer-to-Peer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Direct connections between participants. Your video never passes through our servers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>Built with WebRTC for real-time communication</p>
      </footer>
    </main>
  )
}
