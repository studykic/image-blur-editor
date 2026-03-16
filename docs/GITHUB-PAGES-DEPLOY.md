# GitHub Pages Deployment

## Current status

This project is prepared for free deployment on GitHub Pages.

Included setup:

- Vite base path is resolved automatically for GitHub Pages
- GitHub Actions workflow builds and deploys the `dist` folder
- local-only files and temporary logs are ignored by Git

## What is still required

Publishing needs a real GitHub repository.
This local folder was not connected to GitHub yet, so the final public URL cannot be created until a remote repository exists.

## Recommended steps

1. Create a new GitHub repository
2. Push this project to the `main` branch
3. In GitHub repository settings, open `Pages`
4. Set the source to `GitHub Actions` if it is not already selected
5. Push again or run the workflow manually
6. Wait for the `Deploy to GitHub Pages` workflow to finish
7. Open the published URL from the workflow summary or Pages settings

## Notes

- If the repository name is `username.github.io`, the app builds with `/`
- If the repository is a project repo, the app builds with `/<repo-name>/`
- No separate server is required
- Downloads and image editing still run locally in the browser
