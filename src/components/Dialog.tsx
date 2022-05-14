import { Button, Container, Modal, Row } from "react-bootstrap"
import { useRecoilState } from "recoil"
import { dialogState } from "../atoms/dialog"

export default function Dialog() {
    const [Dialog, setDialog] = useRecoilState(dialogState)

    const handleSubmit = () => {
        Dialog?.onConfirm()
        setDialog(null)
    }

    return <Modal show={!!Dialog}>
        {
            Dialog && (<>
                <Dialog.Content />
                <Container className="d-flex justify-content-end px-5 pb-4">
                    <Button variant="outline-dark" style={{ opacity: 0.9 }} className="rounded-0 text-white me-4" onClick={() => setDialog(null)}>Cancel</Button>
                    <Button variant="outline-light" className="rounded-0" onClick={handleSubmit}>{Dialog.submitLabel || "Ok"}</Button>
                </Container>

            </>
            )
        }
    </Modal>
}