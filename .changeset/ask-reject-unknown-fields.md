---
"@howaboua/pi-ask": patch
---

Ask now rejects unknown or misnamed fields, such as `options` in place of `choices`, with an error naming the field and the accepted shape. Previously the input was silently dropped, so a question could appear without its choices.
