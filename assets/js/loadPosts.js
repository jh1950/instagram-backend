let load = true;

const load_start = async function() {
	load = true;
	const boxs = document.querySelectorAll(".postbox[num]");
	const num = boxs[boxs.length-1]?.getAttribute("num");
	load = await load_feed(num);
}

setTimeout(async function() {
	load = await load_feed();
	while (!load && body.clientHeight == window.innerHeight) {
		await load_start();
	}
}, 0);
window.addEventListener("scroll", async function(e) {
	if (!load && body.clientHeight < window.innerHeight + html.scrollTop + 30) {
		await load_start();
	}
});
