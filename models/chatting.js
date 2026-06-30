const Sequelize = require("sequelize");

module.exports = class Chatting extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			message: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
		}, {
			sequelize,
			timestamps: true,
			underscored: false,
			modelName: 'Chatting',
			tableName: 'chatting',
			paranoid: true,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.belongsTo(models.User, {foreignKey: "user_num", targetKey: "num"});
		this.belongsTo(models.Chatroom, {foreignKey: "room_num", targetKey: "num"});
	}
};
