const Sequelize = require("sequelize");

module.exports = class Chatroom extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: Sequelize.TEXT,
				unique: true,
			},
		}, {
			sequelize,
			timestamps: false,
			underscored: false,
			modelName: 'Chatroom',
			tableName: 'chatroom',
			paranoid: false,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.hasMany(models.Chatting, {foreignKey: "room_num", sourceKey: "num"});
		this.hasMany(models.Chatjoin, {foreignKey: "room_num", sourceKey: "num"});
	}
};
