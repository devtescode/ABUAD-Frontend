# Customer Profile

The customer profile page lets users update their name, location, bio and profile photo. The avatar can be chosen with the file picker or dragged onto the upload zone; a preview is shown immediately and the image is uploaded with the rest of the form when changes are saved.

## API

- `PUT /usercreative/customer/profile` (Bearer auth, multipart/form-data): `name`, `about`, `location`, optional `avatar`.
- `GET /usercreative/me` fetches the current user.

Accepted avatar files: JPG, PNG or WebP, up to 5 MB. Uploaded images are stored in Cloudinary under the `usercreative/customers` folder.

## Components

- `CustomerProfile` (in `../CustomerProfile.tsx`) — page state, drag/drop handling, save flow.
- `ProfileHero` — cover, avatar preview and upload zone.
- `ProfileForm` — personal information fields and save feedback.
- `ProfileStrength` — completion checklist and progress bar.
- `AccountCard` — read-only account details.
- `ProfileSkeleton` — loading placeholder.
- `useAvatarUpload` — file selection, preview URL and cleanup.
- `profileTypes` — form values, validation constants and helpers.
- `index.ts` — barrel re-exports.
