import { chatsState } from "atoms/chats";
import { pki, util } from "node-forge";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState } from "recoil";
import { useDeepCompareCallback } from "use-deep-compare";

export default function useArchiveMessage(privateKey: pki.rsa.PrivateKey | null) {

    const [chats, setChats] = useRecoilState(chatsState)
    const navigate = useNavigate()

    const { activeChat } = useParams()

    const chatIds = chats && Object.keys(chats)

    const archiveMessage = useDeepCompareCallback((encryptedMessage: ReceivedMessage, { showToast = true }) => {

        if (!privateKey) return

        const message = {
            ...encryptedMessage,
            content: {
                text: util.decodeUtf8(privateKey.decrypt(util.decode64(encryptedMessage.content.text)))
            }
        }

        const { chatId } = message

        setChats(chats => ({
            ...chats,
            [chatId]:
                !chatIds?.includes(chatId)
                    ? {
                        id: chatId,
                        members: [...message.to, message.sender],
                        messages: [...(chats?.[chatId]?.messages || []), message]
                    }
                    : {
                        ...chats![chatId],
                        messages: [
                            ...(chats![chatId].messages || []),
                            message
                        ]
                    }
        }))

        if (showToast && chatId !== activeChat) {
            toast.info(`${message.sender.nick}: ${message.content.text}`, {
                position: toast.POSITION.TOP_CENTER,
                onClick: () => {
                    navigate(`/${chatId}`)
                },
                icon: <></>
            })
        }

    }, [privateKey, chatIds, setChats])

    return archiveMessage
}