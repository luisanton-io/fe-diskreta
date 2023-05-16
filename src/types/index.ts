import { Themes } from "constants/themes";

declare global {
    type Theme = typeof Themes[keyof typeof Themes];
}