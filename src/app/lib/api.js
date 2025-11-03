export const fetchUser = async (token) => {
  if (!token) throw new Error("No token provided!");

  const res = await fetch("https://grub-dash-api.vercel.app/api/user/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // console.log(res)

  if (!res.ok){
    throw new Error("Unauthorized or fetch failed!");
  } 

  const data = await res.json();
  return data; // expected { user: ... }
};
