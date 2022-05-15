import { userState } from "atoms/user";
import { chatsState } from "atoms/chats";
import { dialogState } from "atoms/dialog";
import { USER_DIGEST } from "constants/localStorage";
import { useEffect } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Chat from "./Chat";
import Conversations from "./Conversations";
import UserDialog from "./UserDialog";

export default function Main() {

    const navigate = useNavigate()

    const [chats, setChats] = useRecoilState(chatsState)
    const setDialog = useSetRecoilState(dialogState)
    const user = useRecoilValue(userState)

    // const privateKey = useMemo(() => user && pki.privateKeyFromPem(user.privateKey), [user])

    const { activeChat } = useParams()

    // const [text, setText] = useState('')

    // const socket = useMemo(() => {
    //     const socket = user && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token: user.token } })
    //     // console.log({ socket })
    //     return socket
    // }, [user])

    // const handleArchiveMessage = useHandleArchiveMessage(privateKey)

    // useEffect(() => {
    //     if (!socket) return

    //     const handleDequeue = (messages: Message[]) => {
    //         messages.forEach(handleArchiveMessage)
    //     }

    //     socket.on('in-msg', handleArchiveMessage)
    //     socket.on('dequeue', handleDequeue)

    //     return () => {
    //         socket.off('in-msg', handleArchiveMessage)
    //         socket.off('dequeue', handleDequeue)
    //     }

    // }, [socket, handleArchiveMessage])

    const handleShowSearchModal = () => {
        setDialog({
            Content: UserDialog,
            onConfirm: () => setDialog(null),
            cancelLabel: "Close"
        })
    }

    const userExists = !!user

    useEffect(() => {
        if (!userExists) {
            !localStorage.getItem(USER_DIGEST)
                ? navigate("/register")
                : navigate("/login")
        }
    }, [userExists, navigate])

    console.log(chats, activeChat)

    return <Container>
        <Row style={{ height: '90vh', margin: 'auto' }}>
            <Col xs={12} md={4} id="main-left" style={{ overflow: 'auto' }} data-active-chat={!!activeChat}>
                <Button variant="outline-info" className="btn-submit d-flex align-items-center justify-content-center mt-3 mx-auto py-2 px-5" onClick={handleShowSearchModal}>
                    {/* New Chat */}
                    <Plus style={{ fontSize: '1.5em' }} />
                    <span>New</span>
                </Button>
                <hr />
                <Conversations />
                {/* <Button variant="outline-danger" className="position-absolute bottom-0 start-0 end-0 rounded-0">
                    Delete data
                </Button> */}
            </Col>
            <Col xs={12} md={8} id="main-right" className="d-flex flex-column h-100">
                <Chat />
            </Col>
        </Row>
    </Container>
}