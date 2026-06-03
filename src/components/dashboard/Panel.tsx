"use client";

import { Column, Flex, Heading, Text } from "@once-ui-system/core";
import { ReactNode } from "react";

interface PanelProps extends React.ComponentProps<typeof Column> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  padding?: "0" | "16" | "20" | "24";
  fillHeight?: boolean;
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  padding = "24",
  fillHeight,
  className,
  ...rest
}: PanelProps) {
  return (
    <Column
      fillWidth
      fillHeight={fillHeight}
      background="surface"
      border="surface"
      radius="l"
      overflow="visible"
      className={className ? `gov-panel ${className}` : "gov-panel"}
      {...rest}
    >
      {(title || subtitle || action) && (
        <Flex
          fillWidth
          horizontal="between"
          vertical="center"
          paddingX="24"
          paddingY="16"
          borderBottom="neutral-alpha-weak"
          wrap
          gap="12"
        >
          <Column gap="4">
            {title && (
              <Heading variant="heading-strong-s">{title}</Heading>
            )}
            {subtitle && (
              <Text variant="body-default-xs" onBackground="neutral-weak">
                {subtitle}
              </Text>
            )}
          </Column>
          {action}
        </Flex>
      )}
      <Column padding={padding} gap="16" fillWidth flex={1}>
        {children}
      </Column>
    </Column>
  );
}
