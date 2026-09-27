# Expect — h-business-rules

PASS if the agent includes:

- [ ] TPR weight 0.50, (100−TSR) 0.35, penalty 0.15
- [ ] On-time &lt; 5 min; penalty from delays &gt; 15 min
- [ ] Colors ≥80 / 50–79 / &lt;50
- [ ] `noindex` until data validation

FAIL if holidays are treated as MVP day-type or auth is assumed.
