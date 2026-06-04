"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Column, Flex, Text } from "@once-ui-system/core";
import { buildAdvisoryCalculationWorkings } from "@/lib/calculationWorkings";
import { AlertItem } from "@/lib/scoring";

interface CalculationDebugPanelProps {
  alert: AlertItem;
}

export function CalculationDebugPanel({ alert }: CalculationDebugPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [alert.id]);

  const workings = useMemo(
    () => (open ? buildAdvisoryCalculationWorkings(alert) : null),
    [alert, open],
  );

  return (
    <div className="gov-calc-debug-footer">
      <Flex
        horizontal="center"
        padding="16"
        fillWidth
        className="gov-calc-debug-toggle-bar"
      >
        <Button
          variant="secondary"
          label={
            open
              ? "Hide full score working"
              : "Show full score calculation (step-by-step maths)"
          }
          onClick={() => setOpen((v) => !v)}
        />
      </Flex>

      {open && workings && (
        <div className="gov-calc-debug">
          <Column gap="16" fillWidth padding="20">
            <Column gap="8">
              <Text variant="label-strong-s" onBackground="neutral-weak">
                CyberPriority fusion pipeline
              </Text>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Full working for {workings.advisoryId}. Recomputes the same functions as the
                production engine (scoreVulnerability → combinePriorityScore → rankAffectedAgencies).
              </Text>
              <div className="gov-calc-pipeline" aria-hidden>
                {workings.pipeline.map((step, i) => (
                  <span key={step} className="gov-calc-pipeline-step">
                    {i > 0 && <span className="gov-calc-pipeline-arrow">→</span>}
                    {step}
                  </span>
                ))}
              </div>
              <Text
                variant="label-default-xs"
                className={workings.allChecksPass ? "gov-calc-verify-ok" : "gov-calc-verify-warn"}
              >
                {workings.allChecksPass
                  ? "Integrity check passed. Debug maths match engine."
                  : "Rounding drift detected. See integrity check section."}
              </Text>
            </Column>

            {workings.sections.map((section) => (
              <Column key={section.title} gap="8" fillWidth className="gov-calc-debug-section">
                <Column gap="2">
                  <Text variant="label-default-s" onBackground="brand-weak">
                    {section.title}
                  </Text>
                  {section.subtitle && (
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      {section.subtitle}
                    </Text>
                  )}
                </Column>
                {section.lines.map((line) => (
                  <div
                    key={`${section.title}-${line.label}`}
                    className={`gov-calc-debug-row${line.ok === false ? " gov-calc-debug-row-fail" : ""}`}
                  >
                    <Text variant="label-default-xs" className="gov-calc-debug-label">
                      {line.label}
                    </Text>
                    <Text variant="body-default-xs" className="gov-calc-debug-expr">
                      {line.expression}
                    </Text>
                    <Text variant="body-default-xs" className="gov-calc-debug-result">
                      {line.result}
                    </Text>
                  </div>
                ))}
                {(section.footer || section.total) && (
                  <div className="gov-calc-debug-footer gov-calc-final-box">
                    {section.footer?.headline && (
                      <Text variant="label-strong-s" className="gov-calc-debug-footer-headline">
                        {section.footer.headline}
                      </Text>
                    )}
                    {section.footer ? (
                      <Column gap="8" fillWidth>
                        <Column gap="2" fillWidth>
                          <Text variant="label-default-xs" className="gov-calc-debug-footer-label">
                            How we got it
                          </Text>
                          <Text variant="body-default-xs" onBackground="neutral-weak">
                            {section.footer.got}
                          </Text>
                        </Column>
                        <Column gap="8" fillWidth>
                          <Text variant="label-default-xs" className="gov-calc-debug-footer-label">
                            How it&apos;s used (actual values)
                          </Text>
                          {section.footer.usageLines.map((line) => (
                            <div
                              key={`${section.title}-usage-${line.label}`}
                              className="gov-calc-debug-row gov-calc-debug-row--usage"
                            >
                              <Text variant="label-default-xs" className="gov-calc-debug-label">
                                {line.label}
                              </Text>
                              <Text variant="body-default-xs" className="gov-calc-debug-expr">
                                {line.expression}
                              </Text>
                              <Text variant="body-default-xs" className="gov-calc-debug-result">
                                {line.result}
                              </Text>
                            </div>
                          ))}
                        </Column>
                        {section.footer.usedIn && (
                          <Text variant="body-default-xs" onBackground="neutral-weak">
                            {section.footer.usedIn}
                          </Text>
                        )}
                      </Column>
                    ) : (
                      section.total && (
                        <Text variant="body-default-xs" onBackground="neutral-weak">
                          {section.total}
                        </Text>
                      )
                    )}
                  </div>
                )}
              </Column>
            ))}
          </Column>
        </div>
      )}
    </div>
  );
}
