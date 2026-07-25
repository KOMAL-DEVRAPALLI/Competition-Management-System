import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (url, method, body = null) => {
    const res = await axios({
        url: BASE_URL + url,
        method,
        data: body,
    });

    return res.data;
};