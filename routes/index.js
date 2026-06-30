const router = require("express").Router();
const {Sequelize, sequelize, User, Board, Follow} = require("../models");
const { Op } = Sequelize;





router.get("/", (req, res) => {
	req.app.locals.page_title = "Home";
	res.render("home.html");
});

router.get("/settings", (req, res) => {
	req.app.locals.page_title = "Settings";
	res.render("settings.html");
});

router.get("/:userid", async (req, res, next) => {
	const id = req.params.userid;
	let user = await User.findOne({
		attributes: ["num", "id", "name", "bio", "avatar"],
		where: {
			id
		},
		include: [{
			model: Board,
			attributes: [[sequelize.fn("COUNT", sequelize.col("*")), "count"]],
		}],
	});

	if (user.num) {
		const {num, id, name, bio, avatar} = user;
		let result = await Follow.findAll({
			attributes: ["er", "ed"],
			where: {
				[Op.or]: [{er: num}, {ed: num}]
			},
			raw: true,
		});

		const data = {
			follow: {er: 0, ing: 0, follow: false},
			user: {num, name, id, bio, avatar},
			posts: user.Boards[0]?.dataValues.count,
		};
		for (let x of result) {
			if (x.er == req.session.num && x.ed == num) data.follow.follow = true;
			if (x.er == num) data.follow.ing += 1;
			else data.follow.er += 1;
		}

		req.app.locals.page_title = id;
		res.render("user.html", data);
	} else next();
});

router.post(["/follow", "/unfollow"], (req, res) => {
	const er = req.body.rev ? req.body.num : req.session.num;
	const ed = req.body.rev ? req.session.num : req.body.num;

	if (req.pathname == "/follow") {
		Follow.create({er, ed});
	} else {
		console.log(er, ed);
		Follow.destroy({where: {er, ed}});
	}

	res.send();
});

router.post(["/follower", "/following"], async (req, res) => {
	const where = {};
	const key = req.pathname == "/follower" ? "ed" : "er";
	where[key] = req.body.num;

	const result = (await Follow.findAll({
		attributes: ["er", "ed"],
		where,
	})).reduce((acc, x) => {
		acc.push(x[key == "er" ? "ed" : "er"]);
		return acc;
	}, []);

	const users = await User.findAll({
		attributes: ["num", "id", "name", "avatar"],
		where: {
			num: {[Op.in]: result},
		},
	});

	const arr = (await Follow.findAll({
		attributes: ["ed"],
		where: {
			er: req.session.num,
			ed: {[Op.in]: result},
		},
		raw: true,
	})).reduce((acc, {ed}) => {
		acc[ed] = true;
		return acc;
	}, {});

	res.send({users, arr});
});

router.get(["/:userid/follower", "/:userid/following"], (req, res) => {
	res.send("<script>history.back(); setTimeout(function() { location.reload() }, 10)</script>");
});





module.exports = router;
