import { Button, Container, Modal } from "react-bootstrap"
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
                    <Button variant="outline-dark" style={{ opacity: 0.9 }} className="rounded-0 text-white me-4" onClick={() => setDialog(null)}>
                        {
                            Dialog.cancelLabel || "Cancel"
                        }
                    </Button>
                    {
                        Dialog.submitLabel &&
                        <Button variant="outline-info" className="btn-submit" onClick={handleSubmit}>{Dialog.submitLabel}</Button>
                    }
                </Container>
            </>
            )
        }
    </Modal>
}