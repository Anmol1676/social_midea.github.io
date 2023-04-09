// ./pages/feed 


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './feed.css';


const Feed = ({ channelId,loginUsername }) => {
  
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  
  const [commentInputs, setCommentInputs] = useState({});
  const [likeCount, setLikeCount] = useState({});
  const [dislikeCount, setDislikeCount] = useState({});


  const handleCommentInputChange = (e, postId) => {
    setCommentInputs((prevInputs) => ({
      ...prevInputs,
      [postId]: e.target.value,
    }));
  };

  const likePost = async (postId) => {
    try {
      await axios.patch(`http://localhost:4000/posts/${postId}/likes`);
      setLikeCount((prevCounts) => ({
        ...prevCounts,
        [postId]: (prevCounts[postId] || 0) + 1,
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const dislikePost = async (postId) => {
    try {
      await axios.patch(`http://localhost:4000/posts/${postId}/dislikes`);
      setDislikeCount((prevCounts) => ({
        ...prevCounts,
        [postId]: (prevCounts[postId] || 0) + 1,
      }));
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/channels/${channelId}/posts`);
        const updatedPosts = response.data;
        setPosts(updatedPosts);
        
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
  
    fetchPosts();

    const socket = io.connect('http://localhost:4000');
    socket.on('new post', (post) => {
      setPosts((prevPosts) => [...prevPosts, { ...post, comments: [] }]);
    
    });
    socket.on('new comment', (comment) => {
      console.log('New comment received:', comment); 

      setPosts((prevPosts) =>
        prevPosts.map(post => {
          if (post.id === comment.post_id) {
            return {
              ...post,
              comments: [...post.comments, comment],
            };
          }
          return post;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [channelId]);

  const createPost = async () => {
    try {
      await axios.post(`http://localhost:4000/channels/${channelId}/posts`, {
        content: newPostContent,
        author: loginUsername , // Change this to the current logged-in user
      });
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:4000/channels/${channelId}/posts/${postId}`, {
        data: { author: loginUsername } // Change this to the current logged-in user
      });
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const createComment = async (postId, index) => {
    try {
      await axios.post(`http://localhost:4000/posts/${postId}/comments`, {
        content: commentInputs[postId],
        author: loginUsername , // Change this to the current logged-in user
      });
  
      setCommentInputs((prevInputs) => ({
        ...prevInputs,
        [postId]: '',
      }));
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  return (
    <div className="feed">
      <div className="feed__inputContainer">
        <input
          type="text"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Write a new post..."
        />
        <button onClick={createPost}>Post</button>
      </div>
      <div className="feed__posts">
        {posts ? (
         posts.map((post) => (
          <div key={post.id} className="feed__post">
            <h3>{post.author}</h3>
            <p>{post.content}</p>
            {loginUsername === 'admin' && (
                <button onClick={() => deletePost(post.id)}
                >Delete</button>
              )}
              <div className="feed__post-reactions">
                <span className="like-button" onClick={() => likePost(post.id)}>
                  Like ({likeCount[post.id] || 0})
                  </span>
                  <span className="dislike-button" onClick={() => dislikePost(post.id)}>
                    Dislike ({dislikeCount[post.id] || 0})
                     </span>
                     </div>
              <div className="feed__comments">
                <h4>All Comments:</h4>
                {post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment.id} className="feed__comment">
                      <h4>{comment.author}</h4>
                      <p>{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
              <div className="feed__commentInputContainer">
                <input
                  type="text"
                  value={commentInputs[post.id] || ""}
                  onChange={(e) => handleCommentInputChange(e, post.id)}
                  placeholder="Write a new comment..."
                />
                <button
                  onClick={() => {
                    const content = commentInputs[post.id];
                    if (content) {
                      createComment(post.id, posts.indexOf(post)); // Pass the index of the post
                    }
                  }}
                >
                  Comment
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Loading posts...</p>
        )}
      </div>
    </div>
  );
};
  
export default Feed;
  