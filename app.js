const dotenv = require("dotenv");
dotenv.config();

global.env = process.env.NODE_ENV;
global.port = process.env.PORT;
global.title = process.env.TITLE;
global.site_title = process.env.TITLE;
global.cookieName = process.env.COOKIE;
global.maxAge = eval(process.env.MAXAGE);
global.uploadSize = eval(process.env.UPLOAD_SIZE);
global.uploadLimit = eval(process.env.UPLOAD_LIMIT);
global.views = "./views";
global.data = "./data";
global.assets = "./assets";
global.imgdir = assets + "/images";





const fs = require("fs");
const path = require("path");
const http = require("http");
const { sequelize, Follow, Chatting, Chatroom, Chatjoin } = require("./models");

const express = require("express");
const expressSession = require("express-session");
const layouts = require("express-ejs-layouts");
const socketSession = require("express-socket.io-session");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const sassMiddleware = require("node-sass-middleware");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const config = require("./config/config.json")[env];

/* // mysql
const mysql = require("mysql2/promise");
const sessionStore = require("express-mysql-session")(expressSession);
config.user = config.username;
config.port = process.env.MYSQL_PORT;
*/

const sqlite = require("sqlite3");
const sessionStore = require("express-session-sqlite").default(expressSession);
config.driver = sqlite.Database;
config.path = config.storage;
config.ttl = maxAge;





try {
	fs.readdirSync(imgdir);
} catch (err) {
	fs.mkdirSync(imgdir);
}

sequelize.sync().catch((err) => {
	console.log(err);
	console.log("DB Connection Failed.");
	process.exit(1);
});

const session = expressSession({
	resave: false,
	saveUninitialized: false,
	secret: process.env.SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
		maxAge: maxAge,
	},
	name: cookieName,
	store: new sessionStore(config),
})





app.use(sassMiddleware({
	src: "./sass",
	dest: assets + "/css",
	outputStyle: "compressed",
	prefix: "/css",
	sourceMap: false,
	debug: false,
	force: true,
}));
app.use(layouts);
app.use(express.urlencoded({limit: uploadSize, extended: false}));
app.use(express.json({limit: uploadSize}));
app.use(cookieParser());
app.use(session);

app.use(express.static(assets));
app.set("views", views);
app.set("view engine", "html");
app.set("layout extractScripts", true)
app.engine("html", ejs.renderFile);

app.use((req, res, next) => {
	app.locals.page_title = "Untitled";
	app.locals.login = false;
	app.locals.imgdir = imgdir.replace(new RegExp(assets), "");
	req.pathname = req.baseUrl + req.path;
	app.locals.pathname = req.pathname;
	next();
});





app.use("/", require("./routes/account"));
app.use("/", require("./routes"));
app.use("/posts", require("./routes/posts"));
app.use("/messages", require("./routes/messages"));





app.use((req, res) => {
	app.locals.page_title = "Error";
	res.status(404).render("error.html");
});

server.listen(port, () => {
	console.log(`URL: http://localhost:${port}`);
});










io.use(socketSession(session, {
	autoSave: true
}));

io.on("connection", (socket) => {
	const session = socket.handshake.session;

	socket.on("newPost", async () => {
		const users = (await Follow.findAll({
			attributes: ["er"],
			where: {ed: session.num},
			raw: true,
		})).reduce((acc, {er}) => {acc.push(er); return acc}, []);
		io.emit("newPost", users);
	});

	socket.on("newComment", async (data) => {
		io.emit("newComment", data);
	});

	socket.on("like", async (data) => {
		io.emit("like", data);
	});

	socket.on("join", async ({name}) => {
		const user_num = session.num;
		if (!name.includes(`_${user_num}_`)) return;

		const result = await Chatroom.findOne({
			attributes: ["num"],
			where: {name},
			include: [{
				model: Chatjoin,
				attributes: ["user_num"],
				where: {user_num}
			}],
		});

		if (!result?.Chatjoins[0].user_num == user_num) return;
		socket.handshake.session.roomName = name;
		socket.handshake.session.save();
		socket.join(name);
	});

	socket.on("newMessage", async (data) => {
		io.to(session.roomName).emit("newMessage", data);
	});
});
