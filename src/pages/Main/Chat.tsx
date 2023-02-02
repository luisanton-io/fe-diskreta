import Diskreta from "components/Diskreta";
import useActiveChat from "hooks/useActiveChat";
import useSocket from "hooks/useSocket";
import { Col } from "react-bootstrap";
import ChatBody from "./ChatBody";
import ChatHeader from "./ChatHeader";
import { ChatContext } from "./context/ChatCtx";
import MessageInput from "./MessageInput";
import ServerEcho from "./ServerEcho";

export default function Chat() {

    const socket = useSocket()
    const { activeChat, recipients } = useActiveChat()

    return <>{
        activeChat && recipients && socket
            ?
            <ChatContext.Provider value={{ socket, activeChat, recipients }}>
                <div className="d-flex flex-column h-100">
                    <ServerEcho />

                    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '45vh' }}>
                        <ChatHeader />

                        <hr />

                        <ChatBody />

                        <MessageInput />
                    </div>

                </div>
            </ChatContext.Provider>
            :
            <Col className="d-flex align-items-center flex-grow-1">
                <Diskreta />
            </Col>

    }
    </>
}