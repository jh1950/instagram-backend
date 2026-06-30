const Sequelize = require("sequelize");

module.exports = class Chatjoin extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
		}, {
			sequelize,
			timestamps: true,
			underscored: false,
			modelName: 'Chatjoin',
			tableName: 'chatjoin',
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
