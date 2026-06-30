const Sequelize = require("sequelize");

module.exports = class Like extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
		}, {
			sequelize,
			timestamps: false,
			underscored: false,
			modelName: 'Like',
			tableName: 'likes',
			paranoid: false,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.belongsTo(models.User, {foreignKey: "user_num", targetKey: "num"});
		this.belongsTo(models.Board, {foreignKey: "post_num", targetKey: "num"});
		this.belongsTo(models.Comment, {foreignKey: "comment_num", targetKey: "num"});
	}
};
