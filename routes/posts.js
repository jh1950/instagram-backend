const router = require("express").Router();
const {Sequelize, User, Board, File, Like, Comment, Follow} = require("../models");
const {Op} = Sequelize;



const fs = require("fs");
const path = require("path");





router.get("/upload", (req, res) => {
	req.app.locals.page_title = "Upload";
	res.render("upload.html", {uploadLimit, uploadSize});
});

router.post("/upload", async (req, res) => {
	const {content, images} = req.body;
	const {num, createdAt} = await Board.create({
		content,
		user_num: req.session.num
	});

	const timestamp = new Date(createdAt).getTime();
	images.slice(0, 10).forEach(({title, src}, idx) => {
		const ext = path.extname(title);
		const encode = src.replace(/^data:image\/([a-zA-Z]+);base64,/, "");
		const name = `${timestamp}-${idx}-` + path.basename(title).replace(/ /g, "-");
		fs.writeFileSync(imgdir + "/" + name, encode, "base64");

		File.create({name, post_num: num});
	});

	res.send();
});

router.post("/load", async (req, res) => {
	let {num} = req.body;
	if (!num) num = (await Board.findOne({
		attributes: ["num"],
		order: [["num", "DESC"]],
		limit: 1,
	}))?.num*1 + 1;

	let result = [];
	if (num) {
		const following = (await Follow.findAll({
			attributes: ["ed"],
			where: {er: req.session.num},
			raw: true,
		})).reduce((acc, {ed}) => {
			acc.push(ed);
			return acc;
		}, [req.session.num]);

		result = await Board.findAll({
			attributes: ["num", "user_num", "content", "createdAt", "updatedAt"],
			where: {
				num: {[Op.lt]: num},
				user_num: {[Op.in]: following},
			},
			include: [{
				model: User,
				attributes: ["id", "avatar"],
			}, {
				model: File,
				attributes: ["name"],
			}, {
				model: Like,
				attributes: ["user_num"],
			}, {
				model: Comment,
				attributes: ["num"],
			}],
			order: [["num", "DESC"]],
			limit: 10,
		});
	}

	res.send(result);
});

router.post("/", async (req, res) => {
	let {num, user_num} = req.body;
	if (!num) num = (await Board.findOne({
		attributes: ["num"],
		where: {user_num},
		order: [["num", "DESC"]],
		limit: 1,
	}))?.num*1 + 1;

	let result = [];
	if (num) {
		result = await Board.findAll({
			attributes: ["num"],
			where: {
				num: {[Op.lt]: num},
				user_num,
			},
			include: [{
				model: File,
				attributes: ["name"],
			}],
			order: [["num", "DESC"]],
			limit: 15,
		});
	}
	res.send(result);
});

router.post(["/like", "/unlike"], async (req, res) => {
	const {boxname, boxnum} = req.body;
	const user_num = req.session.num;
	const code = boxname == "postbox" ? 0 : 1;
	const where = {user_num};
	if (boxname == "postbox")
		where.post_num = boxnum;
	else
		where.comment_num = boxnum;

	let status = 200;
	const data = {};
	if (req.pathname == "/posts/like") {
		const check = await Like.findOne({
			attributes: ["num"],
			where,
		});

		if (check) {
			status = 409;
			data.message = "You've already pressed like.";
		} else {
			Like.create(where);
		}
	} else {
		Like.destroy({where});
	}

	res.status(status).send(data);
});

router.get("/:post_num/likeList", (req, res) => {
	res.send("<script>history.back(); setTimeout(function() { location.reload() }, 10)</script>");
});

router.post("/likeList", async (req, res) => {
	const post_num = req.body.num;

	const result = await Like.findAll({
		num: ["post_num"],
		where: {post_num},
		include: [{
			model: User,
			attributes: ["num", "id", "name", "avatar"],
		}],
	})


	let users = [];
	const likeList = result.reduce((acc, x) => {
		users.push(x.User);
		acc.push(x.User.num);
		return acc;
	}, []);

	const arr = (await Follow.findAll({
		attributes: ["ed"],
		where: {
			er: req.session.num,
			ed: {[Op.in]: likeList},
		},
	})).reduce((acc, {ed}) => {
		acc[ed] = true;
		return acc;
	}, {});

	res.send({users, arr});
});

router.post("/comment", async (req, res) => {
	const {post_num, reply, comment} = req.body;
	const {num} = await Comment.create({
		post_num, reply, comment,
		user_num: req.session.num,
	});
	const result = await Comment.findOne({
		attributes: ["num", "user_num", "post_num", "comment", "reply", "createdAt", "updatedAt"],
		where: {
			num
		},
		include: [{
			model: User,
			attributes: ["id", "avatar"],
		}, {
			model: Like,
			attributes: ["user_num"],
		}],
	});
	res.send(result);
});

router.delete("/delete", async (req, res) => {
	const {boxname, boxnum} = req.body;
	const user_num = req.session.num;
	const model = boxname == "postbox" ? Board : Comment;
	const author = user_num == (await model.findOne({
		attributes: ["user_num"],
		where: {num: boxnum}
	})).user_num;

	if (author) {
		model.destroy({
			where: {num: boxnum}
		});
		res.send({});
	} else {
		res.status(403).send({message: "Permission denied."});
	}
});

router.get("/:post_num", async (req, res, next) => {
	const {post_num} = req.params;
	const post = await Board.findOne({
		where: {
			num: post_num
		},
		include: [{
			model: User,
			attributes: ["id"],
		}],
	});
	if (post) {
		req.app.locals.page_title = post.User.id;
		res.render("post.html");
	} else next();
});

router.post("/:post_num", async (req, res) => {
	const {post_num} = req.params;

	const post = await Board.findOne({
		attributes: ["num", "user_num", "content", "createdAt", "updatedAt"],
		where: {
			num: post_num,
		},
		include: [{
			model: User,
			attributes: ["id", "avatar"],
		}, {
			model: File,
			attributes: ["name"],
		}, {
			model: Like,
			attributes: ["user_num"],
		}, {
			model: Comment,
			attributes: ["num"],
		}],
	});

	const comments = await Comment.findAll({
		attributes: ["num", "user_num", "post_num", "comment", "reply", "createdAt", "updatedAt"],
		where: {
			post_num
		},
		include: [{
			model: User,
			attributes: ["id", "avatar"],
		}, {
			model: Like,
			attributes: ["user_num"],
		}],
	});

	res.send({post, comments});
});





module.exports = router;
