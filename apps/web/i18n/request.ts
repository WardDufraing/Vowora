import { getRequestConfig } from "next-intl/server";

import { appMessages } from "./messages";

// Account-level locale persistence and locale-prefixed application routing are
// intentionally deferred. This request default makes shared next-intl
// primitives safe on existing routes; feature loaders can pass an approved
// explicit locale once the owning account/workspace contract exists.
export default getRequestConfig(async () => ({
  locale: "en",
  messages: appMessages.en,
  timeZone: "Etc/UTC",
}));
