const Sequelize = require("sequelize");

module.exports = class Comment extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			comment: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			reply: {
				type: Sequelize.INTEGER,
			},
		}, {
			sequelize,
			timestamps: true,
			underscored: false,
			modelName: 'Comment',
			tableName: 'comment',
			paranoid: true,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.hasMany(models.Like, {foreignKey: "comment_num", sourceKey: "num"});
		this.belongsTo(models.User, {foreignKey: "user_num", targetKey: "num"});
		this.belongsTo(models.Board, {foreignKey: "post_num", targetKey: "num"});
	}
};
