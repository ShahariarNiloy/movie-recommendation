/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import "./styles.scss";

import Img from "../Img";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HeroBanner = ({ url }: { url: any }) => {
  const [background, setBackground] = useState("");

  return (
    <div className="heroBanner">
      {/* {!loading && (
        <div className="backdrop-img">
          <Img src={background} className="" />
        </div>
      )} */}

      <div className="opacity-layer"></div>
      <div className="contentWrapper">
        <div className="heroBannerContent">
          <span className="title">Welcome.</span>
          <span className="subTitle">
            Millions of movies, TV shows and people to discover. Explore now.
          </span>
          <div className="searchInput">
            <input
              type="text"
              placeholder="Search for a movie or tv show...."
              //   onChange={(e) => setQuery(e.target.value)}
              //   onKeyUp={searchQueryHandler}
            />
            <button>Search</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
