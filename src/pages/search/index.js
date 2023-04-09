import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./search.css";

const Search = () => {
  const [searchString, setSearchString] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const results = await axios.get(`/posts/search/${searchString}`);
      setSearchResults(results.data);
    };
    fetchData();
  }, [searchString]);

  const handleSearchStringChange = event => {
    setSearchString(event.target.value);
  };

  const handleSearchAuthorChange = event => {
    setSearchAuthor(event.target.value);
  };

  const handleSearchByString = async () => {
    const results = await axios.get(`/posts/search/${searchString}`);
    setSearchResults(results.data);
  };

  const handleSearchByAuthor = async () => {
    const results = await axios.get(`/posts/author/${searchAuthor}`);
    setSearchResults(results.data);
  };

  const handleSearchMostPosts = async () => {
    const results = await axios.get('/posts/most');
    setSearchResults(results.data);
  };

  const handleSearchLeastPosts = async () => {
    const results = await axios.get('/posts/least');
    setSearchResults(results.data);
  };

  return (
    <div>
      <input
        type="text"
        value={searchString}
        onChange={handleSearchStringChange}
      />
      <button onClick={handleSearchByString}>Search By String</button>
      <input
        type="text"
        value={searchAuthor}
        onChange={handleSearchAuthorChange}
      />
      <button onClick={handleSearchByAuthor}>Search By Author</button>
      <button onClick={handleSearchMostPosts}>Search User with Most Posts</button>
      <button onClick={handleSearchLeastPosts}>Search User with Least Posts</button>
      <ul>
        {searchResults.map(result => (
          <li key={result.id}>{result.content}</li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
