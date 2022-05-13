import { atom } from "recoil";
import { USER } from "../constants";
import persist from "./effects/persist";

const { persistAtom } = persist(USER);

// WARNING: to avoid circular dependency issues always import userState before other atoms
export const userState = atom<LoggedUser | null>({
    key: USER,
    default: null,
    effects: [persistAtom]
})