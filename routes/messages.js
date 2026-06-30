const router = require("express").Router();
const {Sequelize, User, Chatroom, Chatting, Chatjoin} = require("../models");
const {Op} = Sequelize;

const roomPerm = async function(num, room_num) {
	const room = await Chatroom.findOne({
		attributes: ["num", "name"],
		where: {num: room_num},
		include: [{
			model: Chatting,
			attributes: ["num"],
			order: [["num", "DESC"]],
			limit: 1,
		}],
	});

	if (room?.name?.includes(`_${num}_`)) {
		return room;
	} else {
		return false;
	}
}



router.get(["/", "/:room_num"], async (req, res) => {
	req.app.locals.page_title = "Messages";
	const {room_num} = req.params;

	const roomList = await Chatjoin.findAll({
		attributes: ["room_num"],
		where: {user_num: req.session.num},
		include: [{
			model: Chatroom,
			attributes: ["name"],
		}],
	});

	for (let i=0; i<roomList.length; i++) {
		const room = roomList[i];
		const num = room.Chatroom.name.replace(`_${req.session.num}_`, "").replace(/_/, "");
		roomList[i].User = await User.findOne({
			attributes: ["id", "avatar"],
			where: {num}
		});
	}

	res.render("messages.html", {roomList, room_num});
});

router.post("/join", async (req, res) => {
	const user_num = req.session.num;
	const users = [user_num, req.body.num].sort();
	const name = "_" + users.join("_") + "_";

	let room = await Chatroom.findOne({
		attributes: ["num"],
		where: {name},
	});

	if (!room) {
		room = await Chatroom.create({
			name
		});
	}

	const join = await Chatjoin.findOne({user_num});
	if (!join) Chatjoin.create({room_num: room.num, user_num});

	res.send({room_num: room.num});
});

router.post("/msg", async (req, res) => {
	const {message, room_num} = req.body;
	const perm = await roomPerm(req.session.num, room_num);

	let status = 200;
	let date = {};
	if (perm) {
		data = await Chatting.create({
			message, room_num,
			user_num: req.session.num,
		});

		data.dataValues.User = await User.findOne({
			attributes: ["id", "avatar"],
			where: {num: data.user_num},
		});

		const user_num = perm.name.replace(`_${req.session.num}_`, "").replace(/_/g, "");
		if (!(await Chatjoin.findOne({
			attributes: ["num"],
			where: {user_num,room_num: data.room_num},
		}))) {
			Chatjoin.create({room_num: data.room_num, user_num});
		}
	} else {
		status = 403;
	}

	res.status(status).send(data);
});

router.post("/load", async (req, res) => {
	let {num, room_num} = req.body;
	const perm = await roomPerm(req.session.num, room_num);

	let status = 200;
	let data = {name: perm.name};
	if (perm) {
		if (!num) num = (perm.Chattings[0]?.num || 0) + 1;

		data.chatting = await Chatting.findAll({
			attribites: ["num", "user_num", "message", "createdAt"],
			where: {
				num: {[Op.lt]: num},
			},
			include: [{
				model: User,
				attributes: ["id", "avatar"],
			}, {
				model: Chatroom,
				attributes: ["name"],
			}],
			order: [["num", "DESC"]],
			limit: 25,
		});
	} else {
		status = 403;
	}

	res.status(status).send(data);
});





module.exports = router;
