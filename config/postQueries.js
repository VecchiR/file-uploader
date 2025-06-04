const { pool } = require("./client");


async function getAllPosts() {
  const { rows } = await pool.query("SELECT posts.id, posts.author_id, posts.title, posts.message, posts.created_at, users.username FROM posts JOIN users ON posts.author_id = users.id ORDER BY created_at DESC");
  return rows;
}

async function createPost(title, message, userId) {
  await pool.query("INSERT INTO posts (title, message, author_id) VALUES ($1, $2, $3)", [title, message, userId]);
}

async function deletePost(postId) {
  await pool.query("DELETE FROM posts WHERE id = ($1)", [postId]);
}

module.exports = {
  getAllPosts,
  createPost,
  deletePost
}

/*

async function getGame(gameId) {
  const { rows } = await pool.query(`SELECT * FROM games WHERE id = ($1)`, [gameId]);
  return rows;
};

async function getGamesByPlatform(platformId) {
  const { rows } = await pool.query(`
    SELECT * FROM games JOIN game_platforms ON id = game_id 
    WHERE platform_id = ($1)`, [platformId]);
  return rows;
};

async function getGamesByTag(tagId) {
  const { rows } = await pool.query(`
    SELECT * FROM games JOIN game_tags ON id = game_id 
    WHERE tag_id = ($1)`, [tagId]);
  return rows;
};


async function insertGame(title, release_year, min_players, max_players, image_url) {
  if (!image_url) { image_url = '/default-image.jpg' }
  const result = await pool.query("INSERT INTO games (title, release_year, min_players, max_players, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING id", [title, release_year, min_players, max_players, image_url]);
  return result.rows[0].id;
}

async function updateGame(gameId, title, release_year, min_players, max_players, image_url) {
  if (!image_url) { image_url = '/default-image.jpg' }
  await pool.query("UPDATE games SET (title, release_year, min_players, max_players, image_url) = ($2, $3, $4, $5, $6) WHERE  id = ($1)", [gameId, title, release_year, min_players, max_players, image_url]);
}

async function deleteGame(gameId) {
  await pool.query("DELETE FROM games WHERE id = ($1)", [gameId]);
}

async function getGamePlatforms(gameId) {
  const { rows } = await pool.query(`
    SELECT * 
    FROM platforms JOIN game_platforms ON (id = platform_id)
    WHERE game_id = ($1)
    `, [gameId]);
  return rows;
}

async function insertGamePlatform(gameId, platformId) {
  await pool.query("INSERT INTO game_platforms (game_id, platform_id) VALUES ($1, $2)", [gameId, platformId]);
}

async function insertGamePlatformsForUpdate(gameId, platformIds) {
  if (platformIds.length === 0) {

    await pool.query(`
      DELETE FROM game_platforms
      WHERE game_id = ${gameId}
        `);
    return;
  }
  const values = `${platformIds.map(p => "(" + gameId + "," + p + ")")}`;
  try {
    await pool.query(
      `INSERT INTO game_platforms (game_id, platform_id)
       SELECT * FROM (VALUES ${values} ) AS new_entries(game_id, platform_id)
        WHERE NOT EXISTS (
       SELECT 1 FROM game_platforms 
        WHERE game_id = new_entries.game_id 
        AND platform_id = new_entries.platform_id)
        `
    );
  } catch (error) {
    console.log("query to add error");
    console.log(error);

  }


  try {
    await pool.query(`
    DELETE FROM game_platforms
    WHERE game_id = ${gameId}
    AND (game_id, platform_id) NOT IN (
    SELECT game_id, platform_id
    FROM (VALUES ${values}) AS checked(game_id, platform_id)
    )
      `);
  } catch (error) {
    console.log("query to delete error");
    console.log(error);
  }

}



async function getGameTags(gameId) {
  const { rows } = await pool.query(`
    SELECT * 
    FROM tags JOIN game_tags ON (id = tag_id)
    WHERE game_id = ($1)
    `, [gameId]);
  return rows;
}

async function insertGameTag(gameId, tagId) {
  await pool.query("INSERT INTO game_tags (game_id, tag_id) VALUES ($1, $2)", [gameId, tagId]);
}

async function insertGameTagsForUpdate(gameId, tagIds) {
  if (tagIds.length === 0) {

    await pool.query(`
      DELETE FROM game_tags
      WHERE game_id = ${gameId}
        `);
    return;
  }
  const values = `${tagIds.map(p => "(" + gameId + "," + p + ")")}`;
  try {
    await pool.query(
      `INSERT INTO game_tags (game_id, tag_id)
       SELECT * FROM (VALUES ${values} ) AS new_entries(game_id, tag_id)
        WHERE NOT EXISTS (
       SELECT 1 FROM game_tags 
        WHERE game_id = new_entries.game_id 
        AND tag_id = new_entries.tag_id)
        `
    );
  } catch (error) {
    console.log("query to add error");
    console.log(error);

  }


  try {
    await pool.query(`
    DELETE FROM game_tags
    WHERE game_id = ${gameId}
    AND (game_id, tag_id) NOT IN (
    SELECT game_id, tag_id
    FROM (VALUES ${values}) AS checked(game_id, tag_id)
    )
      `);
  } catch (error) {
    console.log("query to delete error");
    console.log(error);
  }

}


module.exports = {
  getAllGames,
  getGame,
  insertGame,
  updateGame,
  deleteGame,
  getGamePlatforms,
  insertGamePlatform,
  insertGamePlatformsForUpdate,
  getGameTags,
  insertGameTag,
  insertGameTagsForUpdate,
  getGamesByPlatform,
  getGamesByTag
};
*/