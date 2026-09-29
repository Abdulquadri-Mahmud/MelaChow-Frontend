import axios from "axios";
import { TokenManager } from "@/app/lib/auth-token";
import { resolveApiUrl, isApiUrl } from "./api-url.mjs";
const origin = process.env.NEXT_PUBLIC_MOBILE_API_URL;
function configure(instance) {
  instance.interceptors.request.use((config) => {
    config.url = resolveApiUrl(config.url, origin);
    if (isApiUrl(instance.getUri(config), origin)) {
      const token = TokenManager.getToken("user");
      if (token) config.headers.set("Authorization", "Bearer " + token);
      config.withCredentials = true;
    }
    return config;
  });
  return instance;
}
const create = axios.create.bind(axios);
const mobileAxios = configure(create({ baseURL: origin }));
mobileAxios.create = (config = {}) => configure(create({
  ...config,
  baseURL: config.baseURL ? resolveApiUrl(config.baseURL, origin) : origin,
}));
export default mobileAxios;
