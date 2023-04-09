// Backend server 

const express = require('express');
const mysql = require("mysql2");
const app = express();
app.use(express.json());
const cors = require('cors');
const http = require('http');
app.use(cors());
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

var dp = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root123',
    database: 'chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


dp.connect((err) => {
  if (err) {
      console.error('Error connecting to the database:', err);
      return;
  }
  console.log('Connected to the MySQL database');
});

dp.query('USE chat;');

function createUserTable() {
    dp.query(
      "CREATE TABLE IF NOT EXISTS users (id INT NOT NULL AUTO_INCREMENT,username VARCHAR(255) NOT NULL,password VARCHAR(255) NOT NULL,name VARCHAR(255) NOT NULL,is_admin BOOLEAN NOT NULL,PRIMARY KEY (id)) ENGINE=InnoDB;",
      (err, results) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Users table created/checked");
        }
      }
    );
}

function createAdminUser() {
  dp.query("INSERT INTO users (username, password, name, is_admin) VALUES ('admin', 'admin1234', 'Admin User', 1)",
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Admin user created successfully");
      }
    }
  );
}

function createChannelsTable() {
  dp.query(
    `CREATE TABLE IF NOT EXISTS channels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    )`,
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Channels table created/checked');
      }
    }
  );
}

function createPostsTable() {
    dp.query(
    `CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        author VARCHAR(255) NOT NULL,
      channel_id INT NOT NULL,
      likes INT DEFAULT 0,
      dislikes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id)
      )`,
      (err, results) => {
        if (err) {
          console.log(err);
        } else {
        console.log('Posts table created/checked');
        }
      }
    );
}

function createCommentsTable() {
  dp.query('CREATE TABLE IF NOT EXISTS comments (id INT NOT NULL AUTO_INCREMENT, content TEXT NOT NULL, author VARCHAR(255) NOT NULL, post_id INT NOT NULL, PRIMARY KEY (id), FOREIGN KEY (post_id) REFERENCES posts(id)) ENGINE=InnoDB', (err, results) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Comments table created/checked');
    }
  });
};


createUserTable();
createAdminUser();
createChannelsTable();
createPostsTable();
createCommentsTable();
// Define a route for your API
app.get('/api/data', (req, res) => {
  // Query the database
  dp.query('SELECT * FROM your_table', (err, results, fields) => {
    if (err) throw err;

    // Return the results as JSON
    res.json(results);
  });
});
app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    dp.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error registering user');
        } else if (results.length > 0) { // username already exists
            res.status(409).send('Username already taken');
        } else { // username does not exist, insert new user
          dp.query("INSERT INTO users (username, password, name, is_admin) VALUES (?, ?, ?, ?)", [username, password, 'default_name', 0], (err, results) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Error registering user');
                } else {
                    res.status(201).send('User registered successfully');
                }
            });
        }
    });
});



app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(`Trying to log in with username: ${username}, password: ${password}`); // Add this line
    
    dp.query(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password], 
        (err, results) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error logging in');
            } else if (results.length === 0) { // no user found with the given credentials
                console.log('Invalid username or password'); // Add this line
                res.status(401).send('Invalid username or password');
            } else { // user found, login successful
                console.log('Login successful'); // Add this line
                res.status(200).send('Login successful');
            }
        }
    );
});


  
app.post('/channels', (req, res) => {
    const name = req.body.name;
  
    dp.query('INSERT INTO channels (name) VALUES (?)', [name], (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error creating channel');
      } else {
        res.status(201).send('Channel created successfully');
      }
    });
});


// Delete a channel by ID
app.delete('/channels', (req, res) => {
  const name = req.body.name;
  dp.query('SELECT id FROM channels WHERE name = ?', [name], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error deleting channel');
    } else {
      const channelId = results[0].id;
      dp.query('DELETE FROM posts WHERE channel_id = ?', [channelId], (err, results) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error deleting posts');
        } else {
  dp.query('DELETE FROM channels WHERE name = ?', [name], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error deleting channel');
    } else {
      res.status(200).send('Channel deleted successfully');
    }
  });
        }
      });
    }
  });
});

app.get('/channels', (req, res) => {
  dp.query('SELECT * FROM channels', (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error fetching channels');
    } else {
      res.status(200).json(results);
    }
  });
});
  
createPostsTable()
app.get('/channels/:channelId/posts', (req, res) => {
  const channelId = req.params.channelId;
  dp.query('SELECT * FROM posts WHERE channel_id = ?', [channelId], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error fetching posts');
    } else {
      // Fetch comments for each post and include them in the response
      let fetchedPosts = results;
      let postCount = fetchedPosts.length;
      let fetchedPostCount = 0;

      fetchedPosts.forEach((post, index) => {
        dp.query('SELECT * FROM comments WHERE post_id = ?', [post.id], (err, comments) => {
          if (err) {
            console.log(err);
            res.status(500).send('Error fetching comments');
          } else {
            fetchedPosts[index] = { ...post, comments };
            fetchedPostCount++;

            if (fetchedPostCount === postCount) {
              res.status(200).json(fetchedPosts);
            }
          }
        });
      });

      if (postCount === 0) {
        res.status(200).json([]);
      }
    }
  });
});




app.post('/channels/:channelId/posts', (req, res) => {
  const channelId = req.params.channelId;
  const content = req.body.content;
  const author = req.body.author;

  dp.query('INSERT INTO posts (content, author, channel_id) VALUES (?, ?, ?)', [content, author, channelId], (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error creating post');
      } else {
        res.status(201).send('Post created successfully');

        // emit new post event to the room
      io.to(channelId).emit('new post', {
          id: results.insertId,
          content,
          author,
          channel_id: channelId,
        });
      }
  });
});

app.delete('/channels/:channelId/posts/:postId', (req, res) => {
  const channelId = req.params.channelId;
  const postId = req.params.postId;
  const author = req.body.author;

  // Add a condition to check if the author is 'admin'
  if (author === 'admin') {
    // First, delete comments associated with the post
    dp.query('DELETE FROM comments WHERE post_id = ?', [postId], (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error deleting comments');
      } else {
        // Then, delete the post itself
        dp.query('DELETE FROM posts WHERE id = ? AND channel_id = ?', [postId, channelId], (err, results) => {
          if (err) {
            console.log(err);
            res.status(500).send('Error deleting post');
          } else {
            res.status(200).send('Post deleted successfully');
          }
        });
      }
    });
  } else {
    res.status(403).send('Unauthorized action');
  }
});


app.post('/posts/:postId/comments', (req, res) => {
  const postId = req.params.postId;
  const content = req.body.content;
  const author = req.body.author;

  if (!content) {
    return res.status(400).send('Comment content cannot be empty');
  }

  dp.query('INSERT INTO comments (content, author, post_id) VALUES (?, ?, ?)', [content, author, postId], (err, insertResults) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error creating comment');
    } else {
      res.status(201).send('Comment created successfully');
  
      // emit new comment event to the post's channel
      const channelIdQuery = 'SELECT channel_id FROM posts WHERE id = ?';
      const commentId = insertResults.insertId; // Store the insertId from the previous query
      dp.query(channelIdQuery, [postId], (err, channelIdResults) => {
        if (err) {
          console.log(err);
        } else {
          const channelId = channelIdResults[0].channel_id;
          io.to(channelId).emit('new comment', {
            id: commentId, // Use the stored insertId here
            content,
            author,
            post_id: postId,
          });
        }
      });
    }
  });
});

app.get('/posts/:postId/comments', (req, res) => {
  const postId = req.params.postId;

  dp.query('SELECT * FROM comments WHERE post_id = ?', [postId], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error fetching comments');
    } else {
      res.status(200).json(results);
    }
  });
});

app.patch('/posts/:postId/likes', (req, res) => {
  const postId = req.params.postId;

  dp.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error updating likes');
    } else {
      res.status(200).send('Likes updated successfully');
    }
  });
});

app.patch('/posts/:postId/dislikes', (req, res) => {
  const postId = req.params.postId;

  dp.query('UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?', [postId], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error updating dislikes');
    } else {
      res.status(200).send('Dislikes updated successfully');
    }
  });
});

//search 

app.get('/posts/search/:string', (req, res) => {
  const string = req.params.string;

  dp.query(`SELECT * FROM posts WHERE content LIKE '%${string}%'`, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error searching posts');
    } else {
      res.status(200).json(results);
    }
  });
});
app.get('/posts/author/:author', (req, res) => {
  const author = req.params.author;

  dp.query('SELECT * FROM posts WHERE author = ?', [author], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error searching posts');
    } else {
      res.status(200).json(results);
    }
  });
});
app.get('/posts/most', (req, res) => {
  dp.query('SELECT author, COUNT(*) as posts_count FROM posts GROUP BY author ORDER BY posts_count DESC LIMIT 1', (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error finding user with most posts');
    } else {
      res.status(200).json(results[0]);
    }
  });
});

app.get('/posts/least', (req, res) => {
  dp.query('SELECT author, COUNT(*) as posts_count FROM posts GROUP BY author ORDER BY posts_count LIMIT 1', (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error finding user with least posts');
    } else {
      res.status(200).json(results[0]);
    }
  });
});



app.get('/posts/:postId', (req, res) => {
  const postId = req.params.postId;
  dp.query('SELECT * FROM posts WHERE id = ?', [postId], (err, postResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error fetching post');
    } else {
      dp.query('SELECT * FROM comments WHERE post_id = ?', [postId], (err, commentsResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error fetching comments');
        } else {
          const postWithComments = {
            ...postResult[0],
            comments: commentsResult,
          };
          res.status(200).json(postWithComments);
        }
      });
    }
  });
});


// Socket.io configuration
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join room', (roomId) => {
        console.log(`User ${socket.id} joined room ${roomId}`);
        socket.join(roomId);
    });
    // Listen for 'post created' event from the clients
    socket.on('post created', (createdPost) => {
      console.log('Post created:', createdPost);
      socket.broadcast.emit('post created', createdPost);
  });

    // Listen for 'comment created' event from the clients
    socket.on('comment created', (createdComment) => {
      console.log('Comment created:', createdComment);
      socket.broadcast.emit('comment created', createdComment);
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });

    
});

server.listen(4000, () => {
    console.log('Server is running on port 4000');
  });