const router = require("express").Router();
const { Op } = require("sequelize");
const { User, Crypto } = require("../models");

const disallow_id = ["", "login", "register", "logout", "delete", "posts", "settings", "follow", "unfollow", "messages"];

const multer = require("multer");
const path = require("path");
const upload = multer({
	storage: multer.diskStorage({
		destination(req, file, done) {
			done(null, imgdir);
		},
		filename(req, file, done) {
			const ext = path.extname(file.originalname);
			file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
			done(null, Date.now() + "-" + path.basename(file.originalname).replace(/ /g, "-"));
		}
	}),
	limits: {
		fileSize: uploadSize
	},
	fileFilter(req, file, done) {
		if (file.mimetype.startsWith("image/")) {
			done(null, true);
		} else {
			done("Only image files can be uploaded.", false);
		}
	},
});





router.get(["/login", "/register"], (req, res) => {
	if (req.session.num) {
		res.redirect("/");
		return;
	}

	let titles = ["Login", "Register"];
	if (`/${titles[0].toLowerCase()}` != req.pathname) titles.reverse();
	req.app.locals.page_title = titles[0];
	res.render("login.html", {titles});
});



router.post("/login", async (req, res, next) => {
	const {id, pw} = req.body;
	const result = await User.findOne({
		attributes: ["num", "pw", "avatar"],
		where: {
			id
		},
	});

	let num = result?.num;
	let status = 400;
	const data = {};
	if (!result) {
		data.focus = "id";
		data.message = "ID is not exist.";
	} else if (result.pw != await Crypto.userHash({id, pw})) {
		data.focus = "pw";
		data.message = "ID and Password do not match.";
	} else {
		status = 200;
	}
	req.login = {status, data, id, num, avatar: result?.avatar};
	next();
});

router.post("/register", async (req, res, next) => {
	const {email, name, id, pw, pwc} = req.body;
	const result = await User.findAll({
		attributes: ["email", "id", "pw"],
		where: {
			[Op.or]: [{email}, {id}]
		},
	});



	let num;
	let status = 400;
	const data = {};
	if (result.length == 2 || result[0]?.email == email) {
		data.focus = "email";
		data.message = "This email is already subscribed.";
	} else if (disallow_id.includes(id.toLowerCase()) || result[0]?.id == id) {
		status = 409;
		data.focus = "id";
		data.message = "The ID is not available.";
	} else if (id.length < 4 || pw.length < 4) {
		data.focus = id.length < 4 ? "id" : "pw";
		data.message = "Please enter your ID and Password at least 4 digits.";
	} else if (pw != pwc) {
		data.focus = "pwc";
		data.message = "Please check the password again.";
	} else if (id.replace(/[a-zA-Z0-9]/g, "")) {
		data.focus = "id";
		data.message = "The ID can only be alphabetic and numeric.";
	} else if (id.replace(/[a-zA-Z0-9!@#$%^&*()_+=-]/g, "")) {
		data.focus = "pw";
		data.message = "Passwords can only be alphabetic, numeric, and some special characters(!@#$%^&*()-_=+).";
	} else {
		try {
			const {hash, salt, n} = await Crypto.encrypt({plain: pw});
			num = (await User.create({email, id, pw: hash, name})).num;
			await Crypto.create({id, salt, n});
			status = 201;
		} catch(err) {
			console.error(err);
			data.message = "There was a problem creating your account.";
		}
	}
	req.login = {status, data, id, num, avatar: "avatar.jpg"};
	next();
});

router.post(["/login", "/register"], async (req, res) => {
	const {status, data, id, num, avatar} = req.login;
	if (!data.message) {
		req.session.userid = id;
		req.session.num = num;
		req.session.avatar = avatar;
	}
	res.status(status).send(data);
});



router.use((req, res, next) => {
	if (!req.session.num) {
		res.redirect("/login");
		return;
	}

	for (let key in req.session) {
		if (["cookie", "num"].includes(key)) continue;
		req.app.locals[key] = req.session[key];
	}

	req.app.locals.login = true;
	req.app.locals.user_num = req.session.num;
	next();
});



router.get("/logout", (req, res, next) => {
	req.sessDel = true;
	next();
});

router.delete("/delete", async (req, res, next) => {
	const id = req.session.userid;
	const {pw} = req.body;

	if ((await User.findOne({attributes: ["pw"], where: {id}, raw: true})).pw != await Crypto.userHash({id, pw})) {
		res.status(401).send({message: "Invalid password."});
		return;
	}
	User.destroy({
		where: {id: req.session.userid}
	});
	Crypto.destroy({
		where: {id: req.session.userid}
	});

	req.sessDel = true;
	next();
});

router.use(["/logout", "/delete"], (req, res, next) => {
	if (req.sessDel === true) {
		res.cookie(cookieName, "", {maxAge: 0});
		req.session.destroy();
		if (req.pathname == "/logout") res.redirect("/login");
		else res.send({});
	} else {
		next();
	}
});



router.post("/avatar", upload.single("avatar"), (req, res) => {
	const {filename} = req.file;

	User.update({
		avatar: filename
	}, {
		where: {num: req.session.num}
	})
	req.session.avatar = filename;

	res.send({filename});
});



router.get("/edit", async (req, res) => {
	req.app.locals.page_title = "Edit Profile";

	const user = await User.findOne({
		attributes: ["id", "name", "email", "bio", "avatar"],
		where: {num: req.session.num},
		raw: true,
	});

	res.render("profile.html", {user});
});

router.put("/edit", async (req, res) => {
	const {id, name, bio} = req.body;

	let status = 400;
	const data = {focus: "id"};
	if (!name) {
		data.focus = "name";
		data.message = "Name cannot be empty.";
	} else if (id.length < 4) {
		data.focus = "id";
		data.message = "Please enter your ID at least 4 digits.";
	} else if (id.replace(/[a-zA-Z0-9]/g, "")) {
		data.focus = "id";
		data.message = "The ID can only be alphabetic and numeric.";
	} else {
		const user = await User.findOne({
			where: {id}
		});

		if (user && user.id != req.session.userid || disallow_id.includes(id.toLowerCase())) {
			status = 409;
			data.message = "The ID is not available.";
		} else {
			status = 201;
			const user = await User.update({
				id, name, bio
			}, {
				where: {num: req.session.num}
			});

			req.session.userid = id;
			delete data.focus;
			data.id = id;
		}
	}
	res.status(status).send(data);
});




module.exports = router;
