import React, { Suspense } from "react";
import Loader from "../Loader.jsx";

const LazyPageWrapper = ({ children, message = "Loading page..." }) => {
  return (
    <Suspense fallback={<Loader message={message} />}>{children}</Suspense>
  );
};

export default LazyPageWrapper;
