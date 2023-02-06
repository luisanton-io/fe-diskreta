import { chatsState } from "atoms/chats";
import { userState } from "atoms/user";
import imageCompression from 'browser-image-compression';
import { AES, SHA256 } from "crypto-js";
import { pki, random, util } from "node-forge";
import { useContext, useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Camera, Send } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { useRecoilValue, useSetRecoilState } from "recoil";
import convertFileToBase64 from "util/convertFileToBase64";
import maskUser from "util/maskUser";
import useMessageStatus from "../handlers/useMessageStatus";
import { ChatContext } from "./context/ChatCtx";
import { SpotlightProps } from "./Spotlight";

export default function MessageInput() {
    const setChats = useSetRecoilState(chatsState)
    const user = useRecoilValue(userState)

    const handleMessageStatus = useMessageStatus()

    const { socket, recipients, activeChat, setSpotlight } = useContext(ChatContext)

    const [text, setText] = useState('')

    const [media, setMedia] = useState<Media>()

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault()

        console.log('sending msg')

        if (!text && !media) return

        const payload: Omit<SentMessage, "hash" | "status"> = {
            sender: maskUser(user)!,
            to: recipients,
            chatId: activeChat.id,
            content: { text, media },
            timestamp: Date.now()
        }

        const message = {
            ...payload,
            hash: SHA256(JSON.stringify(payload)).toString(),
        }

        const sentMessage: SentMessage = {
            ...message,
            status: recipients.reduce((all, { _id }) => ({
                ...all,
                [_id]: 'outgoing'
            }), {})
        }

        setChats(chats => ({
            ...chats,
            [activeChat.id]: {
                ...activeChat,
                messages: [
                    ...activeChat.messages,
                    sentMessage
                ]
            }
        }))

        for (const recipient of recipients) {

            const publicKey = pki.publicKeyFromPem(recipient.publicKey)

            const encryptionKey = media && util.encode64(publicKey.encrypt(util.encodeUtf8(media.encryptionKey)))

            console.table({ encryptionKey, enc: media?.encryptionKey })

            const outgoingMessage: OutgoingMessage = {
                ...message,
                to: recipients,
                for: recipient._id,
                content: {
                    text: text && util.encode64(publicKey.encrypt(util.encodeUtf8(text))),
                    media: media && {
                        type: media.type,
                        encryptionKey: encryptionKey!,
                        data: AES.encrypt(media.data, media.encryptionKey).toString()
                    }
                }
            }

            delete outgoingMessage.sender
            console.log(outgoingMessage)

            socket.emit("out-msg", outgoingMessage, (recipientId: string) => {
                handleMessageStatus({
                    chatId: activeChat.id,
                    hash: message.hash,
                    recipientId,
                    status: 'sent'
                })
            })
        }

        setMedia(undefined)
        setText('')
        setSpotlight({} as SpotlightProps)
    }

    const handleFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        try {
            const file = await imageCompression(e.target.files![0], {
                maxWidthOrHeight: 1000,
                maxSizeMB: 1,
                useWebWorker: true
            })

            const media: Media = {
                type: 'image',
                data: await convertFileToBase64(file),
                encryptionKey: util.bytesToHex(random.getBytesSync(32))
            }

            console.log(media)

            setMedia(media)
        } catch (error) {
            toast.error((error as Error).message)
        }

    }

    useEffect(() => {
        media && setSpotlight(s => ({
            ...s,
            media,
            isInput: true,
            onReset: () => {
                setMedia(undefined)
            },
        }))
    }, [media, setSpotlight])

    return <Form onSubmit={handleSendMessage} className="d-flex pt-3" style={{ zIndex: Number(!!media) }}>
        {
            !media && <Button variant="outline-light" className="rounded-0" style={{ borderRight: 'transparent' }}>
                <label htmlFor="media-input">
                    <Camera />
                </label>
                <input type="file" id="media-input" className="d-none" onChange={handleFile} />
            </Button>
        }
        <textarea id="msg-input" autoComplete="off"
            className="rounded-0 text-white p-3 bg-transparent flex-grow-1 border-light"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
        />
        <Button type="submit" className="btn-submit ms-2" variant="outline-info" disabled={!text && !media}>
            <Send />
        </Button>
    </Form>
}