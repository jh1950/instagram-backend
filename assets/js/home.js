const container = document.querySelector("#postbox-container");
const load_feed = async function(num) {
	const {data} = await axios.post("/posts/load", {num});

	for (let post of data) {
		const li = document.createElement("li");
		const postbox = createPostbox(post);
		li.append(postbox);
		container.append(li);
	}
	return data.length == 0;
}



document.addEventListener("keydown", function(e) {
	if (e.keyCode == 27 && document.querySelector("#post")) {
		history.back();
	}
});



window.addEventListener("popstate", function() {
	const pathname = location.pathname.split("/posts/");
	if (location.pathname == "/")
		close_post("Home");
	else if (pathname.length != 1)
		load_post(pathname[1], false);
});
