import { chatsState } from "atoms/chats";
import { pki, util } from "node-forge";
import { useRecoilState } from "recoil";
import { useDeepCompareCallback } from "use-deep-compare"

export default function useHandleArchiveMessage(privateKey: pki.rsa.PrivateKey | null) {

    const [chats, setChats] = useRecoilState(chatsState)

    const chatIds = chats && Object.keys(chats)

    const handleArchiveMessage = useDeepCompareCallback((encryptedMessage: Message) => {

        if (!privateKey) return

        const message = {
            ...encryptedMessage,
            content: {
                text: privateKey.decrypt(util.decode64(encryptedMessage.content.text))
            }
        }

        const { chatId } = message

        setChats(chats => ({
            ...chats,
            [chatId]:
                chatIds?.includes(chatId)
                    ? {
                        id: chatId,
                        members: [...message.to, message.sender],
                        messages: [...(chats?.[chatId].messages || []), message]
                    }
                    : {
                        ...chats![chatId],
                        messages: [
                            ...(chats![chatId].messages || []),
                            message
                        ]
                    }
        }))

    }, [privateKey, chatIds, setChats])

    return handleArchiveMessage
}