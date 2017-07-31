(function getToken() {
  if (location.search[0] !=="?") {
    return;
  }
  const appEndpoint = process.env["GH_APP_API_ENDPOINT"];
  const pairs = location.search.slice(1).split("&");
  const qmap: { [key: string]: string } = { };
  const redirectUrl = sessionStorage.redirectUrl || "index.html";
  pairs.forEach(function (p){
    const kv = p.split("=");
    qmap[kv[0]] = kv[1];
  });
  if (qmap.code) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.error) {
          // tslint:disable:no-console
          console.error("oops", result.error);
        } else if (result.token) {
          localStorage.appToken = result.token;
          sessionStorage.removeItem("redirectUrl");
          location.replace(redirectUrl);
        }
      }
    };
    xhr.open("POST", `${appEndpoint}/api/login`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ code: qmap.code }));
  }
})();
