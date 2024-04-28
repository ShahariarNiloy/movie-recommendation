import React, { useState, useEffect, ReactNode } from "react";

import axios from "axios";
import debounce from "lodash/debounce";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import InfiniteScroll from "react-infinite-scroll-component";
import "./App.scss";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";

const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNmU5MzM1Yjg5Y2E3NWE3MGJjY2UxYzcyYmZkMDQ4ZCIsInN1YiI6IjYzYmVkN2FiODU4Njc4MDBmMDhjZjI3NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.sQHes_rn51wewxY_7nZLxGssnd67J8ieiLOIo2Bg_FI";

const headers = {
  Authorization: "bearer " + TMDB_TOKEN,
};

import FallbackPoster from "./assets/no-poster.png";

interface Movie {
  id: number;
  title: string;
  imageUrl: string | null;
  release_year?: string;
}

const App = () => {
  const [background, setBackground] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const homeGenreList: string[] = [
    "Music",
    "Comedy",
    "TV Movie",
    "Romance",
    "Crime",
    "Western",
    "Fantasy",
    "Aniplex",
    "Animation",
    "History",
    "Action",
    "Documentary",
    "Foreign",
    "Thriller",
    "Mystery",
    "Drama",
    "Science Fiction",
    "Horror",
    "Family",
    "Adventure",
    "War",
  ];

  const { data, loading } = useFetch("/movie/upcoming");

  useEffect(() => {
    const fetchBackdrop = async () => {
      try {
        const { images } = await fetchDataFromApi("/configuration");
        const backdropBaseUrl = images.secure_base_url + "original";
        const bg =
          backdropBaseUrl +
          (data?.results?.[Math.floor(Math.random() * 20)]?.backdrop_path ??
            "");
        setBackground(bg);
      } catch (error) {
        return;
      }
    };

    fetchBackdrop();
  }, [data]);

  const getSuggestions = async (value: string) => {
    try {
      const response = await axios.get<string[]>(
        `http://127.0.0.1:5000/api/typeahead?query=${value}`
      );
      setSuggestions(response.data);
    } catch (error) {
      return;
    }
  };

  const getRecommendMovie = async (title: string) => {
    const requestData = { title };
    setIsLoading(true);

    try {
      const response = await axios.post<Movie[]>(
        "http://127.0.0.1:5000/api/recommend",
        requestData,
        { headers: { "Content-Type": "application/json" } }
      );

      const moviesWithImages = await Promise.all(
        response.data.map(async (movie) => {
          try {
            const tmdbId = movie.id;
            const tmdbResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=b97316ed479ee4226afefc88d1792909`
            );
            const imageUrl = `https://image.tmdb.org/t/p/w500${tmdbResponse.data.poster_path}`;
            return { ...movie, imageUrl };
          } catch (error) {
            return { ...movie, imageUrl: null };
          }
        })
      );
      window.scrollTo(0, 1000);
      setIsLoading(false);
      setMovies(moviesWithImages.reverse());
    } catch (error) {
      return;
    }
  };

  const getRecommendMovieByGenre = async (genre: string[]) => {
    setIsLoading(true);
    const requestData = { genres: [...genre] };

    try {
      const response = await axios.post<Movie[]>(
        "http://127.0.0.1:5000/api/recommend_by_genres",
        requestData,
        { headers: { "Content-Type": "application/json" } }
      );

      const moviesWithImages = await Promise.all(
        response.data.map(async (movie) => {
          try {
            const tmdbId = movie.id;
            const tmdbResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=b97316ed479ee4226afefc88d1792909`
            );
            const imageUrl = `https://image.tmdb.org/t/p/w500${tmdbResponse.data.poster_path}`;
            return { ...movie, imageUrl };
          } catch (error) {
            return { ...movie, imageUrl: null };
          }
        })
      );
      window.scrollTo(0, 1000);
      setIsLoading(false);
      setMovies(moviesWithImages.reverse());
    } catch (error) {
      setIsLoading(false);
    }
  };

  const debouncedGetSuggestions = debounce(getSuggestions, 300);

  const handleOnSearch = (string: string) => {
    debouncedGetSuggestions(string);
  };

  const handleOnSelect = (item: { name: string }) => {
    getRecommendMovie(item.name);
    setSelectedGenre([]);
  };

  const onTagClick = (genre: string) => {
    const clonedSelectedGenre = [...selectedGenre];
    const index = clonedSelectedGenre.indexOf(genre);
    if (index !== -1) {
      clonedSelectedGenre.splice(index, 1);
    } else {
      clonedSelectedGenre.push(genre);
    }
    setSelectedGenre(clonedSelectedGenre);
    getRecommendMovieByGenre(clonedSelectedGenre);
  };

  return (
    <>
      <header className={`header top`}>
        <ContentWrapper>
          <div className="logo">
            <span>Recommendation Engine</span>
          </div>
        </ContentWrapper>
      </header>
      <div className="homePage">
        <div className="heroBanner">
          {!loading && (
            <div className="backdrop-img">
              <Img src={background} />
            </div>
          )}

          <div className="opacity-layer"></div>
          <ContentWrapper>
            <div className="heroBannerContent">
              <span className="title">Welcome</span>
              <span className="subTitle">
                Thousands of movies, Get your recommendations.
              </span>
              <div style={{ width: 600 }}>
                <ReactSearchAutocomplete
                  items={suggestions
                    .slice(0, 10)
                    .map((s) => ({ id: s, name: s }))}
                  onSearch={handleOnSearch}
                  onSelect={handleOnSelect}
                  autoFocus
                  className="searchBar"
                  placeholder="Search Movies by Name"
                />
              </div>
            </div>
            <span
              style={{
                display: "flex",
                width: "100%",
                color: "white",
                position: "relative",
                margin: "40px 0px 10px 0px",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "20px",
              }}
            >
              Or Search By Genre(s)
            </span>
            <div className="buttonGrid">
              {homeGenreList.map((genre) => (
                <div
                  key={genre}
                  onClick={() => onTagClick(genre)}
                  className={
                    selectedGenre.includes(genre) ? "genreTagOFF" : "genreTagON"
                  }
                >
                  {genre}
                </div>
              ))}
            </div>
          </ContentWrapper>
        </div>
        <div className="searchResultsPage">
          {isLoading && <Spinner initial={true} />}
          {!isLoading && (
            <ContentWrapper>
              {movies.length > 0 ? (
                <InfiniteScroll
                  className="content"
                  dataLength={movies.length || 0}
                  hasMore
                  next={() => {}}
                  loader
                >
                  {movies.map((item, index) => (
                    <MovieCard key={index} data={item} />
                  ))}
                </InfiniteScroll>
              ) : (
                <span className="resultNotFound">
                  Sorry, Results not found!
                </span>
              )}
            </ContentWrapper>
          )}
        </div>
      </div>
      <footer className="footer">
        <ContentWrapper>
          <ul className="menuItems">
            <li className="menuItem">Terms Of Use</li>
            <li className="menuItem">Privacy-Policy</li>
            <li className="menuItem">About</li>
            <li className="menuItem">Blog</li>
            <li className="menuItem">FAQ</li>
          </ul>
          <div className="infoText">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur.
          </div>
          <div className="socialIcons">
            <span className="icon">
              <FaFacebookF />
            </span>
            <span className="icon">
              <FaInstagram />
            </span>
            <span className="icon">
              <FaTwitter />
            </span>
            <span className="icon">
              <FaLinkedin />
            </span>
          </div>
        </ContentWrapper>
      </footer>
    </>
  );
};

export default App;

interface ImgProps {
  src: string;
  className?: string;
}
function Img({ src, className }: ImgProps) {
  return (
    <LazyLoadImage className={className ?? ""} alt="" effect="blur" src={src} />
  );
}

function MovieCard({ data }: { data: Movie }) {
  const posterUrl = data.imageUrl ? data.imageUrl : FallbackPoster;
  return (
    <div className="movieCard">
      <div className="posterBlock">
        <Img className="posterImg" src={posterUrl} />
      </div>
      <div className="textBlock">
        <span className="title">{data.title}</span>
        <span className="date">{data?.release_year || ""}</span>
      </div>
    </div>
  );
}

async function fetchDataFromApi(url = "", params = {}) {
  try {
    const { data } = await axios.get(BASE_URL + url, {
      headers,
      params,
    });
    return data;
  } catch (err) {
    return err;
  }
}

function Spinner({ initial }: { initial: boolean }) {
  return (
    <div className={`loadingSpinner ${initial ? "initial" : ""}`}>
      <svg className="spinner" viewBox="0 0 50 50">
        <circle
          className="path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        ></circle>
      </svg>
    </div>
  );
}

function ContentWrapper({ children }: { children: ReactNode }) {
  return <div className="contentWrapper">{children}</div>;
}

function useFetch(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<string | null | boolean>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading("loading...");
    setData(null);
    setError(null);

    fetchDataFromApi(url)
      .then((res) => {
        setLoading(false);
        setData(res);
      })
      .catch(() => {
        setLoading(false);
        setError("Something went wrong!");
      });
  }, [url]);

  return { data, loading, error };
}
