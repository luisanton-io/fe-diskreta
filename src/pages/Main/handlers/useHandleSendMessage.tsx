import { chatsState } from "atoms/chats"
import { userState } from "atoms/user"
import { pki, util } from "node-forge"
import React from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { Socket } from "socket.io-client"
import maskUser from "util/maskUser"

export default function useHandleSendMessage(socket: Socket | null, recipients: User[] | false, activeChat?: string) {

    const setChats = useSetRecoilState(chatsState)
    const user = useRecoilValue(userState)

    const handleSendMessage = (text: string, setText: React.Dispatch<React.SetStateAction<string>>) => (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (recipients && socket && activeChat) {
            const message: Message = {
                sender: maskUser(user)!,
                to: recipients,
                chatId: activeChat,
                content: { text },
                timestamp: Date.now()
            }

            setChats(chats => ({
                ...chats,
                [activeChat]: {
                    ...chats![activeChat],
                    messages: [
                        ...chats![activeChat].messages,
                        message
                    ]
                }
            }))

            for (const recipient of recipients) {

                const publicKey = pki.publicKeyFromPem(recipient.publicKey)

                socket.emit("out-msg", {
                    ...message,
                    content: {
                        text: util.encode64(publicKey.encrypt(text))
                    }
                })
            }

            setText('')

        }

    }

    return handleSendMessage
}