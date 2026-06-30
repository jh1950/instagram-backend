const Sequelize = require("sequelize");

module.exports = class Follow extends Sequelize.Model {
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
			modelName: 'Follow',
			tableName: 'follow',
			paranoid: false,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.belongsTo(models.User, {foreignKey: "er", targetKey: "num"});
		this.belongsTo(models.User, {foreignKey: "ed", targetKey: "num"});
	}
};
