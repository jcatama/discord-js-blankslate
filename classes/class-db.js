/**
 * @name: DB
 * @description: This class is responsible for handling database functions
 */

const Sequelize = require('sequelize');

class DB {

    /**
     * @param {String} guild_id
     */
    constructor(guild_id) {
        this.guild_id = guild_id;
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: `./db/${guild_id}.sqlite`
        });
    }

    /**
     * @description: This function is responsible for initializing the database
     */
    initialize() {
        let leaderboards = this.sequelize.define('leaderboards', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            message_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            channel_id: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: false
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            status: {
                type: Sequelize.TINYINT,
                defaultValue: 1
            },
            target_points: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            prize: {
                type: Sequelize.STRING,
                allowNull: false
            },
            content: {
                type: Sequelize.STRING,
                allowNull: true
            },
            thumbnail: {
                type: Sequelize.STRING,
                allowNull: true
            },
            required_role: {
                type: Sequelize.STRING,
                allowNull: true
            }
        });

        let points = this.sequelize.define('points', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false
            },
            leaderboard_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            points: {
                type: Sequelize.INTEGER,
                allowNull: false
            }
        });

        points.belongsTo(leaderboards, {
            foreignKey: 'leaderboard_id',
            targetKey: 'id',
        });

        // NOTE: Do not use force: true in production
        const dbmode = { alter: false, force: false };
        leaderboards.sync(dbmode);
        points.sync(dbmode);

        this.Leaderboards = leaderboards;
        this.Points = points;
    }
}

module.exports = { DB }
