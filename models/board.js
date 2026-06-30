const Sequelize = require("sequelize");

module.exports = class Board extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			content: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
		}, {
			sequelize,
			timestamps: true,
			underscored: false,
			modelName: 'Board',
			tableName: 'board',
			paranoid: true,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.hasMany(models.Like, {foreignKey: "post_num", sourceKey: "num"});
		this.hasMany(models.File, {foreignKey: "post_num", sourceKey: "num"});
		this.hasMany(models.Comment, {foreignKey: "post_num", sourceKey: "num"});
		this.belongsTo(models.User, {foreignKey: "user_num", targetKey: "num"});
	}
};
