import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_IO_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    socket = io(url, { autoConnect: true })
  }
  return socket
}
