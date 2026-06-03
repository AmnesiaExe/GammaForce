import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";
import "@/resources/custom.css";

import classNames from "classnames";
import { Column, Flex } from "@once-ui-system/core";
import { Providers } from "@/components/Providers";
import { SocBackground } from "@/components/SocBackground";
import { dataStyle, fonts, style } from "@/resources/config";

export const metadata = {
  title: "Threat & Vulnerability Prioritisation | WA Government SOC",
  description:
    "Operational dashboard for prioritising vulnerability alerts and threat intelligence for WA Government agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Flex
      suppressHydrationWarning
      as="html"
      lang="en"
      fillWidth
      className={classNames(
        fonts.heading.variable,
        fonts.body.variable,
        fonts.label.variable,
        fonts.code.variable,
      )}
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const root = document.documentElement;
                  const config = ${JSON.stringify({
                    brand: style.brand,
                    accent: style.accent,
                    neutral: style.neutral,
                    solid: style.solid,
                    "solid-style": style.solidStyle,
                    border: style.border,
                    surface: style.surface,
                    transition: style.transition,
                    scaling: style.scaling,
                    "viz-style": dataStyle.variant,
                  })};
                  Object.entries(config).forEach(function(entry) {
                    root.setAttribute("data-" + entry[0], entry[1]);
                  });
                  root.setAttribute("data-theme", "dark");
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `,
          }}
        />
      </head>
      <Providers>
        <Column
          as="body"
          position="relative"
          fillWidth
          margin="0"
          padding="0"
          style={{ minHeight: "100vh", height: "100%" }}
        >
          <SocBackground />
          <Flex
            position="relative"
            fillWidth
            direction="column"
            flex={1}
            className="gov-content-layer"
            style={{ minHeight: "100vh", zIndex: 2, isolation: "isolate" }}
          >
            {children}
          </Flex>
        </Column>
      </Providers>
    </Flex>
  );
}
