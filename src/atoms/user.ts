import { atom } from "recoil";
import persist from "./effects/persist";

const { persistAtom } = persist("user");

interface LoggedUser extends User {
    token: string
    privateKey: string
    digest: string
}

export const userState = atom<LoggedUser | null>({
    key: "user",
    default: null,
    effects: [persistAtom]
})