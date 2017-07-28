export function login() {
  localStorage.removeItem("appToken");
  const GH_APP_CLIENT_ID = process.env["GH_APP_CLIENT_ID"];
  location.replace(`https://github.com/login/oauth/authorize?client_id=${GH_APP_CLIENT_ID}`);
}
