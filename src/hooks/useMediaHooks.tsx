"use client";

import { useMediaQuery } from "@uidotdev/usehooks";

export const useMediaScreen = () => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 1024px)",
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 1025px) and (max-width : 1280px)",
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1281px)",
  );

  return {
    isSm: isSmallDevice,
    isMd: isMediumDevice,
    isLg: isLargeDevice,
    isXl: isExtraLargeDevice,
  };
};
