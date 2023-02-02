import Diskreta from "components/Diskreta";
import useActiveChat from "hooks/useActiveChat";
import useSocket from "hooks/useSocket";
import { Col } from "react-bootstrap";
import ChatBody from "./ChatBody";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import ServerEcho from "./ServerEcho";

export interface SocketEcho {
    event: string
    payload: Record<string, any>
}

export default function Chat() {

    const socket = useSocket()
    const { activeChat, recipients } = useActiveChat()

    return <>{
        activeChat
            ? <div className="d-flex flex-column h-100">
                <ServerEcho socket={socket} />

                <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '45vh' }}>
                    <ChatHeader {...{ activeChat }} />

                    <hr />

                    <ChatBody {...{ socket, activeChat }} />

                    <MessageInput {...{ socket, recipients }} />
                </div>

            </div>
            :
            <Col className="d-flex align-items-center flex-grow-1">
                <Diskreta />
            </Col>

    }
    </>
}