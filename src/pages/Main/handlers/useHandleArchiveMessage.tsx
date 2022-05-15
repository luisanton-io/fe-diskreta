import { chatsState } from "atoms/chats";
import { pki, util } from "node-forge";
import { useRecoilState } from "recoil";
import { useDeepCompareCallback } from "use-deep-compare"

export default function useHandleArchiveMessage(privateKey: pki.rsa.PrivateKey | null) {

    const [chats, setChats] = useRecoilState(chatsState)

    const chatIds = chats && Object.keys(chats)

    const handleArchiveMessage = useDeepCompareCallback((encryptedMessage: Message) => {

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

        if (chatIds?.includes(chatId)) {
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

    }, [privateKey, chatIds, setChats])

    return handleArchiveMessage
}