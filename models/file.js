const Sequelize = require("sequelize");

module.exports = class File extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			num: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
		}, {
			sequelize,
			timestamps: false,
			underscored: false,
			modelName: 'File',
			tableName: 'files',
			paranoid: false,
			charset: 'utf8',
			collate: 'utf8_general_ci',
		});
	}

	static associate(models) {
		this.belongsTo(models.Board, {foreignKey: "post_num", targetKey: "num"});
	}
};
