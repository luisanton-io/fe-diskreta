import API from "API";
import { dialogState } from "atoms/dialog";
import { AxiosError } from "axios";
import { Button } from "react-bootstrap";
import { ExclamationOctagonFill, Plus } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSetRecoilState } from "recoil";
import SearchDialog from "./SearchDialog";

export default function SideHeader() {

    const navigate = useNavigate()
    const setDialog = useSetRecoilState(dialogState)

    const handleShowSearchDialog = () => {
        setDialog({
            Content: SearchDialog,
            onConfirm: () => setDialog(null),
            cancelLabel: "Close"
        })
    }

    const handleRemoveData = async () => {
        if (!window.confirm("You are about to remove ALL your account data. You will NEVER be able to recover your data. Are you sure to continue?")) {
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

    return <div className="d-flex">
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
}