import { chatsState } from "atoms/chats";
import { pki, util } from "node-forge";
import { useCallback } from "react";
import { useRecoilState } from "recoil";

export default function useHandleArchiveMessage(privateKey: pki.rsa.PrivateKey | null) {

    const [chats, setChats] = useRecoilState(chatsState)

    const handleArchiveMessage = useCallback((encryptedMessage: Message) => {

        if (!privateKey) return

        // console.table({ encryptedMessage })
        const message = {
            ...encryptedMessage,
            content: {
                text: privateKey.decrypt(util.decode64(encryptedMessage.content.text))
            }
        }

        // console.table({ message })

        const { chatId } = message

        if (!chats?.[chatId]) {
            setChats(chats => ({
                ...chats,
                [chatId]: {
                    id: chatId,
                    messages: [...(chats?.[chatId].messages || []), message],
                    members: [...message.to, message.sender]
                }
            }))

        } else {

            setChats(chats => ({
                ...chats,
                [chatId]: {
                    ...chats![chatId],
                    messages: [
                        ...(chats![chatId].messages || []),
                        message
                    ]
                }
            }))
        }

    }, [privateKey, JSON.stringify(chats), setChats])

    return handleArchiveMessage
}