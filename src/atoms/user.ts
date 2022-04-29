import { atom } from "recoil";
import persist from "./effects/persist";

const { persistAtom } = persist("user");

export const userState = atom<LoggedUser | null>({
    key: "user",
    default: null,
    effects: [persistAtom]
})