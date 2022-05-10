import { atom } from "recoil";
import persist from "./effects/persist";

const { persistAtom } = persist("user");

// WARNING: to avoid circular dependency issues always import userState before other atoms
export const userState = atom<LoggedUser | null>({
    key: "user",
    default: null,
    effects: [persistAtom]
})