const postsDb = require('../config/postQueries');
const { validationResult } = require('express-validator');



async function listAllPosts(req, res, next) {
    try {
        const posts = await postsDb.getAllPosts();
        res.render('home', {
            posts
        });
    } catch (err) {
        next(err);
    }
};

async function getPostCreationForm(req, res, next) {
    res.render("create-post-form");
};

async function createPost(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('create-post-form', { 
            errors: errors.array(),
            post: {
                title: req.body.title,
                message: req.body.message
            }
        });
    }

    const userId = req.user.id;
    const title = req.body.title;
    const message = req.body.message;

    try {
        await postsDb.createPost(title, message, userId);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating post");
    }
};

async function deletePost(req, res, next) {
    try {
        await postsDb.deletePost(req.params.postId);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting post");
    }
}

module.exports = {
    listAllPosts,
    getPostCreationForm,
    createPost,
    deletePost
}








// ----------- transplantado do inventory app (for reference)

/*
async function getAllGames(req, res) {
    const games = await gamesDb.getAllGames();
    res.render("main", { title: "All games", games, links });
};

async function getGamesByPlatform(req, res) {
    const platform = await platformsDb.getPlatform(req.params.platformId);
    const platformName = platform[0].name;
    const games = await gamesDb.getGamesByPlatform(req.params.platformId);
    res.render("main", { title: `${platformName} games`, games, links })
};

async function getGamesByTag(req, res) {
    const tag = await tagsDb.getTag(req.params.tagId);
    const tagName = tag[0].name;
    const games = await gamesDb.getGamesByTag(req.params.tagId);
    res.render("main", { title: `${tagName} games`, games, links })
};

async function getGame(req, res) {
    const game = await gamesDb.getGame(req.params.gameId);
    const gamePlatforms = await gamesDb.getGamePlatforms(req.params.gameId);
    const gameTags = await gamesDb.getGameTags(req.params.gameId);
    res.render('game_views/gameDetails', { links, game: game[0], gamePlatforms, gameTags });
};

async function updateGameGet(req, res) {
    const game = await gamesDb.getGame(req.params.gameId);
    const platforms = await platformsDb.getAllPlatforms();
    const tags = await tagsDb.getAllTags();
    const gamePlatforms = await gamesDb.getGamePlatforms(req.params.gameId);
    const gameTags = await gamesDb.getGameTags(req.params.gameId);
    res.render('game_views/updateGameForm', { title: "Edit game", game: game[0], platforms, gamePlatforms, tags, gameTags, links });
};

async function createGameGet(req, res) {
    const platforms = await platformsDb.getAllPlatforms();
    const tags = await tagsDb.getAllTags();
    res.render('game_views/newGameForm', { title: 'New game form', platforms, tags, links });
};

async function createGamePost(req, res) {
    const title = req.body.title;
    const release_year = req.body.release_year;
    const min_players = req.body.min_players;
    const max_players = req.body.max_players;
    const image_url = req.body.image_url;

    try {
        const gameId = await gamesDb.insertGame(title, release_year, min_players, max_players, image_url);

        if (Array.isArray(req.body.platforms)) {
            req.body.platforms.map(async plat => await gamesDb.insertGamePlatform(gameId, Number(plat)));

        }
        else if (req.body.platforms) {
            await gamesDb.insertGamePlatform(gameId, Number(req.body.platforms));
        }
        
        if (Array.isArray(req.body.tags)) {
            req.body.tags.map(async tag => await gamesDb.insertGameTag(gameId, Number(tag)));

        }
        else if (req.body.tags) {
            await gamesDb.insertGameTag(gameId, Number(req.body.tags));
        }


        res.redirect('/');
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error creating game");
    }
};

async function updateGamePost(req, res) {
    const gameId = req.params.gameId;
    const title = req.body.title;
    const release_year = req.body.release_year;
    const min_players = req.body.min_players;
    const max_players = req.body.max_players;
    const image_url = req.body.image_url;
    await gamesDb.updateGame(gameId, title, release_year, min_players, max_players, image_url);


    const checkedPlatforms = [];
    const checkedTags = [];


    if (Array.isArray(req.body.platforms)) {
        req.body.platforms.forEach(p => checkedPlatforms.push(Number(p)));
    }
    else if (req.body.platforms) { checkedPlatforms.push(Number(req.body.platforms)); }

    if (Array.isArray(req.body.tags)) {
        req.body.tags.forEach(t => checkedTags.push(Number(t)));
    }
    else if(req.body.tags) { checkedTags.push(Number(req.body.tags)); }


    await gamesDb.insertGamePlatformsForUpdate(gameId, checkedPlatforms);
    await gamesDb.insertGameTagsForUpdate(gameId, checkedTags);

    res.redirect(`/game/${gameId}`);
};

async function deleteGamePost(req, res) {
    const gameId = req.params.gameId;
    await gamesDb.deleteGame(gameId);
    res.redirect('/');
};



module.exports = {
    getAllGames,
    getGame,
    createGameGet,
    createGamePost,
    updateGameGet,
    updateGamePost,
    deleteGamePost,
    getGamesByPlatform,
    getGamesByTag
}

*/
