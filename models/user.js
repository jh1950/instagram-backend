const Sequelize = require("sequelize");

module.exports = class User extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			id: {
				type: Sequelize.STRING(20),
				allowNull: false,
				unique: false,
			},
			pw: {
				type: Sequelize.STRING(50),
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING(20),
				allowNull: false,
				unique: false,
			},
			bio: {
				type: Sequelize.STRING(1024),
				allowNull: true,
				unique: false,
			},
			email: {
				type: Sequelize.STRING(64),
				allowNull: false,
				unique: false,
			},
			avatar: {
				type: Sequelize.STRING(100),
				defaultValue: "avatar.jpg",
			},
		}, {
			sequelize,
			timestamps: true,
			underscored: false,
			modelName: 'User',
			tableName: 'users',
			paranoid: true,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.hasMany(models.Board, {foreignKey: "user_num", sourceKey: "num"});
		this.hasMany(models.Like, {foreignKey: "user_num", sourceKey: "num"});
		this.hasMany(models.Comment, {foreignKey: "user_num", sourceKey: "num"});
		this.hasMany(models.Chatting, {foreignKey: "user_num", sourceKey: "num"});
		this.hasMany(models.Follow, {foreignKey: "er", sourceKey: "num"});
		this.hasMany(models.Follow, {foreignKey: "ed", sourceKey: "num"});
	}
};
