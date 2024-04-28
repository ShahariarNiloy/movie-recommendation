from flask import Flask, render_template, request, jsonify
import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask_cors import CORS  
import random

app = Flask(__name__)
CORS(app)

movies = pd.read_csv("movies.csv")

movies = movies.dropna()

def clean_title(title):
    if isinstance(title, str):
        title = re.sub(r"[^a-zA-Z0-9 ]", "", title)
    return title

movies["clean_title"] = movies["title"].apply(clean_title)
movies['clean_title'] = movies['clean_title'].fillna('')
vectorizer = TfidfVectorizer(ngram_range=(1, 2))
tfidf = vectorizer.fit_transform(movies["clean_title"])

genre_matrix = movies[["Music", "Comedy", "TV Movie", "Romance", "Crime",
                       "Western", "Fantasy", "Aniplex", "Animation", "History",
                       "Action", "Documentary", "Foreign", "Thriller", "Mystery",
                       "Drama", "Science Fiction", "Horror", "Family", "Adventure",
                       "War"]].values

def search(title):
    title = clean_title(title)
    query_vec = vectorizer.transform([title])
    similarity = cosine_similarity(query_vec, tfidf).flatten()
    indices = np.argpartition(similarity, -5)[-5:]
    results = movies.iloc[indices].iloc[::-1]
    return results

def find_similar_movies(movie_id):
    if movie_id not in movies["id"].values:
        return pd.DataFrame()
    
    target_movie = movies[movies["id"] == movie_id].iloc[0]
    
    title_similarity = cosine_similarity(tfidf[movie_id], tfidf).flatten() if movie_id < len(movies) else np.zeros(len(movies))
    
    target_genres = target_movie[["Music", "Comedy", "TV Movie", "Romance", "Crime", "Western", "Fantasy",
                                  "Aniplex", "Animation", "History", "Action", "Documentary", "Foreign",
                                  "Thriller", "Mystery", "Drama", "Science Fiction", "Horror", "Family",
                                  "Adventure", "War"]].values
                                  
    genre_similarity = np.sum(genre_matrix * target_genres, axis=1)
    
    target_cast_names = target_movie["cast_names"].split("|")
    cast_similarity = movies["cast_names"].apply(lambda x: len(set(target_cast_names).intersection(x.split("|")))).values
    
    combined_similarity = (0.5 * title_similarity)  + (0.2 * cast_similarity) +  (0.3 * genre_similarity)
    
    indices = np.argpartition(combined_similarity, -20)[-20:]
    indices_sorted = indices[np.argsort(combined_similarity[indices])][::-1]
    
    similar_movies = movies.iloc[indices].reset_index(drop=True)
    
    return similar_movies[["id", "title","id","vote_average","release_year"]]


@app.route('/api/typeahead', methods=['GET'])
def typeahead():
    query = request.args.get('query', '')
    results = movies[movies["title"].str.contains(query, case=False)]["title"].values.tolist()[:10]
    return jsonify(results)


@app.route('/api/recommend_by_genres', methods=['POST'])
def recommend_by_genres():
    genres = request.json.get('genres')
    if not genres:
        return jsonify({'error': 'Genres are required'}), 400
    
    genre_columns = ["Music", "Comedy", "TV Movie", "Romance", "Crime", "Western", "Fantasy",
                     "Aniplex", "Animation", "History", "Action", "Documentary", "Foreign",
                     "Thriller", "Mystery", "Drama", "Science Fiction", "Horror", "Family",
                     "Adventure", "War"]
    
    input_genres = np.zeros(len(genre_columns))
    
    for genre in genres:
        if genre in genre_columns:
            input_genres[genre_columns.index(genre)] = 1
    
    genre_similarity = np.dot(genre_matrix, input_genres)
    
    max_similarity = np.max(genre_similarity)
    if max_similarity > 0:
        genre_similarity /= max_similarity
    
    indices = np.argpartition(genre_similarity, -20)[-20:]
    indices_sorted = indices[np.argsort(genre_similarity[indices])][::-1]
    
    similar_movies = movies.iloc[indices_sorted].reset_index(drop=True)
    
    similar_movies = similar_movies.sample(frac=1).reset_index(drop=True)
    
    similar_movies = similar_movies.sort_values(by=['vote_average', 'id'], ascending=[False, True])
    
    recommendations = similar_movies[["title", "id", "vote_average","release_year"]].to_dict('records')
    return jsonify(recommendations)



@app.route('/api/recommend', methods=['POST'])
def recommend_movies():
    movie_title = request.json.get('title')
    if not movie_title:
        return jsonify({'error': 'Movie title is required'}), 400
    results = search(movie_title)
    if results.empty:
        return jsonify({'error': 'No movies found'}), 404
    movie_id = results.iloc[0]["id"]
    recommendations = find_similar_movies(movie_id).reset_index().to_dict('records')
    return jsonify(recommendations)

@app.route('/')
def index():
    return "App running..."

if __name__ == '__main__':
    app.run(debug=True,port=500)
