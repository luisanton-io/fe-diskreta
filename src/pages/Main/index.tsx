import { userState } from "atoms/user";
import { chatsState } from "atoms/chats";
import { dialogState } from "atoms/dialog";
import { USER_DIGEST } from "constants/localStorage";
import { useEffect } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { ExclamationOctagonFill, Plus, Trash3 } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Chat from "./Chat";
import Conversations from "./Conversations";
import SearchDialog from "./SearchDialog";
import { toast } from "react-toastify";
import API from "API";
import { AxiosError } from "axios"

export default function Main() {

    const navigate = useNavigate()

    const setDialog = useSetRecoilState(dialogState)
    const user = useRecoilValue(userState)

    const { activeChat } = useParams()

    const handleShowSearchDialog = () => {
        setDialog({
            Content: SearchDialog,
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


    const handleRemoveData = async () => {
        if (!window.confirm("You are about to remove your full account data. You will NEVER be able to recover your data. Are you sure to continue?")) {
            return
        }

        try {
            await API.delete("/users/me")
            localStorage.clear()
            navigate("/register")
        } catch (error) {
            toast.error(error instanceof AxiosError ? error.response?.data?.error : (error as Error).message)
        }
    }

    return <Container>
        <Row style={{ height: '90vh', margin: 'auto' }}>
            <Col xs={12} md={4} id="main-left" style={{ overflow: 'auto' }} data-active-chat={!!activeChat}>
                <div className="d-flex">
                    <Button variant="outline-info"
                        className="btn-submit flex-grow-1 d-flex align-items-center justify-content-center mt-3 py-2"
                        onClick={handleShowSearchDialog}>
                        <Plus className="me-1" style={{ fontSize: '1.5em' }} />
                        <span>New</span>
                    </Button>
                    <Button variant="outline-danger"
                        className="ms-2 btn-submit d-flex align-items-center justify-content-center mt-3 py-2"
                        onClick={handleRemoveData}>
                        <ExclamationOctagonFill style={{ fontSize: '1.25em' }} />
                    </Button>
                </div>
                <hr />
                <Conversations />
            </Col>
            <Col xs={12} md={8} id="main-right" className="d-flex flex-column h-100">
                <Chat />
            </Col>
        </Row>
    </Container>
}