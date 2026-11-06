# VoiceFirst B0 | Interactive A1 editorial feedback | 2026-11-05

The new A1 preview is for internal **editorial testing only**, not the public course.

The shared TypeScript core now allows an editor to try three authored evidence questions across each of the existing 24 A1 situational scripts in English (Canada), French (Canada) and Spanish. Choices have deterministic shuffled order. Typed responses use the existing deterministic answer evaluator and a limited list of independently written alternatives. Any other phrasing remains **unverified**, with no automatic penalty. Reviewers can show the original dialogue, skip, retry and continue.

The React Native preview is inside the explicit `__DEV__` editorial control. It does not use the microphone, persist user input or update skill progress. Results are always `countsAsMastery:false`, `recordedProgress:false`, and `publicAvailable:false`. No new learning engine or dependency was introduced.

Tests cover all 24 scripts, authored variants, unsupported choices, null and malformed state, and absence of public navigation.

**Not yet ready:** local licensed audio, regional human review, validated diverse answers, genuine listening assessments, offline physical phone testing and full CEFR A1-C2 course coverage. The editor is NOT a pronunciation assessment, CEFR certificate or public lesson.

Further work: genuine reviewed local audio for a pilot, multiple valid answers and feedback, then integrate approved materials with the existing skill/memory scheduler. Preserve main, the security gate, free access and no paid services or continuous recording.
