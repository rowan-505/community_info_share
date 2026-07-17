# STEP: UI Create Post

## Files Changed

- `frontend/src/views/CreatePost.tsx`
  - Reworked the Create Post view into a centered card layout.
  - Updated the page title to `Create Community Post`.
  - Added the requested subtitle copy.
  - Switched error display to the shared alert styling.
  - Preserved the existing successful-create behavior.

- `frontend/src/components/CreatePostForm.tsx`
  - Added placeholders for title, description, and topic.
  - Added helper text under each field.
  - Added reusable form/input/textarea classes.
  - Styled the submit button as a primary action.
  - Kept the submitted payload shape unchanged.

- `frontend/src/App.css`
  - Added Create Post card layout styles.
  - Added form helper text styling.
  - Added mobile full-width submit behavior.

## Form Improvements

- Title field placeholder:
  - `Example: Heavy rain near local market`
- Description field placeholder:
  - `Describe what happened, where it happened, and what people should know.`
- Topic field placeholder:
  - `safety, transport, event, weather, lost-found, announcement`
- Helper text explains what users should provide without changing validation.
- The form sits in a clean white card and stays readable on narrow screens.

## Loading, Error, And Success Behavior

- Loading state remains the existing `Submitting...` label during submission.
- Error messages now render as styled alerts.
- Successful create keeps the existing behavior: the API call completes, then the app returns to the Free Board through the existing `onCreated()` flow.

## Boundaries

- No backend logic changed.
- No API clients changed.
- No API contracts changed.
- The create-post request body remains `{ title, description, topic }`.
