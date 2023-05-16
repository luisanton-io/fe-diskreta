import { dialogState } from "atoms/dialog";
import { GearWideConnected } from "react-bootstrap-icons";
import { useSetRecoilState } from "recoil";
import ManageData from "./Sections/ManageData";
import Theme from "./Sections/Theme";
import SessionTimeout from "./Sections/SessionTimeout";

function SettingsDialogContent() {
    return <div id="settings">
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
            onConfirm: () => setDialog(null),
            cancelLabel: "Close"
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