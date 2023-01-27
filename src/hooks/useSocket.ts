import { refreshToken } from "API/refreshToken"
import { focusState } from "atoms/focus"
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

    const hasFocus = useRecoilValue(focusState)

    const socket = useMemo(() => {
        return !!token && hasFocus && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token } })
    }, [token, hasFocus])

    useEffect(() => {
        return () => {
            socket && socket.disconnect()
        }
    }, [socket, hasFocus])

    const archiveMessage = useArchiveMessage(privateKey)

    const handleMessageStatus = useMessageStatus()

    useEffect(() => {
        if (!socket) return

        const handleArchiveMessage = (message: ReceivedMessage, ack: Function) => {
            try {
                archiveMessage(message, { showToast: true })
                setServerEcho(echoes => [...echoes, {
                    event: "in-msg",
                    payload: message
                }])
                ack()
            } catch (error) {
                ack((error as Error).message)
            }
        }

        const handleDequeue = (queue: Queue, ack: Function) => {
            try {
                console.log(queue)
                const { messages = [], status = [] } = queue || {}
                messages.forEach(msg => archiveMessage(msg, { showToast: false }))
                status.forEach(handleMessageStatus)
                ack()
            } catch (error) {
                ack((error as Error).message)

            }
        }

        const handleRefreshToken = () => {
            socket.disconnect()
            refreshToken()
        }

        const handleEcho = (payload: SocketEcho) => { setServerEcho(echoes => [...echoes, payload]) }

        socket.on('in-msg', handleArchiveMessage)
        socket.on('msg-status', handleMessageStatus)
        socket.on('dequeue', handleDequeue)
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