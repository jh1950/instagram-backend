const get_style = function(t, s) {
	if (!s) { s = t; t = document.documentElement; }
	return getComputedStyle(t).getPropertyValue(s).trim();
}
const set_style = function(t, s, v) {
	t.style.setProperty(s, v);
}

const to_px = function(v) {
	if (!isNaN(v*1)) {
	} else if (v.endsWith("rem")) {
		v = parseFloat(v) * parseFloat(get_style("font-size"));
	}
	return v
}



const queries = (() =>
  location.search.slice(1)
    .split('&')
    .map(v => v.split('='))
    .reduce((acc, [k, v]) => {
      acc[k.trim()] = decodeURIComponent(v);
      return acc;
    }, {}))();



const f_copy = function(text) {
	let area = document.createElement("textarea");
	try {
		area.className = "copybox"
		html.append(area);
		area.value = text;
		area.select();
		document.execCommand("copy");
		f_msgbox({
			type: "success",
			message: "The URL has been copied to the clipboard."
		});
	} catch (err) {
		f_msgbox({
			type: "error",
			message: "Error copying URL."
		});
	}
	area.remove();
}



const imageReader = function(image) {
	return new Promise((res, rej) => {
		let reader = new FileReader();
		reader.onload = () => {
			res(reader.result);
		}
		reader.readAsDataURL(image);
		reader.onerror = rej;
	});
}
const dateFormat = function(x) {
	x = new Date(x).toString().split("+")[0];
	return x.slice(0, x.lastIndexOf(" "));
}




const f_textarea = function(elem) {
	elem.style.height = "auto";
	elem.style.height = elem.scrollHeight + "px";
}

const avatarUpdate = async function(e) {
	if (!e.target || !e.target.files.length) return;

	const form = new FormData();
	form.append("avatar", e.target.files[0]);

	try {
		const {data} = await axios.post("/avatar", form, {header: "multipart/form-data"});
		for (let x of document.querySelectorAll(".avatar")) {
			x.style.backgroundImage = `url(${imgdir}/${data.filename})`;
		}
	} catch(err) {
		const data = err.response.data;
		const message = data.split("<pre>")[1].split("</pre>")[0].split("<br>")[0];
		f_msgbox({type: "error", message});
	}
}



const xbtn = function() {
	const btn = document.createElement("button");
	btn.className = "xbtn";
	btn.type = "button";
	btn.innerHTML = "<svg viewBox='0 0 64 64'><use href='#svg-x'/></svg>";
	btn.setAttribute("onclick", "history.back();");
	return btn;
}

const userList = function({id, title, users, arr}) {
	html.classList.add("x-scroll");
	headerButton({type: "prev"});

	const section = document.createElement("section");
	section.className = "overlay userList";
	if (id) section.id = id;
	if (title) section.innerHTML += `<div>${title}</div><ul></ul>`;
	section.querySelector("div").append(xbtn());

	for (let user of users) {
		const li = document.createElement("li");
		li.innerHTML =
			`<a href='/${user.id}' class='avatar' style='background-image: url(${imgdir}/${user.avatar})'></a>`+
			`<a href='/${user.id}'>`+
				"<span class='follow_id'></span>"+
				"<span class='follow_name'></span>"+
			"</a>"+
			"<label>"+
				"<span></span>"+
				"<button class='follow' type='button' hidden></button>"+
			"</label>";
		li.querySelector(".follow_id").innerText = user.id;
		li.querySelector(".follow_name").innerText = user.name;
		if (user.num == user_num) {
			li.querySelector("label").remove();
		} else {
			li.querySelector("label span").innerText = arr[user.num] ? "Unfollow" : "Follow";
			li.querySelector("label button").setAttribute("onclick", `follow(this, ${user.num}, 'following');`);
		}
		section.querySelector("ul").append(li);
	}

	section.addEventListener("click", function(e) {
		if (e.target.classList.contains("userList")) history.back();
	});

	return section;
}

const close_overlay = function() {
	html.classList.remove("x-scroll");
	document.querySelector(".overlay")?.remove();
	header.querySelector(".prev")?.remove();
}

const f_follow = async function(btn, num, id = "follower") {
	const action = btn.classList.contains("follow") ? "unfollow" : "follow";
	if (action == "follow") {
		btn.previousElementSibling.innerText = "Unfollow";
		btn.classList.add("follow");
	} else {
		btn.previousElementSibling.innerText = "Follow";
		btn.classList.remove("follow");
	}
	await axios.post("/" + action, {num});
	const target = document.querySelector(`#${id} .number`);

	target.innerText = target.innerText*1 + (action == "follow" ? 1 : -1);
}



html.setAttribute("darkmode", localStorage.darkmode || window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);



const theme_color = get_style(html, "--theme-color");
const theme_color_light = get_style(html, "--theme-color-light");
const theme_color_dark = get_style(html, "--theme-color-dark");
const sub_theme_color = get_style(html, "--sub-theme-color");
const theme_color_trans = get_style(html, "--theme-color-trans");




window.addEventListener("DOMContentLoaded", function() {
	const resize_main = function() {
		set_style(main, "--main-width", main.clientWidth + "px");
	}
	resize_main();
	window.addEventListener("resize", resize_main);
});
