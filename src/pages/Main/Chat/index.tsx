import Diskreta from "components/Diskreta";
import useActiveChat from "hooks/useActiveChat";
import useSocket from "hooks/useSocket";
import { useState } from "react";
import { Col } from "react-bootstrap";
import ChatBody from "./ChatBody";
import ChatHeader from "./ChatHeader";
import { ChatContext } from "./context/ChatCtx";
import MessageInput from "./MessageInput";
import ServerEcho from "./ServerEcho";
import Spotlight, { SpotlightProps } from "./Spotlight";

export default function Chat() {

    const socket = useSocket()
    const { activeChat, recipients } = useActiveChat()
    const [{ media, onReset, isInput }, setSpotlight] = useState<SpotlightProps>({} as SpotlightProps)

    const resetMedia = () => {
        setSpotlight({} as SpotlightProps)
    }

    return <>{
        activeChat && recipients && socket
            ?
            <ChatContext.Provider value={{ socket, activeChat, recipients, setSpotlight }}>
                <div className="d-flex flex-column h-100">
                    <ServerEcho />

                    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '45vh' }}>
                        <ChatHeader />

                        <hr />

                        <ChatBody />

                        <MessageInput />
                    </div>

                    {
                        media && <Spotlight {...{ media, resetMedia, onReset, isInput }} />
                    }

                </div>
            </ChatContext.Provider>
            :
            <Col className="d-flex align-items-center flex-grow-1">
                <Diskreta />
            </Col>

    }
    </>
}