import { refreshToken } from "API/refreshToken"
import { userState } from "atoms/user"
import { pki } from "node-forge"
import { SocketEcho } from "pages/Main/Chat"
import useArchiveMessage from "pages/Main/handlers/useArchiveMessage"
import React, { useEffect, useMemo } from "react"
import { toast } from "react-toastify"
import { useRecoilValue } from "recoil"
import { io } from "socket.io-client"

export default function useSocket(setServerEcho: React.Dispatch<React.SetStateAction<SocketEcho[]>>) {

    const user = useRecoilValue(userState)
    const privateKey = (() => {
        try {
            return pki.privateKeyFromPem(user?.privateKey ?? '')
        } catch {
            return null
        }
    })()

    const { token } = user || {}

    const socket = useMemo(() => {
        const socket = !!token && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token } })
        // console.log({ socket })
        return socket
    }, [token])

    const archiveMessage = useArchiveMessage(privateKey)

    useEffect(() => {
        if (!socket) return

        const handleArchiveMessage = (message: Message) => {
            archiveMessage(message)
            setServerEcho((echoes) => [...echoes, {
                event: "in-msg",
                payload: message
            }])
        }

        const handleDequeue = (messages: Message[]) => {
            messages.forEach(archiveMessage)
            toast.dismiss()
        }

        const handleRefreshToken = () => {
            socket.disconnect()
            refreshToken()
        }

        const handleEcho = (payload: SocketEcho) => { setServerEcho(echoes => [...echoes, payload]) }

        socket.on('in-msg', handleArchiveMessage)
        socket.on('dequeue', handleDequeue)
        socket.on('jwt-expired', handleRefreshToken)
        socket.on('echo', handleEcho)

        return () => {
            socket.off('in-msg', handleArchiveMessage)
            socket.off('dequeue', handleDequeue)
            socket.off('jwt-expired', handleRefreshToken)
            socket.off('echo', handleEcho)
        }

    }, [socket, archiveMessage, setServerEcho])

    return socket
}