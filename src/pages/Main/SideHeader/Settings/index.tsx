import { dialogState } from "atoms/dialog";
import { GearWideConnected } from "react-bootstrap-icons";
import { useSetRecoilState } from "recoil";
import ManageData from "./Sections/ManageData";
import Theme from "./Sections/Theme";

function SettingsDialogContent() {
    return <div>
        <Theme />
        <ManageData />
    </div>
}

export default function Settings() {
    const setDialog = useSetRecoilState(dialogState)

    const openDialog = () => {
        setDialog({
            Content: SettingsDialogContent,
            onConfirm: () => setDialog(null),
            cancelLabel: "Close"
        })
    }
    return (
        <GearWideConnected
            onClick={openDialog}
            style={{ fontSize: '1.7em', marginInline: '1ch' }}
        />
    )
}