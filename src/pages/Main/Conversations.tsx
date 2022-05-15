import { chatsState } from "atoms/chats";
import { userState } from "atoms/user";
import { Button, ListGroup } from "react-bootstrap";
import { Arrow90degUp, Trash3 } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";

export default function Conversations() {

    const navigate = useNavigate()

    const [chats, setChats] = useRecoilState(chatsState)
    const user = useRecoilValue(userState)
    const { activeChat } = useParams()

    const handleDeleteChat = (id: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            const _chats = { ...chats }
            delete _chats![id]
            setChats({ ..._chats })
        }
    }

    return <ListGroup id="conversations">
        {
            chats && Object.values(chats).map(chat => {

                const recipients = chat.members.filter(m => m._id !== user?._id).map(r => r.nick).join(', ')
                console.log(chat.members)
                const latestMessage = chat.messages[chat.messages.length - 1]

                return <ListGroup.Item
                    className="conversation"
                    style={{ minHeight: 90 }}
                    key={chat.id}
                    onClick={() => navigate(`/${chat.id}`)}
                    data-active={chat.id === activeChat}
                >
                    <h6>{recipients}</h6>
                    {latestMessage && (
                        <div className="d-flex align-items-center">
                            {latestMessage.sender._id === user!._id && <Arrow90degUp style={{ transform: 'scale(0.6)' }} />}
                            <span>
                                {latestMessage.content.text}
                            </span>
                        </div>
                    )}
                    <Button variant="outline-danger"
                        onClick={() => handleDeleteChat(chat.id)}
                        className="delete-btn position-absolute rounded-0"
                        style={{ inset: 'auto 1em auto auto' }}>
                        <Trash3 />
                    </Button>
                </ListGroup.Item>
            })
        }
    </ListGroup>
}