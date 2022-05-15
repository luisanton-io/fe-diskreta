import { refreshToken } from "API/refreshToken"
import { userState } from "atoms/user"
import { pki } from "node-forge"
import useHandleArchiveMessage from "pages/Main/handlers/useHandleArchiveMessage"
import { useEffect, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { io } from "socket.io-client"

export default function useSocket() {

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

    const handleArchiveMessage = useHandleArchiveMessage(privateKey)

    useEffect(() => {
        if (!socket) return

        const handleDequeue = (messages: Message[]) => {
            messages.forEach(handleArchiveMessage)
        }

        socket.on('in-msg', handleArchiveMessage)
        socket.on('dequeue', handleDequeue)
        socket.on('jwt-expired', refreshToken)

        return () => {
            socket.off('in-msg', handleArchiveMessage)
            socket.off('dequeue', handleDequeue)
            socket.off('jwt-expired', refreshToken)
        }

    }, [socket, handleArchiveMessage])

    return socket
}