import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";
import axiosInstance from "./axios";

window.Pusher = Pusher;

const apiBaseUrl = axiosInstance.defaults.baseURL || window.location.origin;
const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
const authEndpoint =
  import.meta.env.VITE_BROADCAST_AUTH_ENDPOINT ||
  `${apiOrigin}/broadcasting/auth`;

const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const isTls = (import.meta.env.VITE_REVERB_SCHEME || "http") === "https";

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: reverbHost,
  wsPort: reverbPort,
  wssPort: reverbPort,
  forceTLS: isTls,
  enabledTransports: isTls ? ["wss"] : ["ws"],
  authEndpoint,
  // Use a custom authorizer so private channel auth always uses the root /broadcasting/auth endpoint.
  authorizer: (channel) => {
    return {
      authorize: (socketId, callback) => {
        const token = localStorage.getItem("auth_token");

        axios
          .post(
            authEndpoint,
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              withCredentials: false,
            },
          )
          .then((response) => {
            callback(false, response.data);
          })
          .catch((error) => {
            callback(true, error);
          });
      },
    };
  },
});

export default echo;
