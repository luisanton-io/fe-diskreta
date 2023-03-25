import { chatsState } from "atoms/chats";
import { AES, enc } from "crypto-js";
import useActiveChat from "hooks/useActiveChat";
import usePrivateKey from "hooks/usePrivateKey";
import { util } from "node-forge";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState } from "recoil";
import { useDeepCompareCallback } from "use-deep-compare";

export default function useArchiveMessage() {

    const privateKey = usePrivateKey();

    const [chats, setChats] = useRecoilState(chatsState)
    const navigate = useNavigate()

    const { activeChatId } = useActiveChat()

    const chatIds = chats && Object.keys(chats)

    const archiveMessage = useDeepCompareCallback((encryptedMessage: ReceivedMessage, { showToast = true }) => {

        if (!privateKey) return

        const decryptMedia = (media?: Media) => {
            try {
                if (!media) return
                const encryptionKey = util.decodeUtf8(privateKey.decrypt(util.decode64(media.encryptionKey)))
                return {
                    ...media,
                    encryptionKey,
                    data: AES.decrypt(media.data, encryptionKey).toString(enc.Utf8)
                }
            } catch (error) {
                console.log('error', error)
            }
        }

        const decryptText = (text?: string) => {
            return text ? util.decodeUtf8(privateKey.decrypt(util.decode64(text))) : ""
        }

        const message = {
            ...encryptedMessage,
            content: {
                text: decryptText(encryptedMessage.content.text),
                media: decryptMedia(encryptedMessage.content.media)
            }
        }

        if (encryptedMessage.replyingTo) {
            message.replyingTo = {
                ...encryptedMessage.replyingTo,
                content: {
                    text: decryptText(encryptedMessage.replyingTo.content.text),
                    media: decryptMedia(encryptedMessage.replyingTo.content.media)
                }
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

        if (showToast && chatId !== activeChatId) {
            toast.info(`${message.sender.nick}: ${message.content.text}`, {
                position: toast.POSITION.TOP_CENTER,
                onClick: () => {
                    navigate(`/${chatId}`)
                },
                icon: <></>
            })
        }

    }, [privateKey, chatIds, activeChatId, setChats])

    return archiveMessage
}