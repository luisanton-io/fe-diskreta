import { chatsState } from "atoms/chats";
import { userState } from "atoms/user";
import { Button, ListGroup } from "react-bootstrap";
import { Arrow90degUp, Trash3 } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import useHandleDeleteChat from "./handlers/useHandleDeleteChat";

export default function Conversations() {

    const navigate = useNavigate()

    const [chats, setChats] = useRecoilState(chatsState)
    const user = useRecoilValue(userState)
    const { activeChat } = useParams()

    const handleDeleteChat = useHandleDeleteChat()
    const latestTimestamp = (chat: Chat) => chat.messages[chat.messages.length - 1]?.timestamp || Date.now()

    return <ListGroup id="conversations">
        {
            chats && Object.values(chats)
                .sort((a, b) => latestTimestamp(b) - latestTimestamp(a))
                .map(chat => {

                    const recipients = chat.members.filter(m => m._id !== user?._id).map(r => r.nick).join(', ')
                    const latestMessage = chat.messages[chat.messages.length - 1]

                    return <>
                        <ListGroup.Item
                            className="conversation"
                            style={{ minHeight: 90 }}
                            key={chat.id}
                            onClick={() => navigate(`/${chat.id}`)}
                            data-active={chat.id === activeChat}
                        >
                            <h6 className="fw-bold">{recipients}</h6>
                            {latestMessage && (
                                <div
                                    className="d-flex align-items-center"
                                    style={{ width: "95%" }}
                                >
                                    {latestMessage.sender._id === user!._id && <Arrow90degUp className="me-2" style={{ transform: "scale(1.2)" }} />}
                                    <p className="m-0 text-light" style={{ whiteSpace: "nowrap", textOverflow: 'ellipsis', overflow: "hidden" }}>
                                        {latestMessage.content.text}
                                    </p>
                                </div>
                            )}
                            <Button variant="outline-danger"
                                onClick={e => {
                                    e.stopPropagation()
                                    handleDeleteChat(chat.id)
                                }}
                                className="delete-btn position-absolute rounded-0 d-none d-md-block"
                                style={{ inset: 'auto 1em auto auto' }}>
                                <Trash3 />
                            </Button>
                        </ListGroup.Item>
                        <hr />
                    </>
                })
        }
    </ListGroup>
}