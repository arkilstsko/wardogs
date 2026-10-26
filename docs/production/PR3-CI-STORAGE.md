# CI evidence retention and account quota

PR3 initial remote commit `b091a985b80bc232c84423a37ced5608f96f0848` ran workflow40310214117, job121529214447. Checkout/install, lint, typecheck,155 tests, dependency audit, build, Chromium install and all5 browser tests passed. The sole failing step was `actions/upload-artifact@v4`:

> Failed to CreateArtifact: Artifact storage quota has been hit. Unable to upload any new artifacts. Usage is recalculated every6–12hours.

No evidence was uploaded by that step and the workflow is correctly recorded as failed. No unrelated artifacts were deleted and no billing/storage upgrade was enabled.

The correction keeps all functional checks as hard failures, exports actual unit/browser counts into GitHub’s job summary, and makes the additional debug ZIP opt-in through repository variable `UPLOAD_VERIFICATION_ARTIFACTS=true`. When enabled it retains data for one day and a failed upload still fails its step. This separates a test verdict from optional storage without discarding the failure history. Source/local screenshots and JSON evidence remain in the private repository. Owner/account storage maintenance is a separate decision.

The commercial-release readiness workflow remains a separate gate and intentionally fails for the unresolved product/human/visual/manufacturing requirements. A green engineering workflow is not release approval.

A loaded local rerun completed the100-game property computation in31.6seconds but exceeded its30-second harness deadline. The dedicated property-test allowance is120seconds; the100-game count, invariant assertions, fuzzing and all product performance targets are unchanged. The remote runner already passed those same assertions. This allowance is not a reducer/frame-time relaxation.
