"use client";

import { Background, Flex, opacity } from "@once-ui-system/core";

/** Subtle page backdrop only. Content panels use surface tokens on top. */
export function SocBackground() {
  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      fillWidth
      pointerEvents="none"
      style={{ zIndex: 0, height: "100vh", width: "100%" }}
    >
      <Background
        position="absolute"
        top="0"
        left="0"
        fill
        fillWidth
        style={{ height: "100vh" }}
        gradient={{
          display: true,
          opacity: 100 as opacity,
          x: 50,
          y: 0,
          width: 100,
          height: 45,
          tilt: 0,
          colorStart: "brand-background-weak",
          colorEnd: "page-background",
        }}
        grid={{
          display: true,
          opacity: 4 as opacity,
          color: "neutral-alpha-weak",
          width: "3rem",
          height: "3rem",
        }}
        dots={{ display: false, opacity: 0 as opacity }}
        lines={{ display: false, opacity: 0 as opacity }}
      />
    </Flex>
  );
}
