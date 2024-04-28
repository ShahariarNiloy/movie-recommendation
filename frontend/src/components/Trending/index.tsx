import React, { useState } from "react";

import Carousel from "../../../components/carousel/Carousel";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../../components/switchTabs/SwitchTabs";

import useFetch from "../../../hooks/useFetch";

const Trending = () => {
  const { data, loading } = useFetch(`/trending/movie/`);

  return (
    <div className="carouselSection">
      <span className="carouselTitle">Trending</span>
      <Carousel data={data?.results} loading={loading} />
    </div>
  );
};

export default Trending;
