const crypto = require('crypto');
const Sequelize = require("sequelize");

const random = function(max, nin=0) {
	return (parseInt(Math.random() * 1000000000) % (max + 1 - nin)) + nin;
}

module.exports = class Crypto extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			id: {
				type: Sequelize.TEXT,
				allowNull: false,
				unique: false,
			},
			salt: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			n: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
		}, {
			sequelize,
			timestamps: false,
			underscored: false,
			modelName: 'Crypto',
			tableName: 'crypto',
			paranoid: false,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static salt() {
		return new Promise((res, rej) => {
			crypto.randomBytes(64, (err, buf) => {
				if (err) rej(err);
				else res(buf.toString("base64"));
			});
		});
	}

	static encrypt({plain, salt, n}) {
		return new Promise(async (res, rej) => {
			if (!salt) salt = await this.salt();
			if (!n) n = random(10000, 1000);
			crypto.pbkdf2(plain, salt, n, 64, "sha512", (err, key) => {
				if (err) rej(err);
				else res({hash: key.toString("base64"), salt, n});
			});
		});
	}

	static async userHash({id, pw, hash}) {
		const data = await this.findOne({
			attributes: ["salt", "n"],
			where: {id},
			raw: true
		})
		data.plain = pw;
		return (await this.encrypt(data)).hash;
	}
};
