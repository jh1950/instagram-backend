const svg_heart = "<svg viewbox='0 0 24 24'><use href='#svg-heart'/></svg>";
const svg_heartFill = "<svg viewbox='0 0 48 48'><use href='#svg-heartFill'/></svg>";
const commentboxHTML = 
	"<div class='commentbox'>"+
		"<span class='avatar'></span>"+
		"<div class='info'>"+
			"<p><a class='id'></a> - <span class='date'></span></p>"+
			"<span class='comment'></span>"+
		"</div>"+
	"</div>";

const getPostData = async function(idx) {
	return (await axios.post("/posts/" + idx)).data;
}

const createImgbox = function(imgs) {
	const box = document.createElement("div");
	box.className = "imgbox-wrapper";
	box.setAttribute("ontouchstart", "f_slideboxTouch(event);");
	box.setAttribute("ontouchmove", "f_slideboxTouch(event);");
	box.setAttribute("ontouchend", "f_slideboxTouch(event);");
	for (let img of imgs) box.innerHTML += `<li><img src='${imgdir}/${img.name}' loading='lazy'/></li>`;
	box.innerHTML = "<ul class='imgbox'>" + box.innerHTML + "</ul>";

	if (1 < imgs.length) {
		for (let x of ["prev", "next"]) {
			const btn = document.createElement("button");
			btn.className = x;
			btn.innerHTML = "<svg viewBox='0 0 64 32'><use href='#svg-arrow-2'></use></svg>";
			btn.setAttribute("onclick", "f_slidebox(event);");
			box.append(btn);
		}

		const div = document.createElement("div");
		div.className = "status";
		for (let x of imgs) {
			div.innerHTML += "<span></span>";
		}
		div.querySelector("span:first-child").className = "show";
		box.append(div);
	}
	return box;
}

const delBtn = "<label class='delBtn'>Delete<button type='button' onclick='f_delete(this);' hidden></button></label>";
const f_delete = async function(btn) {
	if (!confirm("진짜 삭제하시겠습니까?")) return;
	const box = btn.closest(".postbox, .commentbox");
	const boxname = box.className;
	const boxnum = box.getAttribute("num");

	try {
		await axios.delete("/posts/delete", {data: {boxname, boxnum}});
		if (box.id == "post") {
			container.querySelector(`.postbox[num='${boxnum}']`).parentNode.remove();
			history.back();
		} else {
			box.parentNode.remove();
		}
	} catch(err) {
		let {message} = err.response.data;
		if (message) f_msgbox({type: "error", message});
	}
}

const createPostbox = function(post) {
	const box = document.createElement("article");
	box.className = "postbox";
	box.setAttribute("num", post.num);
	box.innerHTML =
		"<div class='author'>"+
			"<span class='avatar'></span>"+
			"<p>"+
				"<a class='id'></a> - <span class='date'></span>"+
			"</p>"+
			`${post.user_num == user_num ? delBtn : ""}`+
		"</div>"+
		"<div class='icons'>"+
			"<button type='button' class='icon' title='Like' onclick='f_like(this);'></button>"+
			"<button type='button' class='icon' title='Comment' onclick='load_post(this.closest(\".postbox\").getAttribute(\"num\"));'><svg viewbox='0 0 24 24'><use href='#svg-comment'/></svg></button>"+
		"</div>"+
		`<label class='likes' hidden><span class='likeNum'>${post.Likes.length}</span> Likes<button type='button' onclick='f_likeList(${post.num})' hidden></button></label>`+
		"<label class='comments' hidden>View all <span class='commentsNum'>" + post.Comments.length + "</span> comments<button hidden type='button' onclick='load_post(this.closest(\".postbox\").getAttribute(\"num\"));'></button></label>"+
		"<div class='info'>"+
			"<a class='id'></a>"+
			"<span class='content'></span>"+
		"</div>";
	box.querySelector(".author").after( createImgbox(post.Files) );
	box.querySelector(".avatar").style.backgroundImage = `url(${imgdir}/${post.User.avatar})`;
	for (let a of box.querySelectorAll(".id")) {
		a.href = "/" + post.User.id;
		a.innerText = post.User.id;
	}
	box.querySelector(".content").innerText = post.content;
	box.querySelector(".date").innerText = dateFormat(post.updatedAt);
	box.querySelector(".icons button[title='Like']").innerHTML = post.Likes.map(x => x.user_num).includes(user_num*1) ? svg_heartFill : svg_heart;

	if (post.Likes.length) box.querySelector(".likes").removeAttribute("hidden");
	if (post.Comments.length) box.querySelector(".comments").removeAttribute("hidden");
	f_imgbox(box.querySelector(".imgbox"))

	return box;
}

const f_imgbox = function(imgbox) {
	imgbox.querySelector("li:first-child img")?.addEventListener("load", function() {
		const clientHeight = Math.min(window.innerHeight/100*75, imgbox.querySelectorAll("img")[0].clientHeight);
		set_style(imgbox, "--imgbox-height", clientHeight + "px");
		set_style(imgbox, "--img-width", "auto");
	});
}






const load_post = async function(num, pushState = true) {
	if (document.querySelector("#post")) {
		document.querySelector("#post form [name='comment']").focus();
		return;
	}

	const box = document.querySelector(`.postbox[num='${num}']`);
	const post_num = box.getAttribute("num");
	if (pushState) history.pushState(null, null, "/posts/" + post_num);
	html.classList.add("x-scroll");

	const {post, comments} = await getPostData(post_num);
	const postbox = createPostbox(post);
	postbox.id = "post";
	postbox.classList.add("overlay");

	const imgbox = postbox.querySelector(".imgbox-wrapper");

	const div = document.createElement("div");
	div.className = "post-content";
	div.innerHTML =
		commentboxHTML +
		"<ul id='commentbox-container'></ul>"+
		"<form action='/posts/comment' id='commentForm'>"+
			"<textarea name='comment' placeholder='Add a comment...' autocomplete='off' onkeydown='f_comment_onkeydown(this, event);' onkeyup='f_comment_onkeyup(this, event);'></textarea>"+
			"<label>Send<button type='submit' hidden></button></label>"+
		"</form>";
	div.querySelector(".commentbox").className = "post";
	div.querySelector(".comment").className = "content";
	div.querySelector(".post .avatar").style.backgroundImage = postbox.querySelector(".author .avatar").style.backgroundImage;
	div.querySelector(".post .info > p").innerHTML = postbox.querySelector(".author > p").innerHTML;
	div.querySelector(".post .info .content").innerText = post.content;
	if (post.user_num == user_num) div.querySelector(".post").innerHTML += delBtn;
	div.querySelector("form").before( postbox.querySelector(".icons") );

	postbox.innerHTML = "";
	postbox.append(xbtn());
	postbox.append(imgbox);
	postbox.append(div);

	postbox.querySelector("form").addEventListener("submit", f_comment);
	document.querySelector("main").append(postbox);
	div.querySelector("#commentForm textarea").focus();

	for (let comment of comments) newComment(comment);

	const prev = document.createElement("button");
	prev.type = "button";
	prev.setAttribute("onclick", "history.back();");
	headerButton({type: "prev", elem: prev});
	header.querySelector("#page-title").innerText = "Comment";

	resize_loadPost();
	postbox.addEventListener("click", function(e) {
		if (e.target.id == "post") history.back();
	});
}

const close_post = function(title) {
	header.querySelector("#page-title").innerText = title;
	close_overlay();
}



const f_slidebox = function(e) {
	let btn = e.target;
	if (btn.tagName != "BUTTON") btn = btn.closest("button");
	const type = btn.className;
	const box = btn.closest(".imgbox-wrapper");
	let idx = (get_style(box, "--idx") || 0)*1 + (type == "prev" ? -1 : 1);
	if (idx < 0) idx = 0;
	idx = Math.min(box.querySelectorAll("img").length-1, idx);
	f_slidebbox_move(box, idx);
}
const f_slidebbox_move = function(box, idx) {
	set_style(box, "--idx", idx);
	for (let x of box.querySelectorAll(".status span")) x.classList.remove("show");
	box.querySelector(`.status span:nth-child(${idx+1})`).classList.add("show");
}

let touch = {start: [0, 0], end: [0, 0], move: [0, 0], offset: 50, disable: undefined};
const f_slideboxTouch = function(e) {
	const {type, target, touches} = e;
	const box = target.closest(".imgbox-wrapper");
	if (type == "touchend") {
		if (e.touches.length != 0) { return; }
		box.classList.remove("touch");
		set_style(box, "--move", "");
		touch.disable = undefined;

		if (touch.offset < Math.abs(touch.move[0])) {
			let idx = (get_style(box, "--idx") || 0)*1;
			if (0 < touch.move[0]) idx--;
			else idx++;
			if (idx < 0 || box.querySelectorAll("img").length == idx) { return; }
			f_slidebbox_move(box, idx);
		}
	} else if (touch.disable) {
		return;
	} else if (type == "touchstart") {
		if (touches.length != 1) return;
		box.classList.add("touch");
		touch.start = [e.touches[0].clientX, e.touches[0].clientY];
	} else if (type == "touchmove") {
		touch.end = [e.touches[0].clientX, e.touches[0].clientY];
		touch.move[0] = touch.end[0] - touch.start[0];
		touch.move[1] = touch.end[1] - touch.start[1];
		if (touch.disable === undefined && Math.abs(touch.move[0]) < Math.abs(touch.move[1])) {
			touch.disable = true;
			return;
		}
		e.preventDefault();
		touch.disable = false;
		set_style(box, "--move", touch.move[0] + "px");
	}
}


const f_like = async function(btn) {
	const box = btn.closest(".postbox, .commentbox");
	const boxname = box.className;
	const boxnum = box.getAttribute("num");
	const boxs = document.querySelectorAll(`.${boxname}[num='${boxnum}']`);

	const action = btn.querySelector("svg use").getAttribute("href") == "#svg-heart" ? "like" : "unlike";
	const svgHTML = action == "like" ? svg_heartFill : svg_heart;
	for (let x of boxs) {
		if (boxname == "postbox")
			x.querySelector(".icons button[title='Like']").innerHTML = svgHTML;
		else
			x.querySelector(".likebox button[title='Like']").innerHTML = svgHTML;
	}

	try {
		await axios.post("/posts/" + action, {boxname, boxnum});
		socket.emit("like", {action, boxname, boxnum});
	} catch(err) {
		const {message} = err.response.data;
		if (message) f_msgbox({type: "error", message});
	}
}

const f_likeList = async function(num) {
	history.pushState(null, null, `/posts/${num}/likeList`);
	const {users, arr} = (await axios.post("/posts/likeList", {num})).data;

	const section = userList({id: "likeList", title: `Likes`, users, arr});

	main.append(section);
}


const commentSubmit = async function(data) {
	const result = await axios.post("/posts/comment", data);
	socket.emit("newComment", result.data);
}
const f_comment = function(e) {
	if (e.preventDefault) e.preventDefault();
	if (!commentForm) return false;

	const {reply, comment} = commentForm;
	if (!comment.value.trim()) return false;

	const post_num = document.querySelector("#post").getAttribute("num");
	let data = {
		post_num,
		reply: reply?.value.trim(),
		comment: comment.value.trim(),
	}
	reply?.remove();
	comment.value = "";
	commentSubmit(data);
	return false;
}

let keys = [];
const f_comment_onkeydown = function(elem, e) {
	keys[e.keyCode] = true;
	if (e.keyCode == 8) {
		if (!elem.value) elem.parentNode.querySelector(".reply")?.remove();
	} else if (e.key == "Enter" && e.code != "Enter") {
		// mobile
	} else if (e.keyCode == 13 && !keys[16]) {
		e.preventDefault();
		if (elem.value.trim()) f_comment(elem.parentNode);
	}
}
const f_comment_onkeyup = function(elem, e) {
	keys[e.keyCode] = false;
	f_textarea(elem);
}
const f_reply = function(btn) {
	commentForm.querySelector(".reply")?.remove();
	const box = btn.closest(".commentbox");
	const span = document.createElement("span");
	span.className = "reply";
	span.setAttribute("userid", box.querySelector(".id").innerText);
	span.innerHTML = `<input name='reply' value='${box.getAttribute("num")}' hidden/>`;
	commentForm.prepend(span);
	commentForm.querySelector("[name='comment']").focus();

}

const newComment = function(data) {
	const ul = document.querySelector(`#post[num='${data.post_num}'] #commentbox-container`);
	if (!ul) return;

	const li = document.createElement("li");
	li.innerHTML = commentboxHTML;
	const commentbox = li.querySelector(".commentbox");
	if (data.user_num == user_num) commentbox.innerHTML += delBtn;

	li.querySelector(".avatar").style.backgroundImage = `url(${imgdir}/${data.User.avatar})`;
	li.querySelector("a.id").innerText = data.User.id;
	li.querySelector("a.id").href = "/" + data.User.id;
	li.querySelector(".date").innerText = dateFormat(data.updatedAt);
	li.querySelector(".comment").innerText = data.comment;
	li.querySelector(".info").innerHTML += "<label class='replyBtn'>Reply<button hidden type='button' onclick='f_reply(this);'></button></label>";
	commentbox.setAttribute("num", data.num);
	commentbox.innerHTML += `<span class='likebox'>
		${document.querySelector("button[title='Like']").outerHTML}
		<span class='likeNum'>${data.Likes.length}</span>
	</span>`;
	li.querySelector("button[title='Like'] svg").outerHTML = data.Likes.map(x => x.user_num).includes(user_num*1) ? svg_heartFill : svg_heart;

	let parent = ul;
	if (data.reply) {
		parent = post.querySelector(`.post-content .commentbox[num='${data.reply}']`);
		const mention = parent.querySelector(".id").innerText;
		li.querySelector(".comment").innerHTML = `<a href='/${mention}' class='mention'>@${mention}</a>` + li.querySelector(".comment").innerHTML;

		if (parent.closest("ul").parentNode.className != "post-content") {
			parent = parent.closest("ul").previousElementSibling;
		}
		if (!parent.nextElementSibling) {
			parent.after(document.createElement("ul"));
		}
		parent = parent.nextElementSibling;
	}
	parent.append(li);
}



const resize_loadPost = function() {
	const target = document.querySelector("#post");
	if (target) {
		set_style(target, "--window-height", window.innerHeight + "px");
	}
}
resize_loadPost();
window.addEventListener("resize", resize_loadPost);





socket.on("newComment", (data) => {
	newComment(data);
});

socket.on("like", ({action, boxname, boxnum}) => {
	const target = document.querySelector(`.${boxname}[num="${boxnum}"] .likeNum`);
	if (!target) return false;
	if (target.innerText == 0) target.parentNode.removeAttribute("hidden");
	target.innerText = target.innerText*1 + (action == "like" ? 1 : -1);
});
