import { refreshToken } from "API/refreshToken"
import { userState } from "atoms/user"
import { pki } from "node-forge"
import { SocketEcho } from "pages/Main/Chat"
import useArchiveMessage from "pages/Main/handlers/useArchiveMessage"
import useMessageStatus from "pages/Main/handlers/useMessageStatus"
import React, { useEffect, useMemo } from "react"
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

    const handleMessageStatus = useMessageStatus()

    useEffect(() => {
        if (!socket) return

        const handleArchiveMessage = (message: Message, ack: Function) => {
            archiveMessage(message, { showToast: true })
            setServerEcho((echoes) => [...echoes, {
                event: "in-msg",
                payload: message
            }])
            ack()
        }

        const handleDequeue = (messages: Message[], ack: Function) => {
            messages.forEach(msg => archiveMessage(msg, { showToast: false }))
            ack()
        }

        const handleDequeueStatus = (status: MessageStatusUpdate[], ack: Function) => {
            status.forEach(handleMessageStatus)
            ack()
        }

        const handleRefreshToken = () => {
            socket.disconnect()
            refreshToken()
        }

        const handleEcho = (payload: SocketEcho) => { setServerEcho(echoes => [...echoes, payload]) }

        socket.on('in-msg', handleArchiveMessage)
        socket.on('msg-status', handleMessageStatus)
        socket.on('dequeue', handleDequeue)
        socket.on('dequeue-status', handleDequeueStatus)
        socket.on('jwt-expired', handleRefreshToken)
        socket.on('echo', handleEcho)

        return () => {
            socket.off('in-msg', handleArchiveMessage)
            socket.off('dequeue', handleDequeue)
            socket.off('jwt-expired', handleRefreshToken)
            socket.off('echo', handleEcho)
        }

    }, [socket, archiveMessage, setServerEcho, handleMessageStatus])

    return socket
}