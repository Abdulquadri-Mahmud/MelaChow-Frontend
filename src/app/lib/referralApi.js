import customerApi from "./customerApi";
import { getPromoDeviceId } from "./promoDevice";

const deviceHeaders = () => {
  const deviceId = typeof window !== "undefined" ? getPromoDeviceId?.() : null;
  return deviceId ? { "X-MelaChow-Device-Id": deviceId } : {};
};

export const getMyReferrals = async () => {
  const res = await customerApi.get("/referrals/me", { headers: deviceHeaders() });
  return res.data;
};

export const getMyRewardCredits = async () => {
  const res = await customerApi.get("/referrals/credits", { headers: deviceHeaders() });
  return res.data;
};

export const applyReferralCode = async (code) => {
  const res = await customerApi.post(
    "/referrals/apply",
    { code: String(code || "").trim().toUpperCase() },
    { headers: deviceHeaders() }
  );
  return res.data;
};
