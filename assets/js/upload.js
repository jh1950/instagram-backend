const submit = document.createElement("button");
submit.type = "submit";
submit.setAttribute("form", "uploadForm");
headerButton({type: "next", elem: submit});
headerButton({type: "prev"});



const ul = document.querySelector("#preview ul");
const preview = async function(files) {
	let error;
	for (let file of files) {
		if (!file.type.startsWith("image/")) {
			error = "type";
			continue;
		} else if (uploadLimit <= ul.children.length) {
			error = "max";
			break;
		} else if (uploadSize < file.size) {
			error = "size";
			continue;
		}

		let li = document.createElement("li");
		let img = document.createElement("img");
		img.src = await imageReader(file);
		img.title = file.name;
		li.append(img);
		ul.append(li);
		li.onclick = function() {
			if (confirm("Do you want to delete the selected picture?")) {
				this.remove();
			}
		}
	}
	input.value = "";

	if (error) {
		let message;
		if (error == "type") message = "Only image files can be uploaded.";
		else if (error == "size") message = `You cannot upload a capacity larger than ${uploadSize/1024/1024}BM.`;
		else if (error == "max") message = `You can only upload up to ${uploadLimit} images.`;
		f_msgbox({type: "error", message});
	}
}

document.addEventListener("dragover", function(e) {
	e.preventDefault();
	uploadForm.classList.add("drag");
});
document.addEventListener("dragleave", function(e) {
	e.preventDefault();
	if (e.x == 0 && e.y == 0) uploadForm.classList.remove("drag");
});
document.addEventListener("drop", function(e) {
	e.preventDefault();
	uploadForm.classList.remove("drag");
	const files = e.dataTransfer.files;
	if (files.length) {
		preview(files);
	} else {
		f_msgbox({type: "error", message: "Failed to load image. Please try again."});
	}
});



const uploadLeave = function(e) {
	e.preventDefault();
}
const f_uploadLeave = function(area) {
	if (area.value) {
		window.addEventListener("beforeunload", uploadLeave);
	} else {
		window.removeEventListener("beforeunload", uploadLeave);
	}
}





uploadForm.addEventListener("submit", async function(e) {
	e.preventDefault();
	try {
		let images = [];
		for (let {title, src} of ul.querySelectorAll("img")) {
			images.push({title, src});
		}
		await axios.post(location.pathname, {
			images, content: uploadForm.content.value.trim()
		});
		socket.emit("newPost");
		window.removeEventListener("beforeunload", uploadLeave);
		location.replace("/");
	} catch(err) {
		let {message, focus} = err.response.data;
		if (focus) document.querySelector(`[name="${data.focus}"]`).focus();
		if (message) f_msgbox({type: "error", message});
	}
});
