import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const apiRequest = async (url, method, body = null) => {
    const res = await axios({
        url: BASE_URL + url,
        method,
        data: body,
    });

    return res.data;
};