import { dialogState } from "atoms/dialog";
import { GearWideConnected } from "react-bootstrap-icons";
import { useSetRecoilState } from "recoil";
import ManageData from "./Sections/ManageData";
import Theme from "./Sections/Theme";
import SessionTimeout from "./Sections/SessionTimeout";
import { Close } from "@mui/icons-material";

function SettingsDialogContent() {
    const setDialog = useSetRecoilState(dialogState)
    return <div id="settings" className="py-4 position-relative">
        <Close className="cursor-pointer position-absolute top-4 end-0 me-3" onClick={() => setDialog(null)} />
        <Theme />
        <SessionTimeout />
        <ManageData />
    </div>
}

export default function Settings() {
    const setDialog = useSetRecoilState(dialogState)

    const openDialog = () => {
        setDialog({
            Content: SettingsDialogContent,
            onConfirm: () => setDialog(null)
        })
    }
    return (
        <GearWideConnected
            onClick={openDialog}
            className="cursor-pointer"
            style={{ fontSize: '1.7em', marginInline: '1ch' }}
        />
    )
}