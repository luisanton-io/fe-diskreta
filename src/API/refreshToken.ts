import API from "API";
import { userState } from "atoms/user";
import { getRecoil, setRecoil } from "recoil-nexus";

export const refreshToken = async () => {
    try {
        const { data } = await API.post<RefreshResponse>("/users/refreshToken", {
            refreshToken: getRecoil(userState)?.refreshToken
        });

        setRecoil(userState, user => user && ({
            ...user,
            token: data.token,
            refreshToken: data.refreshToken
        }))
    } catch {
        window.location.assign("/login")
    }
};