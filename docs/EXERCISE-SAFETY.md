# Exercise safety guidance

Implemented 2026-11-10. Educational prompts intended to reduce avoidable mistakes; no claim of injury prevention, clinical validation, form detection or individual medical clearance.

Follow-up: [batch-one technical review](BATCH-01-REVIEW.md) corrects push-up heel and seated foot contacts, adds the pulldown return instruction, and removes a forced curl height and hard shoulder-press lockout. Qualified-trainer review remains pending.

## Behaviour

- Every new workout opened through the app's start flow shows three unchecked preparation reminders: warm-up, stable space/equipment and manageable effort, and no current warning symptoms. All three must be checked before creating the session. Closing or cancelling creates nothing. Checks reset on the next opening and are not stored as health data.
- An active session resumes directly. The checklist does not determine medical eligibility; existing injury, health conditions or medical restrictions call for individual advice.
- Exercise pages, in-session instructions and the continuous-motion review include visible form guidance and a stop-for-pain cue. Ten exact exercise variants have specific notes plus a general effort reminder. Other catalogue entries and custom exercises explicitly receive general activity guidance. No matching by art slug or guessed exercise name.
- The workout footer has a persistent “Pain or dizziness? Stop here” control. It clears the rest timer and shows symptom guidance. It does not delete or change logged sets, mark unfinished work complete, restart the timer on close, diagnose symptoms, or certify a return to exercise.
- “End and save completed sets” uses the normal finish operation: retain only completed sets. Emergency guidance appears before the save action and does not depend on finishing the workout. Session elapsed time is not a paused activity timer.
- Sources are available inside the UI. External source pages require a connection; the guidance itself ships with the app and works offline.
- Four exact variants also correct inherited numbered instructions: squat/split-squat depth is limited by control rather than a compulsory horizontal thigh; split stance has no universal two-foot spacing; bridge lowering avoids a required vertebra-by-vertebra sequence; dumbbell bench lowering has no compulsory 90-degree angle. These corrections apply in Arabic and English and leave generated catalogue data and custom exercises intact.

## Primary references

General technique, warm-up before lifting, manageable load, controlled movement, breathing, stopping for pain and seeking technique help: [Mayo Clinic — Weight training: Do's and don'ts of proper technique](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/weight-training/art-20045842).

Gradual activity, hydration, symptoms and existing health concerns: [NIDDK — Tips to Keep Moving](https://www.niddk.nih.gov/health-information/weight-management/tips-get-active/tips-keep-moving). Equipment and environment: [NIDDK — Staying Active at Any Size](https://www.niddk.nih.gov/health-information/weight-management/staying-active-at-any-size.).

Chest symptoms requiring immediate help: [NHS — Chest pain](https://www.nhs.uk/symptoms/chest-pain/). The app says local emergency services rather than displaying the UK's number to users in other countries. Severe/unexplained breathlessness and faintness also warrant assessment: [Newcastle Hospitals NHS — Exercise and your health](https://www.newcastle-hospitals.nhs.uk/services/newcastle-occupational-health-service/information-for-staff/physiotherapy/self-help-leaflets/exercise-and-your-health-a-guide-to-getting-started/). Its rehabilitation progression advice is not used as a general return-to-exercise rule.

Gentle stretching without forcing painful movement: [AHA — Flexibility Exercise](https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/flexibility-exercise-stretching).

## Exact exercise notes

| Catalogue ID | Movement | ACE reference and scope |
| --- | --- | --- |
| 6YUfHPL | Bodyweight squat | [Squat](https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/): grounded heels, knee tracking, controlled depth with trunk stability. |
| I4hDWkc | Push-up | [Push-up](https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/): rigid trunk, aligned head, no sagging or isolated hip rise. |
| 9E25EOx | Bodyweight split squat | [Forward lunge](https://www.acefitness.org/resources/everyone/exercise-library/94/forward-lunge/): balance and lower-position knee/trunk alignment only; no instruction to step during the stationary split squat. |
| glute-bridge | Glute bridge | [Bridge](https://www.acefitness.org/resources/everyone/exercise-library/49/glute-bridge/): controlled hip lift without lumbar overextension. |
| bJYHBIN | Standing calf raise | [Wall-supported calf raise](https://www.acefitness.org/resources/everyone/exercise-library/73/standing-calf-raises-wall/): wall support and controlled heel motion. |
| NbVPDMW | Dumbbell curl | [Seated curl](https://www.acefitness.org/resources/everyone/exercise-library/44/seated-biceps-curl/): upper-arm/wrist stability and avoiding torso compensation; no seated setup instruction for this standing variant. |
| RVwzP10 | Cable pulldown | [Lat pulldown](https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/): front-of-chest path, steady trunk and no jerking. |
| fUBheHs | Cable seated row | [Seated row](https://www.acefitness.org/resources/everyone/exercise-library/168/seated-row/): steady trunk/wrists and controlled return. |
| 3d7wHyd | Seated dumbbell shoulder press | [Seated press](https://www.acefitness.org/resources/everyone/exercise-library/186/seated-shoulder-press/): supported back and avoiding trunk compensation; reference uses a machine, so no machine-specific setup is prescribed. |
| SpYC0Kp | Dumbbell bench press | [Chest press](https://www.acefitness.org/resources/everyone/exercise-library/19/chest-press/): stable bench contacts, grounded feet and controlled load. |

These are adapted, bilingual cues, not a claim that the animation or a user's technique has been reviewed by ACE or a clinician. No universal joint angle, load, depth, safe maximum, pain score or return interval is prescribed.

## Verification

- `npm test -- --reporter=dot`: 133 tests passed in 15 files (exit 0). Includes all-catalogue bilingual coverage, exact-variant/custom fallbacks, numbered instruction corrections, preparation cancellation/reset, blocked premature start, direct resume, and symptom help preserving recorded sets while stopping rest and saving only completed work. Happy DOM logs existing unavailable art-fetch/iframe messages.
- `npm run build`: passed, including TypeScript and PWA output. Existing large entry-chunk advisory remains.
- Browser QA at 390 × 844: Arabic checklist fits, primary action initially disabled, cancel returns to Today without a session, and exact squat cues plus corrected depth instructions render on the exercise page. No horizontal overflow observed (document width 375, viewport 390). Screenshots: `docs/motion/safety-preparation-mobile.jpg` and `docs/motion/safety-form-mobile.jpg`. Temporary viewport override reset after inspection.

Remaining limit: this is an educational safety layer. Actual exercise suitability and technique require individual assessment; the app does not observe the user's body, detect injury or validate equipment.
