let url = new URL(window.location.href);

let response_game = url.searchParams.get("game"),
    response_ip = url.searchParams.get("ip"),
    response_port = url.searchParams.get("port");
console.log(response_game, response_ip, response_port);