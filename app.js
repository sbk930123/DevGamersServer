const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const uuid = require('uuid');


app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('Request:', req.method, req.url, req.body);
  next();
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});

app.post('/api/checkDuplicate', async (req, res) => {
  const { email } = req.body;
  const isDuplicate = await checkDuplicateEmail(email);
  res.send({ isDuplicate });
});

function checkDuplicateEmail(email) {
  return new Promise((resolve, reject) => {
    fs.readFile('./userInfo.json', (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        const userInfo = JSON.parse(data);
        const isDuplicate = userInfo.some((user) => user.email === email);
        resolve(isDuplicate);
      }
    });
  });
}

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, dateOfBirth } = req.body;

    const isDuplicate = await checkDuplicateEmail(email);

    if (isDuplicate) {
      res.status(400).send({ success: false, message: 'This email is already registered.' });
    } else {
      const user = { username, email, password, dateOfBirth };

      fs.readFile('./userInfo.json', (err, data) => {
        if (err) {
          console.error(err);
          res.status(500).send({ success: false, message: 'Failed to read user data.' });
        } else {
          const userInfo = JSON.parse(data);
          userInfo.push(user);

          fs.writeFile('./userInfo.json', JSON.stringify(userInfo, null, 4), (err) => {
            if (err) {
              console.error(err);
              res.status(500).send({ success: false, message: 'Failed to register user.' });
            } else {
              res.send({ success: true, message: 'Successfully registered.' });
            }
          });
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Unexpected error occurred.' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  fs.readFile('./userInfo.json', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send({ success: false, message: 'Failed to read user data.' });
    } else {
      const userInfo = JSON.parse(data);
      const user = userInfo.find((user) => user.email === email);

      if (!user) {
        res.status(400).send({ success: false, message: 'User not found.' });
      } else if (user.password !== password) {
        res.status(400).send({ success: false, message: 'Incorrect password.' });
      } else {
        res.send({ success: true, message: 'Successfully logged in.', user });
      }
    }
  });
});

// 게시판 관련 요청 //

app.post('/api/newPost', (req, res) => {
  const { title, content, author } = req.body;

  const postId = uuid.v4();
  const post = { postId, title, content, author };

  fs.readFile('./posts.json', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send({ success: false, message: 'Failed to read post data.' });
    } else {
      const posts = JSON.parse(data);
      posts.push(post);

      fs.writeFile('./posts.json', JSON.stringify(posts, null, 4), (err) => {
        if (err) {
          console.error(err);
          res.status(500).send({ success: false, message: 'Failed to save the post.' });
        } else {
          res.send({ success: true, message: 'Post successfully saved.' });
        }
      });
    }
  });
});

app.get('/api/getPosts', (req, res) => {
  fs.readFile('./posts.json', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send({ success: false, message: 'Failed to read post data.' });
    } else {
      const posts = JSON.parse(data);
      res.send({ success: true, posts });
    }
  });
});

app.get('/api/posts/:postId', (req, res) => {
  const { postId } = req.params;

  fs.readFile('./posts.json', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send({ success: false, message: 'Failed to read post data.' });
    } else {
      const posts = JSON.parse(data);
      const post = posts.find((post) => post.postId === postId);

      if (!post) {
        res.status(404).send({ success: false, message: 'Post not found.' });
      } else {
        res.send({ success: true, post });
      }
    }
  });
});


