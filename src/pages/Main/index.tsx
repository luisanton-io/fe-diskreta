import { userState } from "atoms/user";
import { USER_DIGEST } from "constants/localStorage";
import { useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Chat from "./Chat";
import Conversations from "./Conversations";
import SideHeader from "./SideHeader";

export default function Main() {

    const navigate = useNavigate()
    const user = useRecoilValue(userState)

    const { activeChat } = useParams()

    const userExists = !!user

    useEffect(() => {
        if (!userExists) {
            !localStorage.getItem(USER_DIGEST)
                ? navigate("/register")
                : navigate("/login")
        }
    }, [userExists, navigate])

    return <Container className="py-5 h-100">
        <Row className="h-100 flex-column flex-md-row" style={{ margin: 'auto' }}>
            <Col xs={12} md={4} id="main-left" style={{ overflow: 'auto' }} data-active-chat={!!activeChat}>
                <SideHeader />
                <hr />
                <Conversations />
            </Col>
            <Col xs={12} md={8} id="main-right"
                className="flex-grow-1"
                data-active-chat={!!activeChat}>
                <Chat />
            </Col>
        </Row>
    </Container>
}