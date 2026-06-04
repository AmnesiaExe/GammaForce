"use client";

import { ReactNode, useEffect, useState } from "react";
import { Column, Flex, Text } from "@once-ui-system/core";

const THINK_MS = 1400;
const THINK_LINE_MS = 480;
const TYPE_MS_PER_CHAR = 14;

function useTypewriter(text: string, enabled: boolean, msPerChar = TYPE_MS_PER_CHAR) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    setCount(0);
    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(tick);
    }, msPerChar);
    return () => window.clearInterval(tick);
  }, [text, enabled, msPerChar]);

  return text.slice(0, count);
}

interface AiAnimatedNarrativeProps {
  title: string;
  thinkingLines: string[];
  fullText: string;
  resetKey: string;
  /** Show full text immediately; no thinking rotation or character typing */
  instantText?: boolean;
  badges?: ReactNode;
  children?: (visibleText: string, done: boolean) => ReactNode;
}

export function AiAnimatedNarrative({
  title,
  thinkingLines,
  fullText,
  resetKey,
  instantText = false,
  badges,
  children,
}: AiAnimatedNarrativeProps) {
  const [thinking, setThinking] = useState(!instantText);
  const [thinkIdx, setThinkIdx] = useState(0);
  const [typing, setTyping] = useState(false);

  const typed = useTypewriter(fullText, typing && !instantText);
  const done = instantText || (typing && typed.length >= fullText.length);
  const visible = instantText ? fullText : done ? fullText : typed;

  useEffect(() => {
    if (instantText) return;
    setThinking(true);
    setTyping(false);
    setThinkIdx(0);
    const rotate = window.setInterval(() => {
      setThinkIdx((i) => (i + 1) % thinkingLines.length);
    }, THINK_LINE_MS);
    const startType = window.setTimeout(() => {
      window.clearInterval(rotate);
      setThinking(false);
      setTyping(true);
    }, THINK_MS);
    return () => {
      window.clearInterval(rotate);
      window.clearTimeout(startType);
    };
  }, [resetKey, thinkingLines.length, instantText]);

  return (
    <section className="gov-ai-narrative">
      <Text variant="label-default-s" onBackground="brand-weak">
        {title}
      </Text>
      {!instantText && thinking && (
        <Flex gap="12" vertical="center" className="gov-ai-narrative-thinking">
          <span className="gov-ai-orb gov-ai-orb--sm" aria-hidden />
          <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-ai-think-line">
            {thinkingLines[thinkIdx]}
          </Text>
        </Flex>
      )}
      <Column gap="12" fillWidth>
        {badges}
        {(instantText || typing || done) &&
          (children ? (
            children(visible, done)
          ) : (
            <Text variant="body-default-s" className="gov-ai-narrative-text">
              {visible}
              {!instantText && typing && !done && (
                <span className="gov-ai-cursor" aria-hidden>
                  |
                </span>
              )}
            </Text>
          ))}
      </Column>
    </section>
  );
}
