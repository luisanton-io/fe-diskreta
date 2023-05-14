import { atom } from "recoil";
import { THEME } from "constants/localStorage";
import persist from "./effects/persist";

const { persistAtom } = persist(THEME)

export const themeState = atom<string>({
    key: THEME,
    default: "Default",
    effects: [persistAtom],
});